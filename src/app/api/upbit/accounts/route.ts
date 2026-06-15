import { NextResponse } from 'next/server';
import { hasUpbitKeys } from '@/server/upbit/signing';
import { fetchBalances } from '@/server/upbit/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasUpbitKeys()) {
    return NextResponse.json(
      { error: 'Upbit API 키가 설정되지 않았습니다.' },
      { status: 503 },
    );
  }
  try {
    return NextResponse.json(await fetchBalances());
  } catch (e) {
    const message = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
