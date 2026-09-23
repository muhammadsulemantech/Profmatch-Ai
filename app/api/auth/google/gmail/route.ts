import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { createSignedOAuthState } from '@/lib/security/oauth-state';
import { validateSafeRedirect } from '@/lib/security/url-validation';

export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';

  // 1. Require authenticated session server-side
  const session = await verifyAuthSession(request);
  if (!session || !session.user) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('redirectTo', '/connectors');
    loginUrl.searchParams.set('error', 'Please log in before connecting your Gmail account.');
    return NextResponse.redirect(loginUrl.toString());
  }

  const { searchParams } = new URL(request.url);
  const rawRedirectTo = searchParams.get('redirectTo') || '/connectors';
  const safeRedirectTo = validateSafeRedirect(rawRedirectTo, '/connectors');

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      `${origin}${safeRedirectTo}?error=${encodeURIComponent(
        'Google Client ID is missing in server environment variables.'
      )}`
    );
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/gmail/callback`;

  // 2. Cryptographically bind user ID and nonce into HMAC-signed state
  const signedState = createSignedOAuthState({
    userId: session.user.id,
    redirectTo: safeRedirectTo,
  });

  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope:
        'openid email profile https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send',
      access_type: 'offline',
      prompt: 'consent',
      state: signedState,
    }).toString();

  return NextResponse.redirect(googleAuthUrl);
}
