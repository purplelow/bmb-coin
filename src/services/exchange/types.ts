import type {
  Balance,
  Candle,
  Market,
  Order,
  OrderSide,
  OrderType,
  Ticker,
} from '@/types/domain';

/** Parameters for placing an order through an adapter. */
export interface PlaceOrderInput {
  market: string;
  side: OrderSide;
  type: OrderType;
  /** Limit price (required for `limit`). */
  price?: number;
  /** Base volume (for `limit` / `market` sell). */
  volume?: number;
  /** Quote amount to spend (for `price` market buy). */
  amount?: number;
  botId?: string;
}

/** Callback fired on each real-time ticker update. */
export type TickerListener = (ticker: Ticker) => void;

/**
 * The single seam between the app and any exchange.
 *
 * `MockExchangeAdapter` (test mode) and a future `UpbitExchangeAdapter` (live)
 * both implement this. Stores and the trading engine depend ONLY on this
 * interface — never on a concrete exchange — so swapping test↔live is a
 * one-line change in the adapter factory.
 */
export interface ExchangeAdapter {
  readonly id: string;

  /** Discoverable markets. */
  getMarkets(): Promise<Market[]>;

  /** Latest snapshot for the given markets. */
  getTickers(markets: string[]): Promise<Ticker[]>;

  /** Recent candles for a market (most recent last). */
  getCandles(market: string, unit: number, count: number): Promise<Candle[]>;

  /** Subscribe to live ticker updates. Returns an unsubscribe fn. */
  subscribeTickers(markets: string[], listener: TickerListener): () => void;

  /** Current account balances. */
  getBalances(): Promise<Balance[]>;

  /** Place an order; resolves with the resulting (possibly filled) order. */
  placeOrder(input: PlaceOrderInput): Promise<Order>;

  /** Cancel an open order by id. */
  cancelOrder(orderId: string): Promise<void>;

  /** Open + historical orders, most recent first. */
  getOrders(): Promise<Order[]>;
}
