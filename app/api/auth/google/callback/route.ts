import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { saveUserProfile, saveUserSubscription, getUserSubscription, getProfileByEmail } from '@/lib/services/db-service';
import { isAdminEmail } from '@/lib/auth/server-auth';
import { validateSafeRedirect } from '@/lib/security/url-validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateEncoded = searchParams.get('state');
  const error = searchParams.get('error');

  let redirectTo = '/dashboard';
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';

  if (stateEncoded) {
    try {
      const parsedState = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf-8'));
      if (parsedState.redirectTo) {
        redirectTo = validateSafeRedirect(parsedState.redirectTo, '/dashboard');
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

    // 3. Establish authentic Supabase Auth session and generate auth tokens
    const adminClient = createAdminClient();
    let sbUserId: string | null = null;
    let authHashedToken: string | null = null;

    if (adminClient) {
      try {
        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
          type: 'magiclink',
          email: cleanEmail,
          options: {
            data: {
              full_name: googleUser.name || cleanEmail.split('@')[0],
              avatar_url: googleUser.picture || null,
            },
          },
        });

        if (!linkErr && linkData?.user) {
          sbUserId = linkData.user.id;
          authHashedToken = linkData.properties?.hashed_token || null;
        }
      } catch (authErr) {
        console.error('[GOOGLE SUPABASE AUTH ADMIN ERROR]', authErr);
      }
    }

    // 4. Look up existing persistent profile by email to preserve real UUID
    const existingProfile = await getProfileByEmail(cleanEmail);
    const userId = sbUserId || (existingProfile ? existingProfile.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr_google_${Date.now()}`));

    const user = await saveUserProfile({
      id: userId,
      email: cleanEmail,
      full_name: existingProfile?.full_name || googleUser.name || cleanEmail.split('@')[0],
      avatar_url: existingProfile?.avatar_url || googleUser.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: isSystemAdmin ? 'ADMIN' : (existingProfile?.role || 'USER'),
      is_suspended: existingProfile?.is_suspended ?? false,
      suspension_reason: existingProfile?.suspension_reason ?? null,
    });

    try {
      const existingSub = await getUserSubscription(user.id);
      if (!existingSub) {
        await saveUserSubscription({
          user_id: user.id,
          plan_type: 'FREE',
          status: 'active',
        });
      }
    } catch {
      // Non-blocking subscription initialization
    }

    // 5. Build safe target redirect URL
    const targetUrl = redirectTo && redirectTo !== '/choose-plan'
      ? (redirectTo.startsWith('http') ? redirectTo : `${origin}${redirectTo.startsWith('/') ? '' : '/'}${redirectTo}`)
      : `${origin}/dashboard`;

    const redirectResponse = NextResponse.redirect(targetUrl);

    // 6. Verify OTP and attach auth cookies so browser is immediately recognized as logged in
    if (authHashedToken) {
      const supabaseServerClient = createClient();
      if (supabaseServerClient) {
        try {
          await supabaseServerClient.auth.verifyOtp({
            token_hash: authHashedToken,
            type: 'magiclink',
          });
        } catch (verifyErr) {
          console.error('[GOOGLE SUPABASE VERIFY OTP ERROR]', verifyErr);
        }
      }

      // Propagate all session cookies onto the redirect response
      try {
        const cookieJar = cookies();
        cookieJar.getAll().forEach((c) => {
          redirectResponse.cookies.set({
            name: c.name,
            value: c.value,
            path: '/',
          });
        });
      } catch (cookieErr) {
        console.error('[GOOGLE COOKIE ATTACH ERROR]', cookieErr);
      }
    }

    return redirectResponse;
  } catch (err: any) {
    console.error('[GOOGLE CALLBACK ERROR]', err);
    return NextResponse.redirect(`${origin}/login?error=Google authentication process failed.`);
  }
}
