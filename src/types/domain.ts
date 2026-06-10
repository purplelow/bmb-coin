/**
 * Domain model — Upbit-style (KRW market).
 *
 * This is the single source of truth every layer codes against:
 * services (simulation + adapters), stores, the trading engine, and the UI.
 * Field names mirror Upbit's REST/WebSocket payloads so the real adapter can
 * map 1:1 later.
 */

// ── Markets & prices ────────────────────────────────────────────

/** A tradeable market, e.g. `KRW-BTC`. */
export interface Market {
  /** Upbit market code, e.g. `"KRW-BTC"`. */
  code: string;
  koreanName: string;
  englishName: string;
  /** Quote currency, e.g. `"KRW"`. */
  quote: string;
  /** Base currency / asset, e.g. `"BTC"`. */
  base: string;
}

/** Direction of the most recent price change vs previous close. */
export type PriceChange = 'RISE' | 'FALL' | 'EVEN';

/** Latest snapshot for a market (mirrors Upbit ticker). */
export interface Ticker {
  market: string;
  tradePrice: number;
  prevClosingPrice: number;
  change: PriceChange;
  /** Absolute change vs prev close (always positive). */
  changePrice: number;
  /** Fractional change vs prev close (always positive), e.g. 0.0123 = 1.23%. */
  changeRate: number;
  /** Signed fractional change, negative when falling. */
  signedChangeRate: number;
  highPrice: number;
  lowPrice: number;
  /** 24h accumulated traded value (in quote currency). */
  accTradePrice24h: number;
  /** 24h accumulated traded volume (in base asset). */
  accTradeVolume24h: number;
  /** Epoch milliseconds. */
  timestamp: number;
}

/** A single OHLCV candle. */
export interface Candle {
  market: string;
  /** Candle open time, epoch milliseconds. */
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Volume in base asset. */
  volume: number;
  /** Candle interval in minutes (1, 3, 5, 15, 60, 240, ...). */
  unit: number;
}

// ── Orders & balances ───────────────────────────────────────────

/** `bid` = buy, `ask` = sell (Upbit convention). */
export type OrderSide = 'bid' | 'ask';

/**
 * `limit`  — limit order (price + volume)
 * `price`  — market buy (spend a fixed quote amount)
 * `market` — market sell (sell a fixed base volume)
 */
export type OrderType = 'limit' | 'price' | 'market';

export type OrderState = 'wait' | 'done' | 'cancel';

export interface Order {
  id: string;
  market: string;
  side: OrderSide;
  type: OrderType;
  /** Limit price (quote per base). Undefined for pure market orders. */
  price?: number;
  /** Requested volume in base asset. */
  volume: number;
  executedVolume: number;
  /** Average fill price. */
  avgFillPrice: number;
  /** Fee paid in quote currency. */
  paidFee: number;
  state: OrderState;
  createdAt: number;
  /** Bot that placed the order, if any. */
  botId?: string;
}

/** A currency balance in the (simulated) account. */
export interface Balance {
  /** Currency code, e.g. `"KRW"` or `"BTC"`. */
  currency: string;
  /** Available amount. */
  balance: number;
  /** Amount locked in open orders. */
  locked: number;
  /** Average buy price in quote currency (0 for the quote currency itself). */
  avgBuyPrice: number;
}

/** A derived holding view (balance joined with live price). */
export interface Position {
  market: string;
  base: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  /** quantity * currentPrice */
  valuation: number;
  /** quantity * avgBuyPrice */
  costBasis: number;
  /** valuation - costBasis */
  profit: number;
  /** profit / costBasis */
  profitRate: number;
}

// ── Trading strategies & bots ───────────────────────────────────

export type StrategyType = 'ma_cross' | 'rsi';

/** Moving-average crossover: buy on golden cross, sell on dead cross. */
export interface MaCrossParams {
  shortPeriod: number;
  longPeriod: number;
  /** KRW to spend per buy signal. */
  orderAmount: number;
}

/** RSI mean-reversion: buy when oversold, sell when overbought. */
export interface RsiParams {
  period: number;
  oversold: number;
  overbought: number;
  /** KRW to spend per buy signal. */
  orderAmount: number;
}

export type StrategyParams =
  | { type: 'ma_cross'; params: MaCrossParams }
  | { type: 'rsi'; params: RsiParams };

export type Signal = 'buy' | 'sell' | 'hold';

export type BotStatus = 'running' | 'paused' | 'stopped';

/** Aggregate performance of a bot since it started. */
export interface BotStats {
  trades: number;
  wins: number;
  losses: number;
  /** Realized P&L in quote currency. */
  realizedPnl: number;
  /** Fractional return vs deployed capital. */
  returnRate: number;
}

/** A configured auto-trading bot. */
export interface Bot {
  id: string;
  name: string;
  market: string;
  strategy: StrategyParams;
  status: BotStatus;
  createdAt: number;
  stats: BotStats;
}

/** A signal event emitted by a bot's strategy, for the activity log. */
export interface SignalEvent {
  id: string;
  botId: string;
  market: string;
  signal: Signal;
  price: number;
  /** Human-readable reason, e.g. "Golden cross (7>25)". */
  reason: string;
  timestamp: number;
}
