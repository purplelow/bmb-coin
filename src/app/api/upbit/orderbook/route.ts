import { NextResponse } from 'next/server';
import { fetchOrderbookSpread } from '@/server/upbit/client';
import { maxSpreadPct } from '@/server/upbit/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 호가 스프레드 조회 (공개 데이터) — 봇 생성 폼의 저가 코인 경고용. */
export async function GET(req: Request) {
  const market = new URL(req.url).searchParams.get('market');
  if (!market) {
    return NextResponse.json({ error: 'market 쿼리가 필요합니다.' }, { status: 400 });
  }
  try {
    const spread = await fetchOrderbookSpread(market);
    return NextResponse.json({ ...spread, maxSpreadPct: maxSpreadPct() });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
