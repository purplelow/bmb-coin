/**
 * UpbitExchangeAdapter — STUB for future live trading.
 *
 * All trading / account / candle methods throw until the real HTTP client and
 * JWT auth are implemented.
 *
 * Real Upbit REST endpoints (v1 API):
 *   GET  /v1/market/all                  — list tradeable markets
 *   GET  /v1/candles/minutes/{unit}      — OHLCV candles
 *   GET  /v1/ticker?markets=KRW-BTC,...  — latest ticker snapshot
 *   GET  /v1/accounts                    — balances (JWT required)
 *   POST /v1/orders                      — place order (JWT required)
 *   DELETE /v1/order?uuid=...            — cancel order (JWT required)
 *   GET  /v1/orders?...                  — order history (JWT required)
 *
 * Authentication: Upbit requires a JWT in the Authorization header.
 * Payload: { access_key, nonce, query_hash, query_hash_alg }
 * Signed with the secret key using HS256.
 *
 * TODO: implement JWT signing (e.g. using jose or jsonwebtoken in a server
 *       action / API route so the secret key never reaches the client).
 * TODO: implement WebSocket for subscribeTickers (wss://api.upbit.com/websocket/v1).
 */

import type { Balance, Candle, Market, Order, Ticker } from '@/types/domain';
import type { ExchangeAdapter, PlaceOrderInput, TickerListener } from '@/services/exchange/types';
import { SEED_MARKETS } from '@/shared/config/markets';

export class UpbitExchangeAdapter implements ExchangeAdapter {
  readonly id = 'upbit';

  // ── Markets ──────────────────────────────────────────────────

  // TODO: GET /v1/market/all — fetch all available markets and map to Market[]
  async getMarkets(): Promise<Market[]> {
    return SEED_MARKETS.map(({ code, koreanName, englishName, quote, base }) => ({
      code,
      koreanName,
      englishName,
      quote,
      base,
    }));
  }

  // ── Tickers ──────────────────────────────────────────────────

  // TODO: GET /v1/ticker?markets=KRW-BTC,KRW-ETH,...  — map response to Ticker[]
  async getTickers(_markets: string[]): Promise<Ticker[]> {
    throw new Error('Upbit live adapter not implemented in test build');
  }

  // ── Candles ──────────────────────────────────────────────────

  // TODO: GET /v1/candles/minutes/{unit}?market=KRW-BTC&count=200 — map to Candle[]
  async getCandles(
    _market: string,
    _unit: number,
    _count: number,
  ): Promise<Candle[]> {
    throw new Error('Upbit live adapter not implemented in test build');
  }

  // ── Subscriptions ────────────────────────────────────────────

  // TODO: WebSocket wss://api.upbit.com/websocket/v1 — subscribe to ticker channel
  //       Send subscription message: [{"ticket":"<uuid>"},{"type":"ticker","codes":[...]}]
  //       Parse incoming JSON messages and forward to listener.
  subscribeTickers(
    _markets: string[],
    _listener: TickerListener,
  ): () => void {
    throw new Error('Upbit live adapter not implemented in test build');
  }

  // ── Account ──────────────────────────────────────────────────

  // TODO: GET /v1/accounts — requires JWT auth header, map to Balance[]
  async getBalances(): Promise<Balance[]> {
    throw new Error('Upbit live adapter not implemented in test build');
  }

  // TODO: GET /v1/orders — requires JWT auth header, map to Order[]
  async getOrders(): Promise<Order[]> {
    throw new Error('Upbit live adapter not implemented in test build');
  }

  // TODO: DELETE /v1/order?uuid={orderId} — requires JWT auth header
  async cancelOrder(_orderId: string): Promise<void> {
    throw new Error('Upbit live adapter not implemented in test build');
  }

  // ── Orders ───────────────────────────────────────────────────

  // TODO: POST /v1/orders — requires JWT auth header
  //       Body: { market, side, ord_type, price?, volume?, identifier? }
  async placeOrder(_input: PlaceOrderInput): Promise<Order> {
    throw new Error('Upbit live adapter not implemented in test build');
  }
}
