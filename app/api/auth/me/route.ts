import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import {
  getUserProfile,
  saveUserProfile,
  getUserSubscription,
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

    if (session.user.is_suspended) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          user: null,
          error: 'Account has been suspended by an administrator.',
        },
        { status: 403 }
      );
    }

    let userProfile = await getUserProfile(session.user.id);

    if (!userProfile) {
      userProfile = await saveUserProfile({
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.full_name,
        avatar_url: session.user.avatar_url,
        role: session.user.role,
      });
    }

    const sub = await getUserSubscription(userProfile.id);
    const tier = await getUserPlanTier(userProfile.id);
    const usage = await getUsageRecord(userProfile.id);

    const isExpired = Boolean(
      sub &&
        sub.plan_type !== 'FREE' &&
        sub.current_period_end &&
        new Date(sub.current_period_end).getTime() < Date.now()
    );

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        role: userProfile.role,
        avatar_url: userProfile.avatar_url,
        is_suspended: userProfile.is_suspended ?? false,
        tier,
        plan_tier: tier,
        subscription_status: isExpired ? 'expired' : (sub ? sub.status : 'free'),
        subscription_start: sub ? (sub.current_period_start || sub.created_at) : null,
        subscription_end: sub ? sub.current_period_end : null,
        is_expired: isExpired,
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

