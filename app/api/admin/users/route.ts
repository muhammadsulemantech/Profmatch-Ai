import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getEnrichedUsers, updateUser } from '@/lib/services/user-service';
import { ACADEMIC_PLANS } from '@/lib/services/usage-service';
import { logAuditEvent } from '@/lib/security/audit';
import { assertAdmin } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const planTier = searchParams.get('planTier') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await getEnrichedUsers({
      search,
      role,
      planTier,
      page,
      pageSize,
    });

    return apiSuccess(
      {
        users: result.users,
      },
      {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages,
      }
    );
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch users', 500);
  }
}

const UpdateUserSchema = z.object({
  userId: z.string().optional(),
  id: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT']).optional(),
  isSuspended: z.boolean().optional(),
  is_suspended: z.boolean().optional(),
  suspensionReason: z.string().nullable().optional(),
  suspension_reason: z.string().nullable().optional(),
  planTier: z.string().optional(),
  plan_tier: z.string().optional(),
  updates: z
    .object({
      role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT']).optional(),
      isSuspended: z.boolean().optional(),
      is_suspended: z.boolean().optional(),
      suspensionReason: z.string().nullable().optional(),
      suspension_reason: z.string().nullable().optional(),
      planTier: z.string().optional(),
      plan_tier: z.string().optional(),
    })
    .optional(),
});

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid user update payload', 400);
    }

    const data = parsed.data;
    const targetUserId = data.userId || data.id;
    if (!targetUserId) {
      return apiError('User ID is required.', 400);
    }

    const updates = data.updates || {};
    const role = data.role || updates.role;
    const isSuspended =
      data.isSuspended !== undefined
        ? data.isSuspended
        : data.is_suspended !== undefined
        ? data.is_suspended
        : updates.isSuspended !== undefined
        ? updates.isSuspended
        : updates.is_suspended;

    const suspensionReason =
      data.suspensionReason !== undefined
        ? data.suspensionReason
        : data.suspension_reason !== undefined
        ? data.suspension_reason
        : updates.suspensionReason !== undefined
        ? updates.suspensionReason
        : updates.suspension_reason;

    const planTier = (data.planTier || data.plan_tier || updates.planTier || updates.plan_tier) as any;

    const updatedProfile = await updateUser({
      userId: targetUserId,
      role,
      isSuspended,
      suspensionReason,
      planTier,
    });

    await logAuditEvent({
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
      action: 'ADMIN_USER_UPDATED',
      resourceType: 'USER',
      resourceId: targetUserId,
      metadata: { role, isSuspended, planTier },
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return apiSuccess({
      message: 'User updated successfully.',
      user: updatedProfile,
    });
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : error.message?.includes('Invalid plan') ? 400 : 500;
    return apiError(error.message || 'Failed to update user', status);
  }
}
