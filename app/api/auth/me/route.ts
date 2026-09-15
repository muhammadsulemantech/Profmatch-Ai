import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.full_name,
        role: session.user.role,
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
