import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { logAuditEvent } from '@/lib/security/audit';
import { assertAdmin } from '@/lib/auth/server-auth';
import { ACADEMIC_PLANS } from '@/lib/services/usage-service';
import { saveUserProfile, saveUserSubscription } from '@/lib/services/db-service';
import type { PlanTier } from '@/types/database';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  mockDb.loadFromDisk();

  const enrichedUsers = mockDb.profiles.map(u => {
    // Check for subscription in mockDb.subscriptions
    const sub = mockDb.subscriptions
      .filter(s => s.user_id === u.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const hasActiveSub = sub && sub.status === 'active';
    const planTier: PlanTier = hasActiveSub ? sub.plan_type : 'FREE';
    const isPaid = planTier !== 'FREE' && hasActiveSub;

    // Check user payment records
    const userPayments = mockDb.payments.filter(p => p.user_id === u.id || p.user_email?.toLowerCase() === u.email.toLowerCase());
    const userOrders = mockDb.orders.filter(o => o.user_id === u.id || o.user_email?.toLowerCase() === u.email.toLowerCase());

    return {
      ...u,
      plan_tier: planTier,
      is_paid: isPaid,
      subscription_status: sub ? sub.status : 'free',
      subscription_end: sub ? sub.current_period_end : null,
      payments_count: userPayments.length,
      orders_count: userOrders.length,
      last_order_date: userOrders[0]?.created_at || null,
    };
  });

  return NextResponse.json({ success: true, users: enrichedUsers, total: enrichedUsers.length });
}

export async function PUT(request: NextRequest) {
  return handleUpdateUser(request);
}

export async function POST(request: NextRequest) {
  return handleUpdateUser(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpdateUser(request);
}

async function handleUpdateUser(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    mockDb.loadFromDisk();
    const body = await request.json();
    const userId = body.userId || body.id;
    const updates = body.updates || {};

    const role = body.role || updates.role;
    const isSuspended = body.isSuspended !== undefined ? body.isSuspended : updates.is_suspended !== undefined ? updates.is_suspended : updates.isSuspended;
    const suspensionReason = body.suspensionReason || updates.suspension_reason || updates.suspensionReason;
    const planTier = body.plan_tier || body.planTier || updates.plan_tier || updates.planTier;

    const profile = mockDb.profiles.find((p) => p.id === userId);
    if (!profile) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    if (planTier) {
      const validTiers = Object.keys(ACADEMIC_PLANS);
      if (!validTiers.includes(planTier)) {
        return NextResponse.json(
          { success: false, error: `Invalid plan tier: "${planTier}". Valid tiers are: ${validTiers.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (role) profile.role = role;
    if (isSuspended !== undefined) {
      profile.is_suspended = Boolean(isSuspended);
      profile.suspension_reason = suspensionReason || null;
    }
    profile.updated_at = new Date().toISOString();

    // Update or create subscription for this plan tier
    if (planTier) {
      await saveUserSubscription({
        user_id: userId,
        plan_type: planTier as PlanTier,
        status: 'active',
        current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      });
    }

    if (role || isSuspended !== undefined) {
      await saveUserProfile({
        id: userId,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        is_suspended: profile.is_suspended,
        suspension_reason: profile.suspension_reason,
      });
    }

    mockDb.persist();

    await logAuditEvent({
      action: isSuspended ? 'USER_SUSPENDED' : planTier ? 'USER_PLAN_CHANGED' : role ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
      resourceType: 'USER',
      resourceId: userId,
      metadata: { newRole: role, suspended: isSuspended, newPlan: planTier },
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
    });

    return NextResponse.json({ success: true, user: profile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update user.' }, { status: 500 });
  }
}
