import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { verifyAuthSession } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    mockDb.loadFromDisk();

    const session = await verifyAuthSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 1. Check in-memory / persistent mockDb
    let account = mockDb.getConnectedEmailAccount(userId);

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

    // If mockDb lost state (e.g. fresh Vercel serverless lambda instance), restore it from cookies!
    if (!account && (parsedAccountCookie?.connected || parsedTokensCookie?.email)) {
      const email = parsedAccountCookie?.email || parsedTokensCookie?.email;
      account = mockDb.saveConnectedEmailAccount({
        user_id: userId,
        email: email,
        access_token: parsedTokensCookie?.access_token || '',
        refresh_token: parsedTokensCookie?.refresh_token || '',
        token_expires_at: parsedTokensCookie?.token_expires_at || Date.now() + 3600000,
        connected_at: parsedAccountCookie?.connected_at || new Date().toISOString(),
        status: 'ACTIVE',
      });
    }

    if (account && account.status === 'ACTIVE') {
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

      // Keep 1-year cookie refreshed
      if (!accountCookie) {
        response.cookies.set('profmatch_gmail_account', JSON.stringify({
          connected: true,
          email: account.email,
          connected_at: account.connected_at,
          user_id: userId,
          provider: 'gmail'
        }), {
          path: '/',
          maxAge: 31536000,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: false,
        });
      }

      return response;
    }

    if (parsedAccountCookie && parsedAccountCookie.connected) {
      return NextResponse.json({
        connected: true,
        isConnected: true,
        account: {
          id: 'acc_gmail_cookie',
          email: parsedAccountCookie.email,
          provider: 'gmail',
          connected_at: parsedAccountCookie.connected_at || new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ connected: false, isConnected: false });
  } catch (err: any) {
    return NextResponse.json({ connected: false, isConnected: false, error: err.message }, { status: 500 });
  }
}

// POST endpoint to sync / restore client-side connection backup
export async function POST(request: NextRequest) {
  try {
    mockDb.loadFromDisk();
    const body = await request.json();
    const { email, connected_at } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const session = await verifyAuthSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const saved = mockDb.saveConnectedEmailAccount({
      user_id: userId,
      email: email.toLowerCase().trim(),
      connected_at: connected_at || new Date().toISOString(),
      status: 'ACTIVE'
    });

    const response = NextResponse.json({
      success: true,
      connected: true,
      account: {
        id: saved.id,
        email: saved.email,
        provider: 'gmail',
        connected_at: saved.connected_at,
      }
    });

    // Re-set the 1-year cookie
    response.cookies.set('profmatch_gmail_account', JSON.stringify({
      connected: true,
      email: saved.email,
      connected_at: saved.connected_at,
      user_id: userId,
      provider: 'gmail'
    }), {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    mockDb.loadFromDisk();

    const session = await verifyAuthSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const disconnected = mockDb.deleteConnectedEmailAccount(userId);

    const response = NextResponse.json({ success: true, disconnected: true });

    // Explicitly clear 1-year cookies on manual disconnect
    response.cookies.set('profmatch_gmail_account', '', { path: '/', maxAge: 0 });
    response.cookies.set('profmatch_gmail_tokens', '', { path: '/', maxAge: 0 });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

