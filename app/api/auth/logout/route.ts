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

    // Clear all auth cookies
    const cookieNames = [
      'profmatch_session',
      'profmatch_role',
      'profmatch_user',
      'sb-access-token',
      'sb-refresh-token',
    ];

    for (const name of cookieNames) {
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
