import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { updateSiteSettings } from '@/lib/cms/settings-service';
import { logAuditEvent } from '@/lib/security/audit';

export async function GET() {
  return NextResponse.json({ settings: mockDb.siteSettings });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await updateSiteSettings(body);

    await logAuditEvent({
      action: 'SITE_SETTINGS_UPDATED',
      resourceType: 'SITE_SETTINGS',
      metadata: { fields: Object.keys(body) },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
