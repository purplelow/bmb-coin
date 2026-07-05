import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

/**
 * Login is OPTIONAL: every app page is browsable without a session (paper
 * trading works fully logged-out). Auth is enforced only where real money or
 * account data is involved — the API routes via requireSession().
 * Here we only bounce already-authenticated users away from /login|/signup.
 */
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup'],
};
