import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateEncoded = searchParams.get('state');
  const error = searchParams.get('error');

  let redirectTo = '/settings';
  let origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';
  let userIdFromState = '';

  if (stateEncoded) {
    try {
      const parsedState = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf-8'));
      if (parsedState.redirectTo) redirectTo = parsedState.redirectTo;
      if (parsedState.origin) origin = parsedState.origin;
      if (parsedState.userId) userIdFromState = parsedState.userId;
    } catch {
      // safe fallback
    }
  }

  if (error || !code) {
    console.error('[GMAIL OAUTH CALLBACK ERROR]', error);
    return NextResponse.redirect(`${origin}${redirectTo}?error=${encodeURIComponent(error || 'Gmail OAuth connection was cancelled.')}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/gmail/callback`;

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[GMAIL TOKEN EXCHANGE ERROR]', tokenData);
      return NextResponse.redirect(`${origin}${redirectTo}?error=${encodeURIComponent(tokenData.error_description || 'Failed to exchange Gmail authorization code.')}`);
    }

    // 2. Fetch Gmail profile email
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    if (!userRes.ok || !googleUser.email) {
      return NextResponse.redirect(`${origin}${redirectTo}?error=Failed to fetch connected Gmail user profile.`);
    }

    // 3. Identify user ID from cookie or fallback
    let currentUserId = userIdFromState;
    if (!currentUserId) {
      const userCookie = request.cookies.get('profmatch_user')?.value;
      if (userCookie) {
        try {
          const parsed = JSON.parse(userCookie);
          if (parsed && parsed.id) currentUserId = parsed.id;
        } catch {
          // fallback
        }
      }
    }

    if (!currentUserId) {
      currentUserId = 'usr_student_001'; // Fallback to active student profile
    }

    // 4. Save connected email account to mockDb
    mockDb.loadFromDisk();
    mockDb.saveConnectedEmailAccount({
      user_id: currentUserId,
      email: googleUser.email.toLowerCase().trim(),
      google_account_id: googleUser.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || '',
      token_expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
      scopes: ['https://www.googleapis.com/auth/gmail.compose'],
      status: 'ACTIVE',
    });

    const targetUrl = `${origin}${redirectTo.startsWith('/') ? '' : '/'}${redirectTo}${redirectTo.includes('?') ? '&' : '?'}gmail_connected=true&gmail_email=${encodeURIComponent(googleUser.email)}`;
    const response = NextResponse.redirect(targetUrl);

    // 1-Year expiration (365 days) so user stays connected unless they explicitly disconnect
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    const expiresDate = new Date(Date.now() + ONE_YEAR_MS);

    // Public account info cookie
    response.cookies.set('profmatch_gmail_account', JSON.stringify({
      connected: true,
      email: googleUser.email.toLowerCase().trim(),
      connected_at: new Date().toISOString(),
      user_id: currentUserId,
      provider: 'gmail'
    }), {
      path: '/',
      expires: expiresDate,
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    });

    // Secure token cookie (refresh token + access token)
    response.cookies.set('profmatch_gmail_tokens', JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || '',
      token_expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
      email: googleUser.email.toLowerCase().trim(),
      user_id: currentUserId,
    }), {
      path: '/',
      expires: expiresDate,
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });

    return response;
  } catch (err: any) {
    console.error('[GMAIL CALLBACK ERROR]', err);
    return NextResponse.redirect(`${origin}${redirectTo}?error=${encodeURIComponent('Failed to complete Gmail connection.')}`);
  }
}
