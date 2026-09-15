import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { logAuditEvent } from '@/lib/security/audit';

export async function GET() {
  return NextResponse.json({ flags: mockDb.featureFlags });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { flagKey, isEnabled } = body;

    const flag = mockDb.featureFlags.find((f) => f.flag_key === flagKey);
    if (!flag) {
      return NextResponse.json({ error: 'Feature flag not found.' }, { status: 404 });
    }

    flag.is_enabled = isEnabled;
    flag.updated_at = new Date().toISOString();

    await logAuditEvent({
      action: 'FEATURE_FLAG_TOGGLED',
      resourceType: 'FEATURE_FLAG',
      resourceId: flagKey,
      metadata: { isEnabled },
    });

    return NextResponse.json({ success: true, flag });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update feature flag.' }, { status: 500 });
  }
}
