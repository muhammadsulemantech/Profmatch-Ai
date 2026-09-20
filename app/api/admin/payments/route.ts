import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { PaymentStatus } from '@/types/database';
import { verifyAdminSession } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    mockDb.loadFromDisk();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PaymentStatus | null;
    const query = searchParams.get('q')?.toLowerCase();

    let payments = [...mockDb.payments];

    if (status && status !== ('ALL' as any)) {
      payments = payments.filter(p => p.status === status);
    }

    if (query && query.trim() !== '') {
      payments = payments.filter(
        p =>
          p.order_reference.toLowerCase().includes(query) ||
          p.transaction_id.toLowerCase().includes(query) ||
          (p.user_email && p.user_email.toLowerCase().includes(query)) ||
          (p.user_name && p.user_name.toLowerCase().includes(query)) ||
          p.payment_method_name.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      total: payments.length,
      payments,
      orders: mockDb.orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdminSession(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrative access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, action, adminNote } = body;

    if (!paymentId || !action) {
      return NextResponse.json(
        { success: false, error: 'paymentId and action are required' },
        { status: 400 }
      );
    }

    let targetStatus: PaymentStatus = 'PENDING';
    if (action === 'APPROVE') {
      targetStatus = 'APPROVED';
    } else if (action === 'REJECT') {
      targetStatus = 'REJECTED';
    } else {
      return NextResponse.json(
        { success: false, error: 'Action must be APPROVE or REJECT' },
        { status: 400 }
      );
    }

    const result = mockDb.updatePaymentStatus(paymentId, targetStatus, adminNote);

    if (!result.payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        targetStatus === 'APPROVED'
          ? 'Payment approved and student subscription activated successfully.'
          : 'Payment rejected. Status updated.',
      payment: result.payment,
      order: result.order,
      subscription: result.subscription,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
