import { NextRequest, NextResponse } from 'next/server';
import { saveConnectedEmailAccount } from '@/lib/services/db-service';
import { verifySignedOAuthState } from '@/lib/security/oauth-state';
import { validateSafeRedirect } from '@/lib/security/url-validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateEncoded = searchParams.get('state');
  const error = searchParams.get('error');

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';

  // 1. Verify HMAC-signed state parameter
  const stateVerification = verifySignedOAuthState(stateEncoded);
  if (!stateVerification.valid || !stateVerification.payload) {
    console.error('[GMAIL OAUTH STATE VERIFICATION FAILED]', stateVerification.error);
    const errorMsg = stateVerification.error || 'Invalid or expired OAuth state parameter.';
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(errorMsg)}`);
  }

  const { userId: currentUserId, redirectTo: rawRedirectTo } = stateVerification.payload;
  const safeRedirectTo = validateSafeRedirect(rawRedirectTo, '/settings');

  if (error || !code) {
    console.error('[GMAIL OAUTH CALLBACK ERROR]', error);
    return NextResponse.redirect(
      `${origin}${safeRedirectTo}?error=${encodeURIComponent(error || 'Gmail OAuth connection was cancelled.')}`
    );
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/gmail/callback`;

    // 2. Exchange authorization code for tokens
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
      console.error('[GMAIL TOKEN EXCHANGE ERROR]', tokenData?.error || 'Token exchange failed');
      return NextResponse.redirect(
        `${origin}${safeRedirectTo}?error=${encodeURIComponent(
          tokenData.error_description || 'Failed to exchange Gmail authorization code.'
        )}`
      );
    }

    // 3. Fetch Gmail profile email
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    if (!userRes.ok || !googleUser.email) {
      return NextResponse.redirect(`${origin}${safeRedirectTo}?error=Failed to fetch connected Gmail user profile.`);
    }

    // 4. Save connected email account (persisted to Supabase and encrypted server-side)
    await saveConnectedEmailAccount({
      user_id: currentUserId,
      email: googleUser.email.toLowerCase().trim(),
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || '',
      token_expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
      status: 'ACTIVE',
    });

    const targetUrl = `${origin}${safeRedirectTo}${
      safeRedirectTo.includes('?') ? '&' : '?'
    }gmail_connected=true&gmail_email=${encodeURIComponent(googleUser.email)}`;

    // Redirect to safe target without exposing tokens in browser cookies
    return NextResponse.redirect(targetUrl);
  } catch (err: any) {
    console.error('[GMAIL CALLBACK ERROR]', err);
    return NextResponse.redirect(
      `${origin}${safeRedirectTo}?error=${encodeURIComponent('Failed to complete Gmail connection.')}`
    );
  }
}
