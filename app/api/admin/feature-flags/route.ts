import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { logAuditEvent } from '@/lib/security/audit';
import { assertAdmin } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  mockDb.loadFromDisk();
  return NextResponse.json({ success: true, flags: mockDb.featureFlags });
}

export async function PUT(request: NextRequest) {
  return handleUpdateFlag(request);
}

export async function POST(request: NextRequest) {
  return handleUpdateFlag(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpdateFlag(request);
}

async function handleUpdateFlag(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    mockDb.loadFromDisk();
    const body = await request.json();
    const flagKey = body.flagKey || body.key;
    const isEnabled = body.isEnabled !== undefined ? body.isEnabled : body.enabled;

    if (!flagKey) {
      return NextResponse.json({ success: false, error: 'flagKey or key is required.' }, { status: 400 });
    }

    const flag = mockDb.featureFlags.find((f) => f.flag_key === flagKey);
    if (!flag) {
      return NextResponse.json({ success: false, error: 'Feature flag not found.' }, { status: 404 });
    }

    flag.is_enabled = Boolean(isEnabled);
    flag.updated_at = new Date().toISOString();

    mockDb.persist();

    await logAuditEvent({
      action: 'FEATURE_FLAG_TOGGLED',
      resourceType: 'FEATURE_FLAG',
      resourceId: flagKey,
      metadata: { isEnabled: flag.is_enabled },
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
    });

    return NextResponse.json({ success: true, flag, flags: mockDb.featureFlags });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to update feature flag.' }, { status: 500 });
  }
}
