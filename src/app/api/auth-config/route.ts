import { NextResponse } from 'next/server';
import { enabledSocialProviders } from '@/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Which social login providers are configured (for the login/signup UI). */
export function GET() {
  return NextResponse.json({ social: enabledSocialProviders });
}
