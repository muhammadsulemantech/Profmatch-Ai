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

  // Allow static assets and public APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.')
  ) {
    return response;
  }

  // 2. Auth Cookie or Mock Session check
  const authCookie = request.cookies.get('sb-access-token') || request.cookies.get('profmatch_session');
  const userRole = request.cookies.get('profmatch_role')?.value || 'USER';
  const userCookie = request.cookies.get('profmatch_user')?.value;
  const sessionCookie = request.cookies.get('profmatch_session')?.value;

  let userEmail = '';
  if (userCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(userCookie));
      userEmail = parsed?.email?.toLowerCase() || '';
    } catch {}
  }

  // 3. Admin Route Protection
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname === '/admin/login') {
      return response;
    }
    
    const isAdmin =
      userRole === 'ADMIN' ||
      userRole === 'SUPER_ADMIN' ||
      userEmail === 'sulemanmunir6752@gmail.com' ||
      userEmail === 'admin@profmatch.ai' ||
      sessionCookie?.startsWith('admin_elevated_') ||
      request.headers.get('x-admin-role') === 'ADMIN' ||
      request.cookies.get('profmatch_role')?.value === 'ADMIN';

    if (!isAdmin) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin privileges required.' },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
  }

  // 4. Protected API Endpoints (Backend Server Protection - Requirement #4)
  const protectedApis = ['/api/professors/search', '/api/email/send', '/api/checkout/submit'];
  const isProtectedApi = protectedApis.some(p => pathname.startsWith(p));
  const hasAuth = !!authCookie || !!request.headers.get('authorization');

  if (isProtectedApi && !hasAuth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Authentication required to use this feature.' },
      { status: 401 }
    );
  }

  // 5. Protected User Workspaces (Note: /dashboard is kept accessible in preview mode per Requirement #1)
  const strictlyProtectedPaths = ['/onboarding', '/profile'];
  const isStrictlyProtected = strictlyProtectedPaths.some(p => pathname.startsWith(p));

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
