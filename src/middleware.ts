import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

/**
 * Optimistic auth gate for app pages (cookie presence only — fast, no DB).
 * Real verification happens in API routes via requireSession().
 */
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (!sessionCookie && !isAuthPage) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/market',
    '/market/:path*',
    '/bots',
    '/portfolio',
    '/settings',
    '/login',
    '/signup',
  ],
};
