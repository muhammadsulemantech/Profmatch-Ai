import { NextRequest } from 'next/server';
import { z } from 'zod';
import { submitPaymentProof, getPaymentMethodById } from '@/lib/services/payment-service';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import {
  sendPaymentAdminAlertEmail,
  sendPaymentCustomerReceiptEmail,
} from '@/lib/email/payment-admin-alert';

const SubmitCheckoutSchema = z.object({
  planTier: z.string().default('STUDENT'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  transactionId: z.string().trim().min(3, 'A valid Transaction ID or Reference Number is required'),
  paymentNote: z.string().optional(),
  proofFileName: z.string().optional(),
  proofFileUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Require verified authenticated user session
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return apiError('Unauthorized: You must be logged in to submit a payment.', 401);
    }

    const body = await request.json();
    const parsed = SubmitCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid checkout payload', 400);
    }

    const {
      planTier,
      paymentMethodId,
      transactionId,
      paymentNote,
      proofFileName,
      proofFileUrl,
    } = parsed.data;

    const result = await submitPaymentProof({
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.full_name || 'Academic Applicant',
      planTier,
      paymentMethodId,
      transactionId,
      paymentNote,
      proofFileName,
      proofFileUrl,
    });

    // 2. Dispatch instant asynchronous notification emails (Admin alert & Customer receipt)
    (async () => {
      try {
        const method = await getPaymentMethodById(paymentMethodId);
        const emailParams = {
          orderReference: result.orderReference,
          userName: session.user.full_name || 'Academic Applicant',
          userEmail: session.user.email,
          planName: result.planName,
          planTier,
          amount: result.amount,
          currency: result.currency,
          paymentMethodName: method?.name || 'Direct Transfer / Digital Wallet',
          transactionId: transactionId.trim(),
          paymentNote: paymentNote?.trim(),
          proofFileName,
          proofFileUrl,
        };

        // 1. Alert administrator
        await sendPaymentAdminAlertEmail(emailParams);

        // 2. Send receipt confirmation to student
        await sendPaymentCustomerReceiptEmail(emailParams);
      } catch (emailErr) {
        console.error('[PAYMENT EMAIL DISPATCH ERROR]', emailErr);
      }
    })();

    return apiSuccess({
      message: 'Payment proof submitted successfully. Your plan will activate upon administrative verification.',
      orderReference: result.orderReference,
      status: result.status,
      paymentId: result.paymentId,
      amount: result.amount,
      currency: result.currency,
      planName: result.planName,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return apiError(error.message || 'Payment submission failed', status);
  }
}
