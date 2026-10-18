import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'gym_session';
const PUBLIC_PATHS = ['/login', '/setup'];
const ADMIN_PATHS = ['/dashboard', '/members', '/memberships', '/instructors', '/equipment', '/notifications', '/configurations', '/reports'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  // Public paths — always allow through. Do NOT redirect to dashboard
  // based on cookie alone — the cookie may be stale or invalid.
  // The admin layout's getSession() will validate and redirect if needed.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === '/') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protected admin paths — require session cookie to exist (basic gate).
  // Full validation happens in the admin layout via getSession().
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
