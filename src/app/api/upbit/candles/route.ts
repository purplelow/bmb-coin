import { NextRequest, NextResponse } from 'next/server';
import { fetchCandles } from '@/server/upbit/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const market = sp.get('market');
  const unit = Number(sp.get('unit') ?? '1') || 1;
  const count = Math.min(Number(sp.get('count') ?? '200') || 200, 200);
  if (!market) {
    return NextResponse.json({ error: 'market is required' }, { status: 400 });
  }
  try {
    return NextResponse.json(await fetchCandles(market, unit, count));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
