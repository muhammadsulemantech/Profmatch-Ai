import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirectTo') || '/choose-plan';
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel Environment Variables.')}`);
  }
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  const state = Buffer.from(JSON.stringify({ redirectTo, origin })).toString('base64');

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: state,
  }).toString();

  return NextResponse.redirect(googleAuthUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, picture, sub, targetDegree } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required for Google auth.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isSystemAdmin = cleanEmail === 'sulemanmunir6752@gmail.com' || cleanEmail === 'admin@profmatch.ai';

    let user = mockDb.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    const now = new Date().toISOString();

    if (!user) {
      user = {
        id: sub ? `usr_google_${sub}` : `usr_g_${Date.now()}`,
        email: cleanEmail,
        full_name: name || email.split('@')[0],
        avatar_url: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
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
        target_degree: targetDegree || 'PhD',
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
      target_degree: targetDegree || 'PhD',
    };

    const res = NextResponse.json({ success: true, user: responseUser });

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
    console.error('[GOOGLE AUTH POST ERROR]', err);
    return NextResponse.json({ success: false, error: err.message || 'Google authentication failed.' }, { status: 500 });
  }
}
