import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { mockDb } from '@/lib/supabase/mock-db';
import { assertAdmin } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  mockDb.loadFromDisk();
  return NextResponse.json({ success: true, logs: mockDb.auditLogs.slice(0, 100) });
}

export async function POST(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const { action, resourceType, resourceId, metadata } = body;
    const ip = request.headers.get('x-forwarded-for') || 'internal';

    await logAuditEvent({
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
      action: action || 'ADMIN_ACTION',
      resourceType: resourceType || 'SYSTEM',
      resourceId,
      metadata,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
    return NextResponse.json({ success: false, error: 'Failed to log audit event.' }, { status: 500 });
  }
}
