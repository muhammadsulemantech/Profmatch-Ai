import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { ManualPaymentProvider } from '@/lib/providers/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      planTier = 'STUDENT',
      planName = 'Graduate Applicant Pro',
      amount,
      currency = 'USD',
      billingInterval = 'monthly',
      paymentMethodId,
      transactionId,
      paymentNote,
      proofFileName,
      proofFileUrl,
      userEmail = 'student@example.com',
      userName = 'Alex Vance',
      userId = 'usr_student_001',
    } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      );
    }

    if (!transactionId || transactionId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Transaction ID or Reference Number is required' },
        { status: 400 }
      );
    }

    const method = mockDb.getPaymentMethodById(paymentMethodId);
    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Selected payment method does not exist or is unavailable' },
        { status: 404 }
      );
    }

    // Generate unique order reference
    const orderReference = `PM-${Math.floor(100000 + Math.random() * 900000)}`;

    const provider = new ManualPaymentProvider();
    const result = await provider.submitProof({
      orderReference,
      userId,
      userEmail,
      userName,
      planTier,
      planName,
      paymentMethodId: method.id,
      paymentMethodName: method.name,
      amount: amount || (currency === 'PKR' ? 5200 : 19),
      currency: currency || method.currency,
      transactionId: transactionId.trim(),
      paymentNote,
      proofFileName,
      proofFileUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully. Your plan will activate upon administrative verification.',
      orderReference,
      status: 'PENDING',
      paymentId: result.payment.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Payment submission failed' },
      { status: 500 }
    );
  }
}
