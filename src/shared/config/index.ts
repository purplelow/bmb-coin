/** App-wide configuration derived from env + static constants. */

export type TradingMode = 'test' | 'live';

const rawMode = process.env.NEXT_PUBLIC_TRADING_MODE;

export const config = {
  /** `test` → simulated paper trading (default). `live` → real exchange. */
  tradingMode: (rawMode === 'live' ? 'live' : 'test') as TradingMode,
  exchange: process.env.NEXT_PUBLIC_EXCHANGE ?? 'upbit',
  quoteCurrency: 'KRW',
  /** Exchange taker fee used by the simulator (Upbit ≈ 0.05%). */
  takerFee: 0.0005,
} as const;

export const isTestMode = config.tradingMode === 'test';

/** Simulator cadence: how often a new live tick/candle is produced. */
export const SIM = {
  /** Base candle interval shown on charts (minutes). */
  candleUnit: 1,
  /** Real-time tick interval in ms (how fast the sim "clock" advances). */
  tickIntervalMs: 1500,
  /** Number of historical candles to seed each market with on boot. */
  historyLength: 200,
  /** Starting KRW balance for the paper-trading account. */
  startingBalance: 10_000_000,
} as const;
