import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { logAuditEvent } from '@/lib/security/audit';

export async function GET() {
  mockDb.loadFromDisk();
  return NextResponse.json({ users: mockDb.profiles });
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
  try {
    mockDb.loadFromDisk();
    const body = await request.json();
    const userId = body.userId || body.id;
    const updates = body.updates || {};

    const role = body.role || updates.role;
    const isSuspended = body.isSuspended !== undefined ? body.isSuspended : updates.is_suspended !== undefined ? updates.is_suspended : updates.isSuspended;
    const suspensionReason = body.suspensionReason || updates.suspension_reason || updates.suspensionReason;

    const profile = mockDb.profiles.find((p) => p.id === userId);
    if (!profile) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (role) profile.role = role;
    if (isSuspended !== undefined) {
      profile.is_suspended = Boolean(isSuspended);
      profile.suspension_reason = suspensionReason || null;
    }
    profile.updated_at = new Date().toISOString();

    mockDb.persist();

    await logAuditEvent({
      action: isSuspended ? 'USER_SUSPENDED' : role ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
      resourceType: 'USER',
      resourceId: userId,
      metadata: { newRole: role, suspended: isSuspended },
    });

    return NextResponse.json({ success: true, user: profile, users: mockDb.profiles });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}
