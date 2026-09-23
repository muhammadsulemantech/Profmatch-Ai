import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Allow static assets, next internals, and public health checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|webp)$/i.test(pathname)
  ) {
    return response;
  }

  // 2. Check for Supabase session cookies or Bearer token (UX redirects only)
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') && c.value && c.value.length > 10
  );
  const hasAuthHeader = !!request.headers.get('authorization');
  const hasAuth = hasSupabaseCookie || hasAuthHeader;

  // 3. Admin UX redirect for browser navigation
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !pathname.startsWith('/api/admin')) {
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
  }

  // 4. Protected User Workspaces UX redirect
  const strictlyProtectedPaths = ['/onboarding', '/profile'];
  const isStrictlyProtected = strictlyProtectedPaths.some((p) => pathname.startsWith(p));

  if (isStrictlyProtected && !hasAuth) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
