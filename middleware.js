import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'gym_session';
const PUBLIC_PATHS = ['/login'];
const ADMIN_PATHS = ['/dashboard', '/members', '/memberships', '/instructors', '/equipment', '/notifications', '/configurations', '/reports'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  // Allow public paths without auth
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // If already logged in, redirect to dashboard
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === '/') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protected admin paths — require session cookie
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
