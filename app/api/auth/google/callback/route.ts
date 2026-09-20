import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateEncoded = searchParams.get('state');
  const error = searchParams.get('error');

  let redirectTo = '/choose-plan';
  let origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';

  if (stateEncoded) {
    try {
      const parsedState = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf-8'));
      if (parsedState.redirectTo) redirectTo = parsedState.redirectTo;
      if (parsedState.origin) origin = parsedState.origin;
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
      console.error('[GOOGLE TOKEN EXCHANGE FAILED]', tokenData);
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
    const isSystemAdmin = cleanEmail === 'sulemanmunir6752@gmail.com' || cleanEmail === 'admin@profmatch.ai';

    mockDb.loadFromDisk();
    let user = mockDb.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    const now = new Date().toISOString();

    if (!user) {
      user = {
        id: googleUser.id ? `usr_google_${googleUser.id}` : `usr_g_${Date.now()}`,
        email: cleanEmail,
        full_name: googleUser.name || googleUser.email.split('@')[0],
        avatar_url: googleUser.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role: isSystemAdmin ? 'ADMIN' : 'USER',
        is_suspended: false,
        created_at: now,
        updated_at: now,
      };
      mockDb.profiles.push(user);

      // Create student profile
      mockDb.studentProfiles.push({
        id: `sp_${Date.now()}`,
        user_id: user.id,
        country: 'Global',
        target_degree: 'PhD',
        target_country: 'United States',
        target_state: 'Global',
        target_intake: 'Fall 2027',
        funding_preference: 'Fully Funded (RA/TA)',
        desired_field: 'Artificial Intelligence & Computer Science',
        bio: `Graduate applicant (${user.full_name}) registered via Google Auth.`,
        created_at: now,
        updated_at: now,
      });

      mockDb.persist();
    }

    const responseUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role: user.role,
    };

    const targetUrl = redirectTo.startsWith('http') ? redirectTo : `${origin}${redirectTo.startsWith('/') ? '' : '/'}${redirectTo}`;
    const res = NextResponse.redirect(targetUrl);

    // Set auth cookies
    const cookieOptions = {
      path: '/',
      maxAge: 30 * 86400,
      httpOnly: false,
      sameSite: 'lax' as const,
    };

    res.cookies.set('profmatch_session', `session_${user.id}_${Date.now()}`, cookieOptions);
    res.cookies.set('profmatch_user', JSON.stringify(responseUser), cookieOptions);
    res.cookies.set('profmatch_role', user.role, cookieOptions);

    return res;
  } catch (err: any) {
    console.error('[GOOGLE CALLBACK ERROR]', err);
    return NextResponse.redirect(`${origin}/login?error=Google authentication process failed.`);
  }
}
