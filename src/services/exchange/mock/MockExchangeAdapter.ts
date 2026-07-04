/**
 * MockExchangeAdapter — in-memory paper trading adapter.
 *
 * Uses MarketSimulator for prices. Maintains a paper account with an initial
 * KRW balance. All operations are synchronous internally but return Promises
 * to satisfy the ExchangeAdapter interface.
 */

import type { ExchangeAdapter, PlaceOrderInput, TickerListener } from '@/services/exchange/types';
import { getSimulator } from '@/services/simulation/MarketSimulator';
import { SIM, config } from '@/shared/config';
import { uid } from '@/shared/lib/id';
import type { Balance, Market, Order, Ticker } from '@/types/domain';

export class MockExchangeAdapter implements ExchangeAdapter {
  readonly id = 'mock';

  private balances: Map<string, Balance> = new Map();
  private orders: Order[] = [];

  constructor() {
    // Initial KRW balance
    this.balances.set(config.quoteCurrency, {
      currency: config.quoteCurrency,
      balance: SIM.startingBalance,
      locked: 0,
      avgBuyPrice: 0,
    });
  }

  // ── Markets ──────────────────────────────────────────────────

  async getMarkets(): Promise<Market[]> {
    return getSimulator().getMarkets();
  }

  // ── Tickers ──────────────────────────────────────────────────

  async getTickers(markets: string[]): Promise<Ticker[]> {
    return getSimulator().getTickers(markets);
  }

  // ── Candles ──────────────────────────────────────────────────

  async getCandles(market: string, unit: number, count: number) {
    return getSimulator().getCandles(market, unit, count);
  }

  // ── Subscriptions ────────────────────────────────────────────

  subscribeTickers(markets: string[], listener: TickerListener): () => void {
    const sim = getSimulator();
    sim.start(); // idempotent — guards against double-start internally
    const unsubscribe = sim.subscribe((ticker) => {
      if (markets.includes(ticker.market)) {
        listener(ticker);
      }
    });
    return unsubscribe;
  }

  // ── Account ──────────────────────────────────────────────────

  async getBalances(): Promise<Balance[]> {
    return Array.from(this.balances.values()).map((b) => ({ ...b }));
  }

  async getOrders(): Promise<Order[]> {
    return [...this.orders].reverse();
  }

  async cancelOrder(_orderId: string): Promise<void> {
    // Fills are immediate in simulation — no-op
  }

  // ── Order placement ──────────────────────────────────────────

  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    const sim = getSimulator();
    const ticker = sim.getTicker(input.market);
    const currentPrice = ticker?.tradePrice ?? 0;

    if (currentPrice === 0) {
      throw new Error(`No price available for market ${input.market}`);
    }

    const fee = config.takerFee;

    // Derive base currency from market code, e.g. "KRW-BTC" -> "BTC"
    const parts = input.market.split('-');
    const baseCurrency = parts[1] ?? input.market;
    const quoteCurrency = config.quoteCurrency;

    let executedVolume = 0;
    let avgFillPrice = currentPrice;
    let paidFee = 0;

    if (input.side === 'bid') {
      // Buy
      if (input.type === 'price') {
        // Market buy: spend a fixed KRW amount
        const amount = input.amount ?? 0;
        const krwBalance = this.balances.get(quoteCurrency);
        const available = krwBalance?.balance ?? 0;
        const spend = Math.min(amount, available);
        executedVolume = (spend * (1 - fee)) / currentPrice;
        paidFee = spend * fee;
        avgFillPrice = currentPrice;

        this._adjustBalance(quoteCurrency, -spend);
        this._adjustBaseBalance(baseCurrency, executedVolume, currentPrice);
      } else if (input.type === 'limit') {
        // Limit buy: price + volume
        const limitPrice = input.price ?? currentPrice;
        const volume = input.volume ?? 0;
        const totalCost = limitPrice * volume;
        const krwBalance = this.balances.get(quoteCurrency);
        const available = krwBalance?.balance ?? 0;
        const actualVolume = totalCost <= available ? volume : available / limitPrice;
        const actualCost = actualVolume * limitPrice;
        executedVolume = actualVolume * (1 - fee);
        paidFee = actualCost * fee;
        avgFillPrice = limitPrice;

        this._adjustBalance(quoteCurrency, -actualCost);
        this._adjustBaseBalance(baseCurrency, executedVolume, limitPrice);
      }
    } else {
      // Sell
      const baseBalance = this.balances.get(baseCurrency);
      const availableBase = baseBalance?.balance ?? 0;

      let sellVolume: number;
      let sellPrice: number;

      if (input.type === 'market') {
        sellVolume = Math.min(input.volume ?? 0, availableBase);
        sellPrice = currentPrice;
      } else {
        // limit sell
        sellVolume = Math.min(input.volume ?? 0, availableBase);
        sellPrice = input.price ?? currentPrice;
      }

      const proceeds = sellVolume * sellPrice;
      paidFee = proceeds * fee;
      const netProceeds = proceeds - paidFee;
      executedVolume = sellVolume;
      avgFillPrice = sellPrice;

      this._adjustBalance(baseCurrency, -sellVolume);
      this._adjustBalance(quoteCurrency, netProceeds);
    }

    const order: Order = {
      id: uid('order'),
      market: input.market,
      side: input.side,
      type: input.type,
      price: input.price,
      volume: input.volume ?? input.amount ?? 0,
      executedVolume,
      avgFillPrice,
      paidFee,
      state: 'done',
      createdAt: Date.now(),
      botId: input.botId,
    };

    this.orders.push(order);
    return order;
  }

  // ── Private helpers ──────────────────────────────────────────

  private _adjustBalance(currency: string, delta: number): void {
    const existing = this.balances.get(currency);
    if (existing) {
      const newBalance = Math.max(0, existing.balance + delta);
      this.balances.set(currency, { ...existing, balance: newBalance });
    } else if (delta > 0) {
      this.balances.set(currency, {
        currency,
        balance: delta,
        locked: 0,
        avgBuyPrice: 0,
      });
    }
  }

  private _adjustBaseBalance(currency: string, addedVolume: number, fillPrice: number): void {
    const existing = this.balances.get(currency);
    if (existing && existing.balance > 0) {
      const totalCost = existing.balance * existing.avgBuyPrice + addedVolume * fillPrice;
      const totalVolume = existing.balance + addedVolume;
      const newAvg = totalVolume > 0 ? totalCost / totalVolume : fillPrice;
      this.balances.set(currency, {
        ...existing,
        balance: totalVolume,
        avgBuyPrice: newAvg,
      });
    } else {
      this.balances.set(currency, {
        currency,
        balance: addedVolume,
        locked: 0,
        avgBuyPrice: fillPrice,
      });
    }
  }
}
