import { NextRequest, NextResponse } from 'next/server';
import { hasUpbitKeys } from '@/server/upbit/signing';
import { fetchOrders, placeOrder, type PlaceOrderParams } from '@/server/upbit/client';
import { assertBuyWithinCaps, recordBuy, CapError } from '@/server/upbit/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasUpbitKeys()) {
    return NextResponse.json({ error: 'Upbit API 키가 설정되지 않았습니다.' }, { status: 503 });
  }
  try {
    return NextResponse.json(await fetchOrders());
  } catch (e) {
    const message = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

interface OrderBody {
  market: string;
  side: 'bid' | 'ask';
  type: 'price' | 'market' | 'limit';
  amount?: number; // KRW, for market buy
  volume?: number; // base asset, for market sell
  price?: number; // for limit
}

export async function POST(req: NextRequest) {
  if (!hasUpbitKeys()) {
    return NextResponse.json({ error: 'Upbit API 키가 설정되지 않았습니다.' }, { status: 503 });
  }

  let body: OrderBody;
  try {
    body = (await req.json()) as OrderBody;
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  if (!body.market || (body.side !== 'bid' && body.side !== 'ask')) {
    return NextResponse.json({ error: '주문 정보가 올바르지 않습니다.' }, { status: 400 });
  }

  const params: PlaceOrderParams = {
    market: body.market,
    side: body.side,
    ord_type: 'market',
  };

  try {
    if (body.side === 'bid') {
      // Market buy: spend a fixed KRW amount. Re-check caps server-side.
      const amount = Number(body.amount);
      assertBuyWithinCaps(amount);
      params.ord_type = 'price';
      params.price = amount;

      const order = await placeOrder(params);
      recordBuy(amount); // only after Upbit accepts the order
      return NextResponse.json(order);
    }

    // Market sell: a fixed base volume. No buy cap applies.
    const volume = Number(body.volume);
    if (!Number.isFinite(volume) || volume <= 0) {
      return NextResponse.json({ error: '매도 수량이 올바르지 않습니다.' }, { status: 400 });
    }
    params.ord_type = 'market';
    params.volume = volume;

    const order = await placeOrder(params);
    return NextResponse.json(order);
  } catch (e) {
    if (e instanceof CapError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : '주문 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
