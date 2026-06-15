/**
 * Upbit REST client — SERVER ONLY.
 *
 * Wraps the Upbit v1 API and maps responses to our domain types. Authenticated
 * calls use createUpbitToken(). Public calls (markets/ticker/candles) need no key.
 */

import type { Balance, Candle, Market, Order, Ticker } from '@/types/domain';
import { createUpbitToken } from './signing';

const BASE = 'https://api.upbit.com';

async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Upbit ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function authGet<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const token = createUpbitToken(params);
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  const res = await fetch(`${BASE}${path}${qs}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Upbit ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ── Public market data ──────────────────────────────────────────

interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
}

export async function fetchMarkets(): Promise<Market[]> {
  const all = await publicGet<UpbitMarket[]>('/v1/market/all?isDetails=false');
  return all
    .filter((m) => m.market.startsWith('KRW-'))
    .map((m) => {
      const base = m.market.split('-')[1] ?? m.market;
      return {
        code: m.market,
        koreanName: m.korean_name,
        englishName: m.english_name,
        quote: 'KRW',
        base,
      };
    });
}

interface UpbitTicker {
  market: string;
  trade_price: number;
  prev_closing_price: number;
  change: 'RISE' | 'FALL' | 'EVEN';
  change_price: number;
  change_rate: number;
  signed_change_rate: number;
  high_price: number;
  low_price: number;
  acc_trade_price_24h: number;
  acc_trade_volume_24h: number;
  timestamp: number;
}

export async function fetchTickers(markets: string[]): Promise<Ticker[]> {
  if (markets.length === 0) return [];
  const data = await publicGet<UpbitTicker[]>(
    `/v1/ticker?markets=${encodeURIComponent(markets.join(','))}`,
  );
  return data.map((t) => ({
    market: t.market,
    tradePrice: t.trade_price,
    prevClosingPrice: t.prev_closing_price,
    change: t.change,
    changePrice: t.change_price,
    changeRate: t.change_rate,
    signedChangeRate: t.signed_change_rate,
    highPrice: t.high_price,
    lowPrice: t.low_price,
    accTradePrice24h: t.acc_trade_price_24h,
    accTradeVolume24h: t.acc_trade_volume_24h,
    timestamp: t.timestamp,
  }));
}

interface UpbitCandle {
  market: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number;
  timestamp: number;
  unit: number;
}

export async function fetchCandles(
  market: string,
  unit: number,
  count: number,
): Promise<Candle[]> {
  const data = await publicGet<UpbitCandle[]>(
    `/v1/candles/minutes/${unit}?market=${encodeURIComponent(market)}&count=${count}`,
  );
  // Upbit returns most-recent-first; our domain wants oldest-last.
  return data
    .map((c) => ({
      market: c.market,
      timestamp: c.timestamp,
      open: c.opening_price,
      high: c.high_price,
      low: c.low_price,
      close: c.trade_price,
      volume: c.candle_acc_trade_volume,
      unit: c.unit,
    }))
    .reverse();
}

// ── Authenticated: account + orders ─────────────────────────────

interface UpbitAccount {
  currency: string;
  balance: string;
  locked: string;
  avg_buy_price: string;
}

export async function fetchBalances(): Promise<Balance[]> {
  const data = await authGet<UpbitAccount[]>('/v1/accounts');
  return data.map((a) => ({
    currency: a.currency,
    balance: parseFloat(a.balance) || 0,
    locked: parseFloat(a.locked) || 0,
    avgBuyPrice: parseFloat(a.avg_buy_price) || 0,
  }));
}

interface UpbitOrder {
  uuid: string;
  side: 'bid' | 'ask';
  ord_type: string;
  price: string | null;
  state: string;
  market: string;
  created_at: string;
  volume: string | null;
  executed_volume: string | null;
  paid_fee: string | null;
}

function mapOrder(o: UpbitOrder): Order {
  const ordType: Order['type'] =
    o.ord_type === 'price' ? 'price' : o.ord_type === 'market' ? 'market' : 'limit';
  const state: Order['state'] =
    o.state === 'done' ? 'done' : o.state === 'cancel' ? 'cancel' : 'wait';
  return {
    id: o.uuid,
    market: o.market,
    side: o.side,
    type: ordType,
    price: o.price ? parseFloat(o.price) : undefined,
    volume: o.volume ? parseFloat(o.volume) : 0,
    executedVolume: o.executed_volume ? parseFloat(o.executed_volume) : 0,
    avgFillPrice: o.price ? parseFloat(o.price) : 0,
    paidFee: o.paid_fee ? parseFloat(o.paid_fee) : 0,
    state,
    createdAt: new Date(o.created_at).getTime(),
  };
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const data = await authGet<UpbitOrder[]>('/v1/orders/closed', {
      limit: 100,
      order_by: 'desc',
    });
    return data.map(mapOrder);
  } catch {
    // Older API shape / permission issues — degrade gracefully.
    return [];
  }
}

export interface PlaceOrderParams {
  market: string;
  side: 'bid' | 'ask';
  /** 'price' = market buy (price=KRW amount); 'market' = market sell (volume=base). */
  ord_type: 'price' | 'market' | 'limit';
  volume?: number;
  price?: number;
}

export async function placeOrder(p: PlaceOrderParams): Promise<Order> {
  const params: Record<string, string | number> = {
    market: p.market,
    side: p.side,
    ord_type: p.ord_type,
  };
  if (p.volume !== undefined) params.volume = String(p.volume);
  if (p.price !== undefined) params.price = String(p.price);

  const token = createUpbitToken(params);
  const res = await fetch(`${BASE}/v1/orders`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Upbit order failed: ${res.status} ${await res.text()}`);
  }
  return mapOrder((await res.json()) as UpbitOrder);
}
