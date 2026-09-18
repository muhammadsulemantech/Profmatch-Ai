import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirectTo') || '/connectors';
  const userId = searchParams.get('userId') || '';

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(`${origin}/connectors?error=${encodeURIComponent('Google Client ID is missing in Vercel Environment Variables.')}`);
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/gmail/callback`;
  const state = Buffer.from(JSON.stringify({ redirectTo, origin, userId })).toString('base64');

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile https://www.googleapis.com/auth/gmail.compose',
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  }).toString();

  return NextResponse.redirect(googleAuthUrl);
}
