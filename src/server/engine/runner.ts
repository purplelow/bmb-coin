/**
 * 24/7 server-side trading engine — SERVER ONLY.
 *
 * Runs inside the Next.js server process (started from instrumentation.ts),
 * so bots keep trading with real money while the browser is closed. The
 * machine running `pnpm dev`/`pnpm start` must stay awake — that is the only
 * remaining dependency.
 *
 * Every tick (20s) it:
 *  1. loads the operator's settings + bots from SQLite (the UI writes there),
 *  2. does nothing unless tradingMode === 'live' and Upbit keys exist,
 *  3. per running bot: stop-loss/take-profit first, then strategy signals,
 *  4. places REAL orders through the server Upbit client (hard caps enforced
 *     by guards.ts in this same process),
 *  5. writes updated bot stats + signals back to SQLite for the UI.
 *
 * The client-side engine only runs paper trading (test mode); this runner is
 * the ONLY thing that auto-trades real money — no double execution.
 */

import { and, eq } from 'drizzle-orm';
import { evaluateStrategy } from '@/features/trading/strategies';
import { db, schema } from '@/server/db';
import {
  fetchBalances,
  fetchCandles,
  fetchOrderbookSpread,
  fetchOrderFill,
  placeOrder,
} from '@/server/upbit/client';
import { assertBuyWithinCaps, maxOrderKRW, maxSpreadPct, recordBuy } from '@/server/upbit/guards';
import { hasUpbitKeys } from '@/server/upbit/signing';
import { uid } from '@/shared/lib/id';
import type { Balance, Bot, Signal, SignalEvent } from '@/types/domain';

const TICK_MS = 20_000;
const SIGNAL_CAP = 100;

// ── In-memory per-bot state (recomputed cheaply after restarts) ──

interface BotRunState {
  lastSignal: Signal | null;
  lastActedCandleTs: number;
  riskSellInFlight: boolean;
}

interface EngineStatus {
  running: boolean;
  lastTickAt: number | null;
  lastError: string | null;
  mode: 'idle' | 'live';
  activeBots: number;
  ordersPlaced: number;
}

interface EngineGlobal {
  timer: ReturnType<typeof setInterval> | null;
  ticking: boolean;
  botStates: Map<string, BotRunState>;
  status: EngineStatus;
}

// Survives dev-mode module reloads; one engine per server process.
const g = globalThis as unknown as { __koinlabEngine?: EngineGlobal };

function engineState(): EngineGlobal {
  if (!g.__koinlabEngine) {
    g.__koinlabEngine = {
      timer: null,
      ticking: false,
      botStates: new Map(),
      status: {
        running: false,
        lastTickAt: null,
        lastError: null,
        mode: 'idle',
        activeBots: 0,
        ordersPlaced: 0,
      },
    };
  }
  return g.__koinlabEngine;
}

export function getEngineStatus(): EngineStatus {
  return { ...engineState().status };
}

export function startServerEngine(): void {
  const state = engineState();
  if (state.timer !== null) return; // already running (hot reload)
  state.status.running = true;
  state.timer = setInterval(() => {
    void tick();
  }, TICK_MS);
  console.log('[koinlab-engine] 24/7 server trading engine started');
}

// ── DB helpers (userData JSON documents, zustand-persist shape) ──

async function readUserData<T>(userId: string, key: string): Promise<T | null> {
  const rows = await db
    .select({ value: schema.userData.value })
    .from(schema.userData)
    .where(and(eq(schema.userData.userId, userId), eq(schema.userData.key, key)))
    .limit(1);
  const raw = rows[0]?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeUserData(userId: string, key: string, value: unknown): Promise<void> {
  await db
    .insert(schema.userData)
    .values({ userId, key, value: JSON.stringify(value), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.userData.userId, schema.userData.key],
      set: { value: JSON.stringify(value), updatedAt: new Date() },
    });
}

interface PersistDoc<T> {
  state: T;
  version: number;
}

// ── Tick ─────────────────────────────────────────────────────────

async function tick(): Promise<void> {
  const state = engineState();
  if (state.ticking) return; // previous tick still in flight
  state.ticking = true;

  try {
    state.status.lastTickAt = Date.now();
    state.status.lastError = null;

    if (!hasUpbitKeys()) {
      state.status.mode = 'idle';
      return;
    }

    // Single-operator service: the first (only) user owns the bots.
    const users = await db.select({ id: schema.user.id }).from(schema.user).limit(1);
    const userId = users[0]?.id;
    if (!userId) {
      state.status.mode = 'idle';
      return;
    }

    const settingsDoc = await readUserData<
      PersistDoc<{ tradingMode?: string; orderPreset?: number; liveAutoBuy?: boolean }>
    >(userId, 'settings');
    const settings = settingsDoc?.state;
    if (settings?.tradingMode !== 'live') {
      state.status.mode = 'idle';
      return;
    }
    state.status.mode = 'live';

    const botsDoc = await readUserData<PersistDoc<{ bots: Bot[] }>>(userId, 'bots');
    const bots = botsDoc?.state.bots ?? [];
    const running = bots.filter((b) => b.status === 'running');
    state.status.activeBots = running.length;
    if (running.length === 0) return;

    // One balances snapshot per tick (rate-limit friendly).
    const balances = await fetchBalances();

    let botsChanged = false;
    const newSignals: SignalEvent[] = [];

    for (const bot of running) {
      try {
        const acted = await processBot(
          bot,
          balances,
          settings.orderPreset ?? 5_000,
          settings.liveAutoBuy === true,
          newSignals,
        );
        if (acted) botsChanged = true;
      } catch (e) {
        state.status.lastError = e instanceof Error ? e.message : String(e);
      }
    }

    if (botsChanged) {
      await writeUserData(userId, 'bots', { state: { bots }, version: botsDoc?.version ?? 0 });
    }
    if (newSignals.length > 0) {
      state.status.ordersPlaced += newSignals.length;
      const prev =
        (await readUserData<{ signals: SignalEvent[] }>(userId, 'server-signals'))?.signals ?? [];
      await writeUserData(userId, 'server-signals', {
        signals: [...newSignals, ...prev].slice(0, SIGNAL_CAP),
      });
    }
  } catch (e) {
    engineState().status.lastError = e instanceof Error ? e.message : String(e);
  } finally {
    state.ticking = false;
  }
}

// ── Per-bot processing (mirrors the client engine's live rules) ──

function runState(botId: string): BotRunState {
  const s = engineState();
  let rs = s.botStates.get(botId);
  if (!rs) {
    rs = { lastSignal: null, lastActedCandleTs: 0, riskSellInFlight: false };
    s.botStates.set(botId, rs);
  }
  return rs;
}

/** Returns true when the bot's stats changed (order placed). */
async function processBot(
  bot: Bot,
  balances: Balance[],
  orderPreset: number,
  liveAutoBuy: boolean,
  outSignals: SignalEvent[],
): Promise<boolean> {
  const rs = runState(bot.id);
  const base = bot.market.split('-')[1] ?? bot.market;
  const baseBalance = balances.find((b) => b.currency === base);
  const krwBalance = balances.find((b) => b.currency === 'KRW');
  const qty = baseBalance?.balance ?? 0;
  const avgBuyPrice = baseBalance?.avgBuyPrice ?? 0;

  const lookback =
    bot.strategy.type === 'ma_cross'
      ? Math.max(bot.strategy.params.longPeriod, bot.strategy.params.shortPeriod) + 5
      : bot.strategy.params.period + 5;

  // candleUnit이 없는 구형 봇은 기존 동작(1분봉) 유지.
  const candles = await fetchCandles(bot.market, bot.candleUnit ?? 1, Math.min(lookback, 200));
  const lastCandle = candles[candles.length - 1];
  if (!lastCandle) return false;
  const currentPrice = lastCandle.close;

  // 1) Stop-loss / take-profit — every tick, regardless of candle boundaries.
  const risk = bot.risk;
  if (
    risk &&
    (risk.stopLossPct != null || risk.takeProfitPct != null) &&
    !rs.riskSellInFlight &&
    qty > 0 &&
    avgBuyPrice > 0
  ) {
    const pnlRate = (currentPrice - avgBuyPrice) / avgBuyPrice;
    const pctText = `${pnlRate >= 0 ? '+' : ''}${(pnlRate * 100).toFixed(1)}%`;
    let reason: string | null = null;
    if (risk.stopLossPct != null && pnlRate <= -risk.stopLossPct / 100) {
      reason = `손절 (${pctText})`;
    } else if (risk.takeProfitPct != null && pnlRate >= risk.takeProfitPct / 100) {
      reason = `익절 (${pctText})`;
    }
    if (reason !== null) {
      rs.riskSellInFlight = true;
      try {
        const order = await placeOrder({
          market: bot.market,
          side: 'ask',
          ord_type: 'market',
          volume: qty,
        });
        rs.lastSignal = 'sell';
        await settleSell(bot, order.id, currentPrice, qty, avgBuyPrice);
        outSignals.push(makeSignal(bot, 'sell', reason, currentPrice));
        return true;
      } finally {
        rs.riskSellInFlight = false;
      }
    }
  }

  // 2) Strategy — act at most once per new candle, on signal transitions only.
  if (lastCandle.timestamp === rs.lastActedCandleTs) return false;
  const { signal, reason } = evaluateStrategy(bot.strategy, candles);
  if (signal === rs.lastSignal || signal === 'hold') {
    rs.lastSignal = signal;
    return false;
  }
  const prev = rs.lastSignal;
  rs.lastSignal = signal;
  rs.lastActedCandleTs = lastCandle.timestamp;

  if (signal === 'buy' && prev !== 'buy') {
    // Live safety: auto-buy must be explicitly enabled. 봇에 설정한 주문 금액이
    // 실제 매수 금액이고(없으면 설정의 기본 주문 금액), 1회 하드캡을 넘으면
    // 캡까지로 줄여서 산다. 일 한도는 assertBuyWithinCaps가 검사.
    if (!liveAutoBuy) return false;

    // 스프레드 가드: 호가 간격이 넓은 마켓(저가 코인)은 시장가로 사는 순간
    // 스프레드만큼 손실이 확정된다 — 매수를 건너뛰고 사유를 신호 로그에 남긴다.
    const spread = await fetchOrderbookSpread(bot.market);
    if (spread.spreadPct > maxSpreadPct()) {
      outSignals.push(
        makeSignal(
          bot,
          'hold',
          `매수 보류 — 호가 스프레드 ${spread.spreadPct.toFixed(2)}% > 한도 ${maxSpreadPct()}%`,
          currentPrice,
        ),
      );
      return false;
    }

    const amount = Math.min(
      bot.strategy.params.orderAmount ?? orderPreset,
      maxOrderKRW(),
    );
    if ((krwBalance?.balance ?? 0) < amount) return false;
    assertBuyWithinCaps(amount); // throws CapError when over per-order/daily cap
    const order = await placeOrder({
      market: bot.market,
      side: 'bid',
      ord_type: 'price',
      price: amount,
    });
    recordBuy(amount);
    bot.stats.trades += 1;
    outSignals.push(makeSignal(bot, 'buy', reason, currentPrice));
    void order;
    return true;
  }

  if (signal === 'sell' && prev !== 'sell' && qty > 0) {
    const order = await placeOrder({
      market: bot.market,
      side: 'ask',
      ord_type: 'market',
      volume: qty,
    });
    await settleSell(bot, order.id, currentPrice, qty, avgBuyPrice);
    outSignals.push(makeSignal(bot, 'sell', reason, currentPrice));
    return true;
  }

  return false;
}

/**
 * 매도 정산 — 실제 체결 내역 기준으로 P&L을 기록한다.
 *
 * 시장가 매도는 접수 응답에 체결 정보가 없어서, 잠시 기다렸다 주문 상세를
 * 조회해 실체결 금액·수량·수수료를 쓴다. 끝내 조회에 실패하면 캔들 종가
 * 추정으로 폴백한다(종가는 실제 체결가와 달라 P&L이 부정확할 수 있음).
 */
async function settleSell(
  bot: Bot,
  orderId: string,
  fallbackPrice: number,
  requestedQty: number,
  avgBuyPrice: number,
): Promise<void> {
  let proceeds = fallbackPrice * requestedQty;
  let fee = 0;
  let qty = requestedQty;

  for (let attempt = 0; attempt < 3; attempt++) {
    await new Promise((r) => setTimeout(r, 1_000));
    try {
      const fill = await fetchOrderFill(orderId);
      if (fill.executedVolume > 0 && fill.executedFunds > 0) {
        proceeds = fill.executedFunds;
        fee = fill.paidFee;
        qty = fill.executedVolume;
      }
      if (fill.done) break;
    } catch {
      // 일시적 조회 실패 — 재시도 후에도 안 되면 폴백값 사용.
    }
  }

  const cost = avgBuyPrice * qty;
  const pnl = proceeds - fee - cost;
  bot.stats.trades += 1;
  if (pnl > 0) bot.stats.wins += 1;
  else if (pnl < 0) bot.stats.losses += 1;
  bot.stats.realizedPnl += pnl;
  // 수익률은 "이번 매도 원가"가 아닌 "누적 투입 원가" 대비 — 매도 한 번의
  // 원가로 나누면 누적 손익이 수백 %로 부풀어 보인다(기존 버그).
  bot.stats.totalCost = (bot.stats.totalCost ?? 0) + cost;
  bot.stats.returnRate = bot.stats.totalCost > 0 ? bot.stats.realizedPnl / bot.stats.totalCost : 0;
}

function makeSignal(bot: Bot, signal: Signal, reason: string, price: number): SignalEvent {
  return {
    id: uid('srv-sig'),
    botId: bot.id,
    market: bot.market,
    signal,
    price,
    reason,
    timestamp: Date.now(),
  };
}
