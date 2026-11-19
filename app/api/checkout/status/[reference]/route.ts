import { NextRequest } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(
  _request: NextRequest,
  context: { params: { reference: string } }
) {
  const reference = context.params?.reference?.trim();
  if (!reference) {
    return apiError('Order reference is required', 400);
  }

  mockDb.loadFromDisk();

  const ord = mockDb.orders.find((o) => o.order_reference === reference) || null;
  const pay = mockDb.payments.find((p) => p.order_reference === reference) || null;

  return apiSuccess({
    order: ord
      ? {
          id: ord.id,
          order_reference: ord.order_reference,
          plan_tier: ord.plan_tier,
          plan_name: ord.plan_name,
          amount: ord.amount,
          currency: ord.currency,
          billing_interval: ord.billing_interval,
          payment_method_name: ord.payment_method_name,
          status: ord.status,
          created_at: ord.created_at,
        }
      : null,
    payment: pay
      ? {
          id: pay.id,
          order_reference: pay.order_reference,
          transaction_id: pay.transaction_id,
          amount: pay.amount,
          currency: pay.currency,
          payment_method_name: pay.payment_method_name,
          status: pay.status,
          admin_review_note: pay.admin_review_note,
          reviewed_at: pay.reviewed_at,
          created_at: pay.created_at,
        }
      : null,
  });
}
