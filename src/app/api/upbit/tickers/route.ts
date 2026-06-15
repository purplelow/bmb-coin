import { NextRequest, NextResponse } from 'next/server';
import { fetchTickers } from '@/server/upbit/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const markets = (req.nextUrl.searchParams.get('markets') ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  try {
    return NextResponse.json(await fetchTickers(markets));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
