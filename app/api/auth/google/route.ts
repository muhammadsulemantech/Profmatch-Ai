import { NextRequest, NextResponse } from 'next/server';
import { saveUserProfile } from '@/lib/services/db-service';
import { isAdminEmail } from '@/lib/auth/server-auth';

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

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed. Google authentication requires OAuth 2.0 authorization code flow via GET.' },
    { status: 405 }
  );
}

