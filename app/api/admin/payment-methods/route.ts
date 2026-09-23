import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getPaymentMethods,
  savePaymentMethod,
  deletePaymentMethod,
} from '@/lib/services/payment-service';
import { logAuditEvent } from '@/lib/security/audit';
import { assertAdmin } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';

const CreatePaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.any().optional().default('other'),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  account_name: z.string().min(1, 'Account Name is required'),
  account_number: z.string().min(1, 'Account Number is required'),
  instructions: z.string().optional().default(''),
  enabled: z.boolean().optional().default(true),
  sort_order: z.number().optional(),
});

const UpdatePaymentMethodSchema = z.object({
  id: z.string().min(1, 'Payment method ID is required'),
  name: z.string().optional(),
  type: z.any().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  account_name: z.string().optional(),
  account_number: z.string().optional(),
  instructions: z.string().optional(),
  enabled: z.boolean().optional(),
  sort_order: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const methods = await getPaymentMethods();
    return apiSuccess({ methods }, { total: methods.length });
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch payment methods', 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const parsed = CreatePaymentMethodSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid payment method data', 400);
    }

    const created = await savePaymentMethod(parsed.data);

    await logAuditEvent({
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
      action: 'PAYMENT_METHOD_CREATED',
      resourceType: 'PAYMENT_METHOD',
      resourceId: created.id,
      metadata: { name: created.name, country: created.country, account_name: created.account_name },
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return apiSuccess({ method: created, message: 'Payment method created successfully.' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to create payment method', 500);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const parsed = UpdatePaymentMethodSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid payment method update', 400);
    }

    const updated = await savePaymentMethod(parsed.data);

    await logAuditEvent({
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
      action: 'PAYMENT_METHOD_UPDATED',
      resourceType: 'PAYMENT_METHOD',
      resourceId: updated.id,
      metadata: { name: updated.name },
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return apiSuccess({ method: updated, message: 'Payment method updated successfully.' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update payment method', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError('Payment method id is required.', 400);
    }

    const removed = await deletePaymentMethod(id);
    if (!removed) {
      return apiError('Payment method not found.', 404);
    }

    await logAuditEvent({
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
      action: 'PAYMENT_METHOD_DELETED',
      resourceType: 'PAYMENT_METHOD',
      resourceId: id,
      metadata: { deleted_id: id },
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return apiSuccess({ message: 'Payment method deleted successfully.' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete payment method', 500);
  }
}
