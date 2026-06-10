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
}

// ── Engine handlers ──────────────────────────────────────────────

export interface EngineHandlers {
  onSignal: (e: SignalEvent) => void;
  onBotUpdate: (id: string, patch: Partial<Bot>) => void;
  onOrder: (o: Order) => void;
}

// ── TradingEngine ────────────────────────────────────────────────

export class TradingEngine {
  private adapter: ExchangeAdapter;
  private handlers: EngineHandlers;
  private botStates: Map<string, BotState> = new Map();
  private unsubscribe: (() => void) | null = null;
  private started = false;

  constructor(adapter: ExchangeAdapter, handlers: EngineHandlers) {
    this.adapter = adapter;
    this.handlers = handlers;
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

      await this._processBotTick(state, ticker);
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
      // Check KRW balance
      let balances: Balance[] = [];
      try {
        balances = await this.adapter.getBalances();
      } catch {
        return;
      }
      const krwBalance = balances.find((b) => b.currency === 'KRW');
      const availableKRW = krwBalance?.balance ?? 0;

      if (availableKRW < orderAmount) return;

      let order: Order;
      try {
        order = await this.adapter.placeOrder({
          market: bot.market,
          side: 'bid',
          type: 'price',
          amount: orderAmount,
          botId: bot.id,
        });
      } catch {
        return;
      }

      // Track deployed cost
      state.deployedCost += order.executedVolume * order.avgFillPrice;

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

      // Compute realized P&L: proceeds - cost
      const proceeds = order.executedVolume * order.avgFillPrice - order.paidFee;
      const cost = state.deployedCost > 0 ? state.deployedCost : 0;
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
