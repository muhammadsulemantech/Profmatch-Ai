import { NextRequest, NextResponse } from 'next/server';
import {
  getConnectedEmailAccount,
  saveConnectedEmailAccount,
  deleteConnectedEmailAccount,
} from '@/lib/services/db-service';
import { verifyAuthSession } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 1. Check primary DB / persistent storage
    let account = await getConnectedEmailAccount(userId);

    // 2. Check 1-year persistent cookies (survives Vercel restarts & long idle periods)
    const accountCookie = request.cookies.get('profmatch_gmail_account')?.value;
    const tokensCookie = request.cookies.get('profmatch_gmail_tokens')?.value;

    let parsedAccountCookie: any = null;
    let parsedTokensCookie: any = null;

    if (accountCookie) {
      try {
        parsedAccountCookie = JSON.parse(accountCookie);
      } catch {}
    }
    if (tokensCookie) {
      try {
        parsedTokensCookie = JSON.parse(tokensCookie);
      } catch {}
    }

    // If account not found in DB, restore it from cookies only if tokens exist
    if (!account && parsedTokensCookie?.email && (parsedTokensCookie?.access_token || parsedTokensCookie?.refresh_token)) {
      account = await saveConnectedEmailAccount({
        user_id: userId,
        email: parsedTokensCookie.email,
        access_token: parsedTokensCookie.access_token || '',
        refresh_token: parsedTokensCookie.refresh_token || '',
        token_expires_at: parsedTokensCookie.token_expires_at || Date.now() + 3600000,
        status: 'ACTIVE',
      });
    }

    const hasValidTokens = Boolean(account?.access_token || account?.refresh_token);

    if (account && account.status === 'ACTIVE' && hasValidTokens) {
      const response = NextResponse.json({
        connected: true,
        isConnected: true,
        account: {
          id: account.id,
          email: account.email,
          provider: account.provider,
          connected_at: account.connected_at,
          last_used_at: account.last_used_at,
        },
      });

      return response;
    }

    return NextResponse.json({ connected: false, isConnected: false });
  } catch (err: any) {
    return NextResponse.json({ connected: false, isConnected: false, error: err.message }, { status: 500 });
  }
}

// POST endpoint to sync / restore client-side connection backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, access_token, refresh_token, connected_at } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const session = await verifyAuthSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Check if an existing account with tokens already exists in database
    const existing = await getConnectedEmailAccount(userId);
    if (existing && (existing.access_token || existing.refresh_token)) {
      return NextResponse.json({
        success: true,
        connected: true,
        account: {
          id: existing.id,
          email: existing.email,
          provider: 'gmail',
          connected_at: existing.connected_at,
        }
      });
    }

    // Do NOT create an active account without real OAuth tokens
    if (!access_token && !refresh_token) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'Active OAuth tokens are required. Please connect your Gmail via Connectors.'
      }, { status: 400 });
    }

    const saved = await saveConnectedEmailAccount({
      user_id: userId,
      email: email.toLowerCase().trim(),
      access_token,
      refresh_token,
      token_expires_at: Date.now() + 3600000,
      connected_at: connected_at || new Date().toISOString(),
      status: 'ACTIVE'
    });

    return NextResponse.json({
      success: true,
      connected: true,
      account: {
        id: saved.id,
        email: saved.email,
        provider: 'gmail',
        connected_at: saved.connected_at,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const disconnected = await deleteConnectedEmailAccount(userId);

    const response = NextResponse.json({ success: true, disconnected: true });

    // Explicitly clear 1-year cookies on manual disconnect
    response.cookies.set('profmatch_gmail_account', '', { path: '/', maxAge: 0 });
    response.cookies.set('profmatch_gmail_tokens', '', { path: '/', maxAge: 0 });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

