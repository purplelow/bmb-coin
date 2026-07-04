/**
 * Session helpers for API routes — SERVER ONLY.
 * The middleware only does an optimistic cookie check; money-touching routes
 * must call requireSession() for a real signature-verified session.
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from './auth';

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Returns the session, or a ready-to-return 401 response. */
export async function requireSession(): Promise<
  | { session: NonNullable<Awaited<ReturnType<typeof getSession>>>; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }),
    };
  }
  return { session, error: null };
}
