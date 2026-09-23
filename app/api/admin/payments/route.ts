import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAdminPayments, reviewPaymentStatus } from '@/lib/services/payment-service';
import { PaymentStatus } from '@/types/database';
import { assertAdmin } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as PaymentStatus | 'ALL') || undefined;
    const query = searchParams.get('q') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await getAdminPayments({
      status,
      query,
      page,
      pageSize,
    });

    return apiSuccess(
      {
        payments: result.payments,
        orders: result.orders,
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
    return apiError(error.message || 'Failed to fetch payments', 500);
  }
}

const ReviewPaymentSchema = z.object({
  paymentId: z.string().min(1, 'paymentId is required'),
  action: z.enum(['APPROVE', 'REJECT'], { errorMap: () => ({ message: 'Action must be APPROVE or REJECT' }) }),
  adminNote: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const parsed = ReviewPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid review payload', 400);
    }

    const { paymentId, action, adminNote } = parsed.data;
    const targetStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const result = await reviewPaymentStatus(paymentId, targetStatus, adminNote);

    return apiSuccess({
      message:
        action === 'APPROVE'
          ? 'Payment approved and student subscription activated successfully.'
          : 'Payment rejected. Status updated.',
      payment: result.payment,
      order: result.order,
      subscription: result.subscription,
    });
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : 500;
    return apiError(error.message || 'Failed to update payment status', status);
  }
}
