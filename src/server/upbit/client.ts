/**
 * Upbit REST client — SERVER ONLY.
 *
 * Wraps the Upbit v1 API and maps responses to our domain types. Authenticated
 * calls use createUpbitToken(). Public calls (markets/ticker/candles) need no key.
 */

import type { Balance, Candle, Market, Order, Ticker } from '@/types/domain';
import { createUpbitToken } from './signing';

const BASE = 'https://api.upbit.com';

// 업비트 공개 API는 IP당 초당 10회 제한. 마켓 화면처럼 캔들 요청이 버스트로
// 몰리면 초과분이 429로 거절되므로, 시작 시각을 110ms 간격으로 벌려 내보내고
// 그래도 429를 맞으면 잠시 뒤 재시도한다.
const PUBLIC_GAP_MS = 110;
let nextPublicSlot = 0;

async function pacePublic(): Promise<void> {
  const now = Date.now();
  const at = Math.max(now, nextPublicSlot);
  nextPublicSlot = at + PUBLIC_GAP_MS;
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

async function publicGet<T>(path: string, retries = 2): Promise<T> {
  await pacePublic();
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 429 && retries > 0) {
    await new Promise((r) => setTimeout(r, 500));
    return publicGet(path, retries - 1);
  }
  if (!res.ok) {
    throw new Error(`Upbit ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function authGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const token = createUpbitToken(params);
  const qs = params
    ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
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

export async function fetchCandles(market: string, unit: number, count: number): Promise<Candle[]> {
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

interface UpbitOrderbook {
  market: string;
  orderbook_units: Array<{ ask_price: number; bid_price: number }>;
}

export interface OrderbookSpread {
  market: string;
  bestBid: number;
  bestAsk: number;
  /** (ask - bid) / mid, in percent. 시장가 왕복 시 확정 손실의 하한. */
  spreadPct: number;
}

export async function fetchOrderbookSpread(market: string): Promise<OrderbookSpread> {
  const data = await publicGet<UpbitOrderbook[]>(
    `/v1/orderbook?markets=${encodeURIComponent(market)}`,
  );
  const top = data[0]?.orderbook_units[0];
  if (!top) throw new Error(`Upbit orderbook empty for ${market}`);
  const mid = (top.ask_price + top.bid_price) / 2;
  return {
    market,
    bestBid: top.bid_price,
    bestAsk: top.ask_price,
    spreadPct: mid > 0 ? ((top.ask_price - top.bid_price) / mid) * 100 : 0,
  };
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
  /** 체결 금액 합(KRW). 구형 응답에는 없을 수 있다. */
  executed_funds?: string | null;
  paid_fee: string | null;
}

function mapOrder(o: UpbitOrder): Order {
  const ordType: Order['type'] =
    o.ord_type === 'price' ? 'price' : o.ord_type === 'market' ? 'market' : 'limit';
  const state: Order['state'] =
    o.state === 'done' ? 'done' : o.state === 'cancel' ? 'cancel' : 'wait';

  const price = o.price ? parseFloat(o.price) : undefined;
  const executedVolume = o.executed_volume ? parseFloat(o.executed_volume) : 0;
  const executedFunds = o.executed_funds ? parseFloat(o.executed_funds) : undefined;

  // 평균 체결가: 체결 금액이 있으면 그걸로. 없으면 지정가만 price가 단가라서
  // 그대로 쓴다. 시장가 매수(ord_type=price)의 price는 "지출한 KRW 총액"이라
  // 단가가 아니다 — 총액을 수량으로 나눠 근사하고, 시장가 매도는 알 수 없음(0).
  let avgFillPrice = 0;
  if (executedFunds !== undefined && executedVolume > 0) {
    avgFillPrice = executedFunds / executedVolume;
  } else if (ordType === 'limit' && price !== undefined) {
    avgFillPrice = price;
  } else if (ordType === 'price' && price !== undefined && executedVolume > 0) {
    avgFillPrice = price / executedVolume;
  }

  return {
    id: o.uuid,
    market: o.market,
    side: o.side,
    type: ordType,
    price,
    volume: o.volume ? parseFloat(o.volume) : 0,
    executedVolume,
    executedFunds:
      executedFunds ?? (ordType === 'price' && price !== undefined ? price : undefined),
    avgFillPrice,
    paidFee: o.paid_fee ? parseFloat(o.paid_fee) : 0,
    state,
    createdAt: new Date(o.created_at).getTime(),
  };
}

export interface OrderFill {
  executedVolume: number;
  /** 체결 금액 합(KRW), 수수료 차감 전. */
  executedFunds: number;
  paidFee: number;
  done: boolean;
}

interface UpbitOrderDetail extends UpbitOrder {
  trades?: Array<{ price: string; volume: string; funds: string }>;
}

/**
 * 단일 주문의 실제 체결 내역 조회 — 봇 P&L을 추정가가 아닌 실체결가로
 * 계산하기 위해 쓴다. trades의 funds 합이 가장 정확하고, 없으면
 * executed_funds로 폴백한다.
 */
export async function fetchOrderFill(uuid: string): Promise<OrderFill> {
  const o = await authGet<UpbitOrderDetail>('/v1/order', { uuid });
  const executedVolume = o.executed_volume ? parseFloat(o.executed_volume) : 0;
  let executedFunds = 0;
  if (o.trades && o.trades.length > 0) {
    executedFunds = o.trades.reduce((sum, t) => sum + (parseFloat(t.funds) || 0), 0);
  } else if (o.executed_funds) {
    executedFunds = parseFloat(o.executed_funds) || 0;
  }
  return {
    executedVolume,
    executedFunds,
    paidFee: o.paid_fee ? parseFloat(o.paid_fee) : 0,
    done: o.state === 'done' || o.state === 'cancel',
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
