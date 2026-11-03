import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';
  const response = NextResponse.redirect(`${origin}/`);

  // Clear any existing cookies that could accumulate or cause header issues
  const allCookies = request.cookies.getAll();
  for (const cookie of allCookies) {
    if (
      cookie.name.startsWith('sb-') ||
      cookie.name.startsWith('profmatch_') ||
      cookie.name.includes('token') ||
      cookie.name.includes('vercel')
    ) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }
  }

  return response;
}
