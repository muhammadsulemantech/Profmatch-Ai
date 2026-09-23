import { Order, Payment, PaymentMethod, PlanTier } from '@/types/database';
import { mockDb } from '@/lib/supabase/mock-db';

export interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  userName?: string;
  planTier: PlanTier;
  planName: string;
  amount: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  paymentMethodId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface SubmitManualPaymentParams {
  orderReference: string;
  userId: string;
  userEmail: string;
  userName?: string;
  planTier: PlanTier;
  planName: string;
  paymentMethodId: string;
  paymentMethodName: string;
  amount: number;
  currency: string;
  transactionId: string;
  paymentNote?: string;
  proofFileName?: string;
  proofFileUrl?: string;
}

export interface PaymentProvider {
  name: string;
  type: string;
  createCheckout(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl?: string; orderReference: string }>;
  processPayment?(paymentId: string): Promise<{ success: boolean; message: string }>;
}

export class ManualPaymentProvider implements PaymentProvider {
  name = 'Manual Academic Verification Provider';
  type = 'manual';

  async createCheckout(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl?: string; orderReference: string }> {
    const order = mockDb.createOrder({
      user_id: params.userId,
      user_email: params.userEmail,
      user_name: params.userName,
      plan_tier: params.planTier,
      plan_name: params.planName,
      amount: params.amount,
      currency: params.currency,
      billing_interval: params.billingInterval,
      payment_method_id: params.paymentMethodId,
      status: 'PENDING',
    });

    return {
      orderReference: order.order_reference,
      checkoutUrl: `/checkout/status/${order.order_reference}`,
    };
  }

  async submitProof(params: SubmitManualPaymentParams): Promise<{ payment: Payment; orderReference: string }> {
    let order = mockDb.orders.find((o: Order) => o.order_reference === params.orderReference);
    if (!order) {
      order = mockDb.createOrder({
        order_reference: params.orderReference,
        user_id: params.userId,
        user_email: params.userEmail,
        user_name: params.userName,
        plan_tier: params.planTier,
        plan_name: params.planName,
        amount: params.amount,
        currency: params.currency,
        billing_interval: 'monthly',
        payment_method_id: params.paymentMethodId,
        payment_method_name: params.paymentMethodName,
        status: 'PENDING',
      });
    }
    const payment = mockDb.createPayment({
      order_id: order.id,
      order_reference: params.orderReference,
      user_id: params.userId,
      user_email: params.userEmail,
      user_name: params.userName,
      plan_tier: params.planTier,
      plan_name: params.planName,
      payment_method_id: params.paymentMethodId,
      payment_method_name: params.paymentMethodName,
      amount: params.amount,
      currency: params.currency,
      transaction_id: params.transactionId,
      proof_file_name: params.proofFileName,
      proof_file_url: params.proofFileUrl,
      payment_note: params.paymentNote,
      status: 'PENDING',
    });

    return {
      payment,
      orderReference: params.orderReference,
    };
  }
}

export class StripePaymentProvider implements PaymentProvider {
  name = 'Stripe Academic Checkout';
  type = 'stripe';

  async createCheckout(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl: string; orderReference: string }> {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey.trim() === '' || stripeSecretKey.includes('placeholder')) {
      throw new Error('Stripe gateway is not configured on this server. Please choose an active manual payment method or bank transfer.');
    }
    throw new Error('Stripe automated checkout is currently unavailable. Please choose manual academic verification.');
  }
}

export class PayPalPaymentProvider implements PaymentProvider {
  name = 'PayPal Academic Checkout';
  type = 'paypal';

  async createCheckout(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl: string; orderReference: string }> {
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    if (!paypalClientId || paypalClientId.trim() === '') {
      throw new Error('PayPal gateway is not configured on this server. Please choose an active manual payment method or bank transfer.');
    }
    throw new Error('PayPal automated checkout is currently unavailable. Please choose manual academic verification.');
  }
}

export function getPaymentProvider(methodType: string = 'manual'): PaymentProvider {
  switch (methodType.toLowerCase()) {
    case 'stripe':
    case 'card':
      return new StripePaymentProvider();
    case 'paypal':
      return new PayPalPaymentProvider();
    case 'mobile_wallet':
    case 'bank_transfer':
    default:
      return new ManualPaymentProvider();
  }
}

