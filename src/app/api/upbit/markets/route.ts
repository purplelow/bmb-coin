import { NextResponse } from 'next/server';
import { fetchMarkets } from '@/server/upbit/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await fetchMarkets());
  } catch (e) {
    const message = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
