import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import {
  saveUserProfile,
  getUserPlanTier,
  getUsageRecord,
} from '@/lib/services/db-service';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          user: null,
          error: 'Unauthorized: No active verified session.',
        },
        { status: 401 }
      );
    }

    const savedUser = await saveUserProfile({
      id: session.user.id,
      email: session.user.email,
      full_name: session.user.full_name,
      avatar_url: session.user.avatar_url,
      role: session.user.role,
    });

    const tier = await getUserPlanTier(savedUser.id);
    const usage = await getUsageRecord(savedUser.id);

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        full_name: savedUser.full_name,
        role: savedUser.role,
        avatar_url: savedUser.avatar_url,
        tier,
        usage,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, authenticated: false, user: null, error: 'Internal session error.' },
      { status: 500 }
    );
  }
}
