/**
 * MarketSimulator — SSR-safe random-walk simulation engine.
 *
 * - No timers or random number generation at module scope.
 * - Builds SIM.historyLength 1-minute candles per SEED_MARKET on init().
 * - Advances simulation time on each tick, rolling/mutating 1-min candles and
 *   recomputing derived Tickers for every market.
 * - Notifies subscribers with updated Tickers.
 */

import type { TickerListener } from '@/services/exchange/types';
import { SIM } from '@/shared/config';
import { SEED_MARKETS } from '@/shared/config/markets';
import type { SeedMarket } from '@/shared/config/markets';
import type { Candle, Market, Ticker, PriceChange } from '@/types/domain';

// ── Helpers ─────────────────────────────────────────────────────

function randomNormal(): number {
  // Box-Muller
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-15))) * Math.cos(2 * Math.PI * u2);
}

/** Per-minute volatility from daily vol: dailyVol / sqrt(1440). */
function minuteVol(dailyVol: number): number {
  return dailyVol / Math.sqrt(1440);
}

/** Derive PriceChange direction from signed change. */
function priceChange(signedRate: number): PriceChange {
  if (signedRate > 0) return 'RISE';
  if (signedRate < 0) return 'FALL';
  return 'EVEN';
}

/** Build a Ticker from the candle window for a market. */
function buildTicker(market: string, candles: Candle[], currentPrice: number): Ticker {
  const sessionOpenClose = candles[0]?.close ?? currentPrice;
  const signedRate =
    sessionOpenClose > 0 ? (currentPrice - sessionOpenClose) / sessionOpenClose : 0;
  const changeRate = Math.abs(signedRate);
  const changePrice = Math.abs(currentPrice - sessionOpenClose);

  let high = currentPrice;
  let low = currentPrice;
  let accValue = 0;
  let accVolume = 0;
  for (const c of candles) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
    accValue += c.close * c.volume;
    accVolume += c.volume;
  }

  return {
    market,
    tradePrice: currentPrice,
    prevClosingPrice: sessionOpenClose,
    change: priceChange(signedRate),
    changePrice,
    changeRate,
    signedChangeRate: signedRate,
    highPrice: high,
    lowPrice: low,
    accTradePrice24h: accValue,
    accTradeVolume24h: accVolume,
    timestamp: Date.now(),
  };
}

// ── Candle generation ────────────────────────────────────────────

function generateHistoricalCandles(seed: SeedMarket, count: number, nowMs: number): Candle[] {
  const vol = minuteVol(seed.volatility);
  const minuteMs = 60_000;
  const candles: Candle[] = [];
  let price = seed.seedPrice;
  const startMs = nowMs - count * minuteMs;

  for (let i = 0; i < count; i++) {
    const ts = startMs + i * minuteMs;
    const open = price;
    // Simulate intra-candle moves
    let high = open;
    let low = open;
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      price = Math.max(price * (1 + vol * randomNormal() * 0.5), 1);
      if (price > high) high = price;
      if (price < low) low = price;
    }
    const close = price;
    // Volume: roughly proportional to seed price magnitude
    const baseVol = (seed.seedPrice / price) * (0.5 + Math.random());
    candles.push({
      market: seed.code,
      timestamp: ts,
      open,
      high,
      low,
      close,
      volume: baseVol,
      unit: 1,
    });
  }
  return candles;
}

// ── MarketSimulator class ────────────────────────────────────────

export class MarketSimulator {
  private candleMap: Map<string, Candle[]> = new Map();
  private tickerMap: Map<string, Ticker> = new Map();
  private listeners: Set<TickerListener> = new Set();
  private timer: ReturnType<typeof setInterval> | null = null;
  private _isRunning = false;
  /**
   * Simulation clock (epoch ms). Decoupled from the wall clock and advanced by
   * one candle interval per tick — so the market evolves fast enough for charts
   * to animate and strategies to actually trigger in test mode.
   */
  private simClock = 0;

  /** Call once before use (not at module scope — safe for SSR). */
  init(): void {
    const now = Date.now();
    for (const seed of SEED_MARKETS) {
      const candles = generateHistoricalCandles(seed, SIM.historyLength, now);
      this.candleMap.set(seed.code, candles);
      const lastClose = candles[candles.length - 1]?.close ?? seed.seedPrice;
      this.tickerMap.set(seed.code, buildTicker(seed.code, candles, lastClose));
    }
    // Next candle rolls one interval after the most recent seeded candle.
    this.simClock = now;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  getMarkets(): Market[] {
    return SEED_MARKETS.map(({ code, koreanName, englishName, quote, base }) => ({
      code,
      koreanName,
      englishName,
      quote,
      base,
    }));
  }

  getTickers(codes: string[]): Ticker[] {
    const result: Ticker[] = [];
    for (const code of codes) {
      const t = this.tickerMap.get(code);
      if (t) result.push(t);
    }
    return result;
  }

  getTicker(market: string): Ticker | undefined {
    return this.tickerMap.get(market);
  }

  /**
   * Return the most recent `count` candles for `market` at `unit` minutes.
   * Since simulation only stores 1-min candles we aggregate when unit > 1.
   */
  getCandles(market: string, unit: number, count: number): Candle[] {
    const raw = this.candleMap.get(market) ?? [];
    if (unit <= 1) {
      return raw.slice(-count);
    }
    // Aggregate 1-min candles into `unit`-min candles
    const aggregated: Candle[] = [];
    for (let i = 0; i < raw.length; i += unit) {
      const slice = raw.slice(i, i + unit);
      if (slice.length === 0) continue;
      const first = slice[0];
      const last = slice[slice.length - 1];
      if (!first || !last) continue;
      let high = first.high;
      let low = first.low;
      let volume = 0;
      for (const c of slice) {
        if (c.high > high) high = c.high;
        if (c.low < low) low = c.low;
        volume += c.volume;
      }
      aggregated.push({
        market,
        timestamp: first.timestamp,
        open: first.open,
        high,
        low,
        close: last.close,
        volume,
        unit,
      });
    }
    return aggregated.slice(-count);
  }

  subscribe(listener: TickerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Start the simulation timer. Guards against double-start. */
  start(): void {
    if (this._isRunning) return;
    this._isRunning = true;

    this.timer = setInterval(() => {
      this._tick();
    }, SIM.tickIntervalMs);
  }

  stop(): void {
    if (!this._isRunning) return;
    this._isRunning = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private _tick(): void {
    // Advance the simulation clock by exactly one candle interval each tick.
    const minuteMs = 60_000;
    this.simClock += minuteMs;
    const ts = this.simClock;

    for (const seed of SEED_MARKETS) {
      const candles = this.candleMap.get(seed.code);
      if (!candles || candles.length === 0) continue;

      const vol = minuteVol(seed.volatility);
      const lastCandle = candles[candles.length - 1];
      if (!lastCandle) continue;

      // Roll a fresh 1-min candle, walking the price across a few intra-candle
      // steps so highs/lows look realistic.
      const open = lastCandle.close;
      let price = open;
      let high = open;
      let low = open;
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        price = Math.max(price * (1 + vol * randomNormal()), 1);
        if (price > high) high = price;
        if (price < low) low = price;
      }
      const close = price;

      const newCandle: Candle = {
        market: seed.code,
        timestamp: ts,
        open,
        high,
        low,
        close,
        volume: (seed.seedPrice / close) * (0.1 + Math.random() * 0.4),
        unit: 1,
      };

      // Trim to historyLength to keep memory bounded.
      const trimmed = candles.slice(-(SIM.historyLength - 1));
      const updatedCandles = [...trimmed, newCandle];

      this.candleMap.set(seed.code, updatedCandles);

      const ticker = buildTicker(seed.code, updatedCandles, close);
      this.tickerMap.set(seed.code, ticker);

      // Notify listeners
      for (const listener of this.listeners) {
        listener(ticker);
      }
    }
  }
}

// ── Singleton ────────────────────────────────────────────────────

let _instance: MarketSimulator | null = null;

export function getSimulator(): MarketSimulator {
  if (!_instance) {
    _instance = new MarketSimulator();
    _instance.init();
  }
  return _instance;
}
