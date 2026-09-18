import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { mockDb } from '@/lib/supabase/mock-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userEmail, resourceType, resourceId, metadata } = body;
    const ip = request.headers.get('x-forwarded-for') || 'internal';

    await logAuditEvent({
      userEmail: userEmail || 'system',
      action: action || 'ADMIN_ACTION',
      resourceType: resourceType || 'SYSTEM',
      resourceId,
      metadata,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
    return NextResponse.json({ error: 'Failed to log audit event.' }, { status: 500 });
  }
}

export async function GET() {
  mockDb.loadFromDisk();
  return NextResponse.json({ logs: mockDb.auditLogs.slice(0, 100) });
}
