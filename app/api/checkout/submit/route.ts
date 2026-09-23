import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { mockDb } from '@/lib/supabase/mock-db';
import { ManualPaymentProvider } from '@/lib/providers/payment';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { ACADEMIC_PLANS } from '@/lib/services/usage-service';
import { PlanTier } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // 1. Require verified authenticated user session
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be logged in to submit a payment.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.full_name || 'Academic Applicant';

    const body = await request.json();
    const {
      planTier = 'STUDENT',
      paymentMethodId,
      transactionId,
      paymentNote,
      proofFileName,
      proofFileUrl,
    } = body;

    // 2. Validate plan tier from server catalog
    const normalizedTier = (planTier === 'STUDENT' ? 'STARTER' : planTier).toUpperCase();
    const planConfig = ACADEMIC_PLANS[normalizedTier];
    if (!planConfig) {
      return NextResponse.json(
        { success: false, error: `Invalid plan tier: ${planTier}` },
        { status: 400 }
      );
    }

    // 3. Validate payment method
    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      );
    }

    mockDb.loadFromDisk();
    const method = mockDb.getPaymentMethodById(paymentMethodId);
    if (!method || !method.is_active) {
      return NextResponse.json(
        { success: false, error: 'Selected payment method does not exist or is unavailable' },
        { status: 404 }
      );
    }

    // 4. Validate transaction ID and enforce idempotency
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'A valid Transaction ID or Reference Number is required' },
        { status: 400 }
      );
    }

    const trimmedTx = transactionId.trim();
    if (mockDb.isTransactionIdUsed(trimmedTx)) {
      return NextResponse.json(
        { success: false, error: 'This transaction ID has already been submitted. Please check your order status.' },
        { status: 409 }
      );
    }

    // 5. Derive price and currency strictly from server catalog and payment method
    const currency = method.currency || (method.country === 'Pakistan' ? 'PKR' : 'USD');
    const amount = currency === 'PKR' ? planConfig.pricePkr : planConfig.priceUsd;

    // 6. Generate collision-safe order reference
    const orderReference = `PM-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Ensure paying user profile is recorded
    mockDb.autoSaveUser({
      id: userId,
      email: userEmail,
      full_name: userName,
    });

    const provider = new ManualPaymentProvider();
    const result = await provider.submitProof({
      orderReference,
      userId,
      userEmail,
      userName,
      planTier: planConfig.tier as PlanTier,
      planName: planConfig.name,
      paymentMethodId: method.id,
      paymentMethodName: method.name,
      amount,
      currency,
      transactionId: trimmedTx,
      paymentNote: paymentNote ? String(paymentNote).trim() : undefined,
      proofFileName: proofFileName || undefined,
      proofFileUrl: proofFileUrl || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully. Your plan will activate upon administrative verification.',
      orderReference,
      status: 'PENDING',
      paymentId: result.payment.id,
      amount,
      currency,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Payment submission failed' },
      { status: 500 }
    );
  }
}
