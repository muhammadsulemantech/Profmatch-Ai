import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { assertAdmin } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    mockDb.loadFromDisk();
    return NextResponse.json({
      success: true,
      total: mockDb.paymentMethods.length,
      methods: mockDb.paymentMethods,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const { name, type, country, currency, account_name, account_number, instructions, enabled, sort_order } = body;

    if (!name || !country || !currency || !account_name || !account_number) {
      return NextResponse.json(
        { success: false, error: 'Name, Country, Currency, Account Name, and Account Number are required.' },
        { status: 400 }
      );
    }

    const created = mockDb.savePaymentMethod({
      name,
      type: type || 'other',
      country,
      currency,
      account_name,
      account_number,
      instructions: instructions || '',
      enabled: enabled !== undefined ? enabled : true,
      sort_order: sort_order || mockDb.paymentMethods.length + 1,
    });

    // Log admin audit
    mockDb.auditLogs.unshift({
      id: `log_${Date.now()}_pm`,
      user_id: auth.session.user.id,
      user_email: auth.session.user.email,
      action: 'PAYMENT_METHOD_CREATED',
      resource_type: 'PAYMENT_METHOD',
      resource_id: created.id,
      metadata: { name: created.name, country: created.country, account_name: created.account_name },
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      created_at: new Date().toISOString(),
    });
    mockDb.persist();

    return NextResponse.json({
      success: true,
      message: 'Payment method created successfully.',
      method: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment method' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment method id is required.' },
        { status: 400 }
      );
    }

    const updated = mockDb.savePaymentMethod({ id, ...updates });

    // Log admin audit
    mockDb.auditLogs.unshift({
      id: `log_${Date.now()}_pm_upd`,
      user_id: auth.session.user.id,
      user_email: auth.session.user.email,
      action: 'PAYMENT_METHOD_UPDATED',
      resource_type: 'PAYMENT_METHOD',
      resource_id: updated.id,
      metadata: updates,
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      created_at: new Date().toISOString(),
    });
    mockDb.persist();

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully.',
      method: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment method id is required.' },
        { status: 400 }
      );
    }

    const removed = mockDb.deletePaymentMethod(id);
    if (!removed) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found.' },
        { status: 404 }
      );
    }

    mockDb.auditLogs.unshift({
      id: `log_${Date.now()}_pm_del`,
      user_id: auth.session.user.id,
      user_email: auth.session.user.email,
      action: 'PAYMENT_METHOD_DELETED',
      resource_type: 'PAYMENT_METHOD',
      resource_id: id,
      metadata: { deleted_id: id },
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      created_at: new Date().toISOString(),
    });
    mockDb.persist();

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
