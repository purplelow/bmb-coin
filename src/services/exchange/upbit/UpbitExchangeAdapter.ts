/**
 * UpbitExchangeAdapter — LIVE trading via our own server routes.
 *
 * Runs in the browser but NEVER sees the API keys: every call goes to
 * /api/upbit/*, where the server signs requests with the secret key. Real-time
 * tickers are polled (no key needed for public data).
 */

import type { ExchangeAdapter, PlaceOrderInput, TickerListener } from '@/services/exchange/types';
import { UpbitTickerSocket } from '@/services/exchange/upbit/UpbitTickerSocket';
import type { Balance, Candle, Market, Order, Ticker } from '@/types/domain';

/** Poll interval for the live ticker stream (ms). Conservative to respect rate limits. */
const POLL_MS = 2500;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string }).error ?? `요청 실패 (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export class UpbitExchangeAdapter implements ExchangeAdapter {
  readonly id = 'upbit';

  getMarkets(): Promise<Market[]> {
    // 전체 KRW 마켓. 티커는 한 요청/한 소켓에 전 종목이 실리므로 부담이 없고,
    // 무거운 캔들 프리로드는 marketStore가 상위 일부로 제한한다.
    return getJson<Market[]>('/api/upbit/markets');
  }

  getTickers(markets: string[]): Promise<Ticker[]> {
    if (markets.length === 0) return Promise.resolve([]);
    return getJson<Ticker[]>(`/api/upbit/tickers?markets=${encodeURIComponent(markets.join(','))}`);
  }

  getCandles(market: string, unit: number, count: number): Promise<Candle[]> {
    return getJson<Candle[]>(
      `/api/upbit/candles?market=${encodeURIComponent(market)}&unit=${unit}&count=${count}`,
    );
  }

  subscribeTickers(markets: string[], listener: TickerListener): () => void {
    let stopped = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let socket: UpbitTickerSocket | null = null;

    const startPolling = () => {
      if (stopped) return;

      const poll = async () => {
        try {
          const tickers = await this.getTickers(markets);
          if (stopped) return;
          for (const t of tickers) listener(t);
        } catch {
          // 일시적 폴링 오류 무시; 다음 틱에서 재시도.
        }
      };

      void poll();
      pollTimer = setInterval(poll, POLL_MS);
    };

    socket = new UpbitTickerSocket(
      markets,
      (t) => {
        if (!stopped) listener(t);
      },
      () => {
        // WebSocket 치명적 실패 — 폴링으로 폴백
        if (!stopped) startPolling();
      },
    );
    socket.connect();

    return () => {
      stopped = true;
      socket?.close();
      socket = null;
      if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };
  }

  getBalances(): Promise<Balance[]> {
    return getJson<Balance[]>('/api/upbit/accounts');
  }

  getOrders(): Promise<Order[]> {
    return getJson<Order[]>('/api/upbit/orders');
  }

  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    const res = await fetch('/api/upbit/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        market: input.market,
        side: input.side,
        type: input.type,
        amount: input.amount,
        volume: input.volume,
        price: input.price,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? `주문 실패 (${res.status})`);
    }
    return data as Order;
  }

  // Market orders fill immediately; there is nothing to cancel in this flow.
  async cancelOrder(_orderId: string): Promise<void> {
    return;
  }
}
