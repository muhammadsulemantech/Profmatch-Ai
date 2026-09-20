import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { mockDb } from '@/lib/supabase/mock-db';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    // Auto-save user to persistent database if not yet stored
    const savedUser = mockDb.autoSaveUser({
      id: session.user.id,
      email: session.user.email,
      full_name: session.user.full_name,
      avatar_url: session.user.avatar_url,
      role: session.user.role,
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        full_name: savedUser.full_name,
        role: savedUser.role,
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
