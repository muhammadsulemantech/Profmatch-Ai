import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSiteSettings, updateSiteSettings } from '@/lib/cms/settings-service';
import { logAuditEvent } from '@/lib/security/audit';
import { assertAdmin } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const settings = await getSiteSettings();
    return apiSuccess({ settings });
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch settings', 500);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return apiError('Settings payload must be an object', 400);
    }

    const updated = await updateSiteSettings(body);

    await logAuditEvent({
      action: 'SITE_SETTINGS_UPDATED',
      resourceType: 'SITE_SETTINGS',
      metadata: { fields: Object.keys(body || {}) },
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
    });

    return apiSuccess({ settings: updated, message: 'Settings updated successfully.' });
  } catch (err: any) {
    return apiError(err.message || 'Failed to update settings.', 500);
  }
}
