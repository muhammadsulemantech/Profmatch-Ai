import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuditLogs } from '@/lib/services/admin-service';
import { logAuditEvent } from '@/lib/security/audit';
import { assertAdmin } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const result = await getAuditLogs(page, pageSize);

    return apiSuccess(
      { logs: result.logs },
      {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages,
      }
    );
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch audit logs', 500);
  }
}

const CreateAuditLogSchema = z.object({
  action: z.string().optional().default('ADMIN_ACTION'),
  resourceType: z.string().optional().default('SYSTEM'),
  resourceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const parsed = CreateAuditLogSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid audit log payload', 400);
    }

    const { action, resourceType, resourceId, metadata } = parsed.data;
    const ip = request.headers.get('x-forwarded-for') || 'internal';

    await logAuditEvent({
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
      action,
      resourceType,
      resourceId,
      metadata,
      ipAddress: ip,
    });

    return apiSuccess({ message: 'Audit event recorded successfully.' });
  } catch (err: any) {
    return apiError(err.message || 'Failed to log audit event.', 500);
  }
}
