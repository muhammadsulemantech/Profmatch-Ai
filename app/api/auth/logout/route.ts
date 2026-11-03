import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Continue clearing cookies
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    // Dynamically clear all auth & Supabase cookies (including chunked tokens)
    const allCookies = request.cookies.getAll();
    const cookiesToClear = new Set([
      'profmatch_session',
      'profmatch_role',
      'profmatch_user',
      'sb-access-token',
      'sb-refresh-token',
    ]);

    for (const c of allCookies) {
      if (c.name.startsWith('sb-') || c.name.startsWith('profmatch_')) {
        cookiesToClear.add(c.name);
      }
    }

    for (const name of Array.from(cookiesToClear)) {
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }

    return response;
  } catch (err) {
    console.error('[LOGOUT ERROR]', err);
    return NextResponse.json({ success: false, error: 'Failed to logout' }, { status: 500 });
  }
}
