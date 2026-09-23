import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getFeatureFlags, updateFeatureFlag } from '@/lib/services/admin-service';
import { assertAdmin } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const flags = await getFeatureFlags();
    return apiSuccess({ flags }, { total: flags.length });
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch feature flags', 500);
  }
}

const UpdateFlagSchema = z.object({
  flagKey: z.string().optional(),
  key: z.string().optional(),
  isEnabled: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const parsed = UpdateFlagSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid flag update payload', 400);
    }

    const flagKey = parsed.data.flagKey || parsed.data.key;
    const isEnabled = parsed.data.isEnabled !== undefined ? parsed.data.isEnabled : parsed.data.enabled;

    if (!flagKey || isEnabled === undefined) {
      return apiError('flagKey and isEnabled are required.', 400);
    }

    const updated = await updateFeatureFlag(flagKey, isEnabled, {
      id: auth.session.user.id,
      email: auth.session.user.email,
    });

    const allFlags = await getFeatureFlags();

    return apiSuccess({
      flag: updated,
      flags: allFlags,
      message: 'Feature flag updated successfully.',
    });
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : 500;
    return apiError(error.message || 'Failed to update feature flag', status);
  }
}
