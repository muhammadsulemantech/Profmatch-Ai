import { NextRequest, NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/cms/settings-service';
import { logAuditEvent } from '@/lib/security/audit';
import { assertAdmin } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  const settings = await getSiteSettings();
  return NextResponse.json({ success: true, settings });
}

export async function PUT(request: NextRequest) {
  return handleUpdateSettings(request);
}

export async function POST(request: NextRequest) {
  return handleUpdateSettings(request);
}

async function handleUpdateSettings(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const updated = await updateSiteSettings(body);

    try {
      await logAuditEvent({
        action: 'SITE_SETTINGS_UPDATED',
        resourceType: 'SITE_SETTINGS',
        metadata: { fields: Object.keys(body || {}) },
        userId: auth.session.user.id,
        userEmail: auth.session.user.email,
      });
    } catch {
      // safe audit catch
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('[SETTINGS API ERROR]', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update settings.' }, { status: 500 });
  }
}
