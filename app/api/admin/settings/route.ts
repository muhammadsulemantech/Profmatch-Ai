import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { getSiteSettings, updateSiteSettings } from '@/lib/cms/settings-service';
import { logAuditEvent } from '@/lib/security/audit';

export async function GET() {
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
  try {
    const body = await request.json();
    const updated = await updateSiteSettings(body);

    try {
      await logAuditEvent({
        action: 'SITE_SETTINGS_UPDATED',
        resourceType: 'SITE_SETTINGS',
        metadata: { fields: Object.keys(body || {}) },
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
