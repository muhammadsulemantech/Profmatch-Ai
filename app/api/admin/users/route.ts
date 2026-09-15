import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { logAuditEvent } from '@/lib/security/audit';

export async function GET() {
  return NextResponse.json({ users: mockDb.profiles });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, isSuspended, suspensionReason } = body;

    const profile = mockDb.profiles.find((p) => p.id === userId);
    if (!profile) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (role) profile.role = role;
    if (isSuspended !== undefined) {
      profile.is_suspended = isSuspended;
      profile.suspension_reason = suspensionReason || null;
    }

    await logAuditEvent({
      action: isSuspended ? 'USER_SUSPENDED' : role ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
      resourceType: 'USER',
      resourceId: userId,
      metadata: { newRole: role, suspended: isSuspended },
    });

    return NextResponse.json({ success: true, user: profile });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}
