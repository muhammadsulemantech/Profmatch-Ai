import { NextRequest, NextResponse } from 'next/server';
import { saveUserProfile } from '@/lib/services/db-service';
import { isAdminEmail } from '@/lib/auth/server-auth';
import { validateSafeRedirect } from '@/lib/security/url-validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateEncoded = searchParams.get('state');
  const error = searchParams.get('error');

  let redirectTo = '/choose-plan';
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';

  if (stateEncoded) {
    try {
      const parsedState = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf-8'));
      if (parsedState.redirectTo) {
        redirectTo = validateSafeRedirect(parsedState.redirectTo, '/choose-plan');
      }
    } catch {
      // safe fallback
    }
  }

  if (error || !code) {
    console.error('[GOOGLE OAUTH CALLBACK ERROR]', error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error || 'Google auth was cancelled.')}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. Exchange code for Google Access Token
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
      console.error('[GOOGLE TOKEN EXCHANGE FAILED]', tokenData?.error || 'Token exchange failed');
      return NextResponse.redirect(`${origin}/login?error=Failed to exchange Google OAuth code.`);
    }

    // 2. Fetch User Info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    if (!userRes.ok || !googleUser.email) {
      return NextResponse.redirect(`${origin}/login?error=Failed to fetch Google user profile.`);
    }

    const cleanEmail = googleUser.email.toLowerCase().trim();
    const isSystemAdmin = isAdminEmail(cleanEmail);

    const user = await saveUserProfile({
      id: googleUser.id ? `usr_google_${googleUser.id}` : `usr_google_${Date.now()}`,
      email: cleanEmail,
      full_name: googleUser.name || googleUser.email.split('@')[0],
      avatar_url: googleUser.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: isSystemAdmin ? 'ADMIN' : 'USER',
    });

    const responseUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role: user.role,
    };

    const targetUrl = redirectTo.startsWith('http') ? redirectTo : `${origin}${redirectTo.startsWith('/') ? '' : '/'}${redirectTo}`;
    return NextResponse.redirect(targetUrl);
  } catch (err: any) {
    console.error('[GOOGLE CALLBACK ERROR]', err);
    return NextResponse.redirect(`${origin}/login?error=Google authentication process failed.`);
  }
}
