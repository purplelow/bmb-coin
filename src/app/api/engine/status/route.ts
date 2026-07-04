import { NextResponse } from 'next/server';
import { getEngineStatus } from '@/server/engine/runner';
import { requireSession } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 24/7 server engine heartbeat for the settings UI. */
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;
  return NextResponse.json(getEngineStatus());
}
