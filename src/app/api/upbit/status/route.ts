import { NextResponse } from 'next/server';
import { hasUpbitKeys } from '@/server/upbit/signing';
import { maxOrderKRW, dailyCapKRW, dailySpent, dailyRemaining } from '@/server/upbit/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Reports whether live trading is configured + the current safety-cap state.
 *  Never returns the keys themselves. */
export function GET() {
  return NextResponse.json({
    configured: hasUpbitKeys(),
    maxOrderKRW: maxOrderKRW(),
    dailyCapKRW: dailyCapKRW(),
    dailySpent: dailySpent(),
    dailyRemaining: dailyRemaining(),
  });
}
