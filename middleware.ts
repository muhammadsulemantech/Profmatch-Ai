import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Unified Strict Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-ancestors 'none';"
  );

  // 1b. Enforce HTTPS in production behind reverse proxies terminating TLS (HTTP -> HTTPS 301)
  const proto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host') || '';
  if (process.env.NODE_ENV === 'production' && proto === 'http') {
    const httpsUrl = `https://${host}${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Allow static assets, next internals, and public health checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|webp)$/i.test(pathname)
  ) {
    return response;
  }

  // 1c. Global Edge API Rate Limiting to prevent DoS / automated bot attacks
  if (pathname.startsWith('/api')) {
    const ip = getClientIp(request);
    let category = 'api';
    let limitOpts = { limit: 120, windowMs: 60 * 1000 };

    if (pathname.startsWith('/api/auth')) {
      category = 'api_auth';
      limitOpts = { limit: 30, windowMs: 60 * 1000 };
    } else if (
      pathname.startsWith('/api/profile/parse-cv') ||
      pathname.startsWith('/api/matches/analyze') ||
      pathname.startsWith('/api/autopilot') ||
      pathname.startsWith('/api/outreach')
    ) {
      category = 'api_heavy';
      limitOpts = { limit: 30, windowMs: 60 * 1000 };
    } else if (pathname.startsWith('/api/admin')) {
      category = 'api_admin';
      limitOpts = { limit: 60, windowMs: 60 * 1000 };
    }

    const rl = checkRateLimit(`mw:${category}:${ip}`, limitOpts);

    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: 'Too many requests. Please slow down and try again later.',
          retryAfterSeconds: retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limitOpts.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rl.reset / 1000).toString(),
          },
        }
      );
    }

    response.headers.set('X-RateLimit-Limit', limitOpts.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rl.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(rl.reset / 1000).toString());
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
