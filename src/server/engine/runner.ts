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
import { fetchBalances, fetchCandles, placeOrder } from '@/server/upbit/client';
import { assertBuyWithinCaps, recordBuy } from '@/server/upbit/guards';
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

  const candles = await fetchCandles(bot.market, 1, Math.min(lookback, 200));
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
        applySellStats(bot, order.paidFee, currentPrice, qty, avgBuyPrice);
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
    // Live safety: auto-buy must be explicitly enabled; amount is clamped to
    // the small-order preset and re-checked against the server hard caps.
    if (!liveAutoBuy) return false;
    const amount = Math.min(
      bot.strategy.params.orderAmount ?? orderPreset,
      orderPreset,
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
    applySellStats(bot, order.paidFee, currentPrice, qty, avgBuyPrice);
    outSignals.push(makeSignal(bot, 'sell', reason, currentPrice));
    return true;
  }

  return false;
}

function applySellStats(
  bot: Bot,
  paidFee: number,
  price: number,
  qty: number,
  avgBuyPrice: number,
): void {
  const proceeds = price * qty - paidFee;
  const cost = avgBuyPrice * qty;
  const pnl = proceeds - cost;
  bot.stats.trades += 1;
  if (pnl > 0) bot.stats.wins += 1;
  else if (pnl < 0) bot.stats.losses += 1;
  bot.stats.realizedPnl += pnl;
  bot.stats.returnRate = cost > 0 ? bot.stats.realizedPnl / cost : bot.stats.returnRate;
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
