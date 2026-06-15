/**
 * TradingEngine — drives all running bots.
 *
 * Subscribes to the union of running-bot markets via the ExchangeAdapter.
 * On each ticker tick, evaluates the relevant strategies (at most once per new
 * candle) and places orders on signal transitions.
 * Pure TS — no React, no DOM.
 */

import type { Balance, Bot, BotStats, Order, Signal } from '@/types/domain';
import type { SignalEvent } from '@/types/domain';
import type { ExchangeAdapter } from '@/services/exchange/types';
import type { Ticker } from '@/types/domain';
import { SIM } from '@/shared/config';
import { SEED_MARKET_BY_CODE } from '@/shared/config/markets';
import { evaluateStrategy } from '@/features/trading/strategies';
import { uid } from '@/shared/lib/id';

// ── Internal per-bot state ───────────────────────────────────────

interface BotState {
  bot: Bot;
  lastSignal: Signal | null;
  /** Timestamp of last candle we acted on (to avoid acting twice per candle). */
  lastActedCandleTs: number;
  /** Total KRW deployed (cost basis of open positions). */
  deployedCost: number;
  /** Cumulative realized P&L. */
  realizedPnl: number;
  /** Last stop-loss/take-profit balance check (throttles getBalances calls). */
  riskCheckedAt: number;
  /** True while a risk-triggered sell is awaiting fill (prevents double-sells). */
  riskSellInFlight: boolean;
}

// ── Engine handlers ──────────────────────────────────────────────

export interface EngineHandlers {
  onSignal: (e: SignalEvent) => void;
  onBotUpdate: (id: string, patch: Partial<Bot>) => void;
  onOrder: (o: Order) => void;
}

/**
 * Live-trading guardrails consulted on every auto-buy. In test mode the default
 * policy is permissive; in live mode the bootstrap passes a policy that can
 * block buys (sell-only safety) and clamp each buy to the small-amount preset.
 */
export interface EnginePolicy {
  /** When false, the engine never auto-buys (it still auto-sells). */
  canAutoBuy: () => boolean;
  /** Upper bound (KRW) on a single auto-buy. Infinity = no clamp. */
  maxBuyAmount: () => number;
}

const DEFAULT_POLICY: EnginePolicy = {
  canAutoBuy: () => true,
  maxBuyAmount: () => Infinity,
};

// ── TradingEngine ────────────────────────────────────────────────

export class TradingEngine {
  private adapter: ExchangeAdapter;
  private handlers: EngineHandlers;
  private policy: EnginePolicy;
  private botStates: Map<string, BotState> = new Map();
  private unsubscribe: (() => void) | null = null;
  private started = false;

  constructor(adapter: ExchangeAdapter, handlers: EngineHandlers, policy?: EnginePolicy) {
    this.adapter = adapter;
    this.handlers = handlers;
    this.policy = policy ?? DEFAULT_POLICY;
  }

  /** Reconcile the internal bot map from the latest store snapshot. */
  syncBots(bots: Bot[]): void {
    const incoming = new Set(bots.map((b) => b.id));

    // Remove bots no longer present
    for (const id of this.botStates.keys()) {
      if (!incoming.has(id)) {
        this.botStates.delete(id);
      }
    }

    // Add / update bots
    for (const bot of bots) {
      const existing = this.botStates.get(bot.id);
      if (existing) {
        existing.bot = bot;
      } else {
        this.botStates.set(bot.id, {
          bot,
          lastSignal: null,
          lastActedCandleTs: 0,
          deployedCost: 0,
          realizedPnl: 0,
          riskCheckedAt: 0,
          riskSellInFlight: false,
        });
      }
    }

    // Re-wire subscription if started
    if (this.started) {
      this._resubscribe();
    }
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this._resubscribe();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // ── Private ──────────────────────────────────────────────────

  private _resubscribe(): void {
    // Tear down existing subscription
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Compute union of markets for running bots
    const markets = new Set<string>();
    for (const { bot } of this.botStates.values()) {
      if (bot.status === 'running') {
        markets.add(bot.market);
      }
    }

    if (markets.size === 0) return;

    this.unsubscribe = this.adapter.subscribeTickers(
      Array.from(markets),
      (ticker: Ticker) => {
        void this._onTick(ticker);
      },
    );
  }

  private async _onTick(ticker: Ticker): Promise<void> {
    for (const [, state] of this.botStates) {
      const { bot } = state;
      if (bot.status !== 'running') continue;
      if (bot.market !== ticker.market) continue;

      // Risk rules (stop-loss/take-profit) run on every tick, independent of
      // candle boundaries and strategy signals — exits must not wait.
      await this._checkRisk(state, ticker);
      await this._processBotTick(state, ticker);
    }
  }

  /**
   * Stop-loss / take-profit: if the bot's market position (by average buy
   * price) breaches the configured thresholds, liquidate the position with a
   * market sell. Selling is always allowed — EnginePolicy only gates buys.
   */
  private async _checkRisk(state: BotState, ticker: Ticker): Promise<void> {
    const { bot } = state;
    const risk = bot.risk;
    if (!risk || (risk.stopLossPct == null && risk.takeProfitPct == null)) return;
    if (state.riskSellInFlight) return;

    // Throttle balance lookups (each one is an API call in live mode).
    const now = Date.now();
    if (now - state.riskCheckedAt < 3_000) return;
    state.riskCheckedAt = now;

    const seedMarket = SEED_MARKET_BY_CODE[bot.market];
    const baseCurrency = seedMarket?.base ?? (bot.market.split('-')[1] ?? bot.market);

    let balances: Balance[] = [];
    try {
      balances = await this.adapter.getBalances();
    } catch {
      return;
    }
    const baseBalance = balances.find((b) => b.currency === baseCurrency);
    const qty = baseBalance?.balance ?? 0;
    const avgBuyPrice = baseBalance?.avgBuyPrice ?? 0;
    if (qty <= 0 || avgBuyPrice <= 0) return;

    const pnlRate = (ticker.tradePrice - avgBuyPrice) / avgBuyPrice;
    const pctText = `${pnlRate >= 0 ? '+' : ''}${(pnlRate * 100).toFixed(1)}%`;

    let reason: string | null = null;
    if (risk.stopLossPct != null && pnlRate <= -risk.stopLossPct / 100) {
      reason = `손절 (${pctText})`;
    } else if (risk.takeProfitPct != null && pnlRate >= risk.takeProfitPct / 100) {
      reason = `익절 (${pctText})`;
    }
    if (reason === null) return;

    state.riskSellInFlight = true;
    try {
      const order = await this.adapter.placeOrder({
        market: bot.market,
        side: 'ask',
        type: 'market',
        volume: qty,
        botId: bot.id,
      });

      // Live create-order responses may not include fill details yet — fall
      // back to the ticker price for P&L accounting.
      const filled = order.executedVolume * order.avgFillPrice;
      const proceeds = (filled > 0 ? filled : ticker.tradePrice * qty) - order.paidFee;
      const cost = state.deployedCost > 0 ? state.deployedCost : avgBuyPrice * qty;
      const pnl = proceeds - cost;
      state.realizedPnl += pnl;
      state.deployedCost = 0;
      // Suppress the strategy's next 'sell' transition — the position is gone.
      state.lastSignal = 'sell';

      this._emitSignalAndUpdate(state, 'sell', reason, ticker.tradePrice, order, pnl);
    } catch {
      // Order failed (e.g. cap/permission) — retry naturally on a later tick.
    } finally {
      state.riskSellInFlight = false;
    }
  }

  private async _processBotTick(
    state: BotState,
    ticker: Ticker,
  ): Promise<void> {
    const { bot } = state;

    // Determine max lookback period
    const strategy = bot.strategy;
    let lookback = 30;
    if (strategy.type === 'ma_cross') {
      lookback = Math.max(strategy.params.longPeriod, strategy.params.shortPeriod) + 5;
    } else if (strategy.type === 'rsi') {
      lookback = strategy.params.period + 5;
    }

    // Fetch candles
    let candles;
    try {
      candles = await this.adapter.getCandles(
        bot.market,
        SIM.candleUnit,
        lookback,
      );
    } catch {
      return;
    }

    if (candles.length === 0) return;

    // Act at most once per new candle
    const lastCandleTs = candles[candles.length - 1]?.timestamp ?? 0;
    if (lastCandleTs === state.lastActedCandleTs) return;

    // Evaluate strategy
    const { signal, reason } = evaluateStrategy(strategy, candles);

    // Only act on signal transitions
    if (signal === state.lastSignal || signal === 'hold') {
      state.lastSignal = signal;
      return;
    }

    const prevSignal = state.lastSignal;
    state.lastSignal = signal;
    state.lastActedCandleTs = lastCandleTs;

    const currentPrice = ticker.tradePrice;

    // Determine order amount from strategy params
    let orderAmount = 500_000;
    let baseQty = 0;

    if (strategy.type === 'ma_cross') {
      orderAmount = strategy.params.orderAmount;
    } else if (strategy.type === 'rsi') {
      orderAmount = strategy.params.orderAmount;
    }

    // Derive base currency
    const seedMarket = SEED_MARKET_BY_CODE[bot.market];
    const baseCurrency =
      seedMarket?.base ?? (bot.market.split('-')[1] ?? bot.market);

    if (signal === 'buy' && prevSignal !== 'buy') {
      // Sell-only safety: in live mode with auto-buy disabled, never open new
      // positions automatically — only the sell branch below stays active.
      if (!this.policy.canAutoBuy()) return;

      // Clamp the buy to the live small-amount cap (Infinity in test mode).
      const effectiveAmount = Math.min(orderAmount, this.policy.maxBuyAmount());
      if (!Number.isFinite(effectiveAmount) || effectiveAmount <= 0) return;

      // Check KRW balance
      let balances: Balance[] = [];
      try {
        balances = await this.adapter.getBalances();
      } catch {
        return;
      }
      const krwBalance = balances.find((b) => b.currency === 'KRW');
      const availableKRW = krwBalance?.balance ?? 0;

      if (availableKRW < effectiveAmount) return;

      let order: Order;
      try {
        order = await this.adapter.placeOrder({
          market: bot.market,
          side: 'bid',
          type: 'price',
          amount: effectiveAmount,
          botId: bot.id,
        });
      } catch {
        return;
      }

      // Track deployed cost (fall back to the requested amount when the live
      // create-response doesn't yet include fill details).
      const spent = order.executedVolume * order.avgFillPrice;
      state.deployedCost += spent > 0 ? spent : effectiveAmount;

      this._emitSignalAndUpdate(state, signal, reason, currentPrice, order);
    } else if (signal === 'sell' && prevSignal !== 'sell') {
      // Check base balance
      let balances: Balance[] = [];
      try {
        balances = await this.adapter.getBalances();
      } catch {
        return;
      }
      const baseBalance = balances.find((b) => b.currency === baseCurrency);
      baseQty = baseBalance?.balance ?? 0;
      const avgBuyPrice = baseBalance?.avgBuyPrice ?? 0;

      if (baseQty <= 0) return;

      let order: Order;
      try {
        order = await this.adapter.placeOrder({
          market: bot.market,
          side: 'ask',
          type: 'market',
          volume: baseQty,
          botId: bot.id,
        });
      } catch {
        return;
      }

      // Realized P&L = proceeds - cost. For positions the bot didn't open
      // (e.g. bought manually), deployedCost is 0 — fall back to the account's
      // average buy price so the P&L isn't inflated by the full proceeds.
      const filled = order.executedVolume * order.avgFillPrice;
      const proceeds = (filled > 0 ? filled : currentPrice * baseQty) - order.paidFee;
      const cost = state.deployedCost > 0 ? state.deployedCost : avgBuyPrice * baseQty;
      const pnl = proceeds - cost;
      state.realizedPnl += pnl;
      state.deployedCost = 0;

      this._emitSignalAndUpdate(state, signal, reason, currentPrice, order, pnl);
    }
  }

  private _emitSignalAndUpdate(
    state: BotState,
    signal: Signal,
    reason: string,
    price: number,
    order: Order,
    pnl?: number,
  ): void {
    const { bot } = state;

    // Emit order
    this.handlers.onOrder(order);

    // Emit signal event
    const signalEvent: SignalEvent = {
      id: uid('sig'),
      botId: bot.id,
      market: bot.market,
      signal,
      price,
      reason,
      timestamp: Date.now(),
    };
    this.handlers.onSignal(signalEvent);

    // Update stats
    const currentStats = bot.stats;
    const isTrade = signal !== 'hold';
    const trades = isTrade ? currentStats.trades + 1 : currentStats.trades;

    let wins = currentStats.wins;
    let losses = currentStats.losses;
    if (pnl !== undefined) {
      if (pnl > 0) wins += 1;
      else if (pnl < 0) losses += 1;
    }

    const realizedPnl = state.realizedPnl;
    const totalDeployed = state.deployedCost;
    const returnRate =
      totalDeployed > 0
        ? realizedPnl / totalDeployed
        : currentStats.returnRate;

    const statsPatch: Partial<BotStats> = {
      trades,
      wins,
      losses,
      realizedPnl,
      returnRate,
    };

    this.handlers.onBotUpdate(bot.id, { stats: { ...currentStats, ...statsPatch } });
  }
}
