import crypto from 'crypto';
import { mockDb } from '@/lib/supabase/mock-db';
import { ManualPaymentProvider } from '@/lib/providers/payment';
import { ACADEMIC_PLANS } from '@/lib/services/usage-service';
import type { PaymentMethod, Payment, Order, PaymentStatus, PlanTier } from '@/types/database';

export interface SubmitPaymentParams {
  userId: string;
  userEmail: string;
  userName: string;
  planTier: string;
  paymentMethodId: string;
  transactionId: string;
  paymentNote?: string;
  proofFileName?: string;
  proofFileUrl?: string;
}

export interface PaymentSubmissionResult {
  orderReference: string;
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  planName: string;
}

/**
 * Gets payment methods, optionally filtered by country.
 */
export async function getPaymentMethods(country?: string): Promise<PaymentMethod[]> {
  mockDb.loadFromDisk();
  if (country) {
    return mockDb.getPaymentMethods(country);
  }
  return mockDb.paymentMethods;
}

export async function getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
  mockDb.loadFromDisk();
  return mockDb.getPaymentMethodById(id) || null;
}

export async function savePaymentMethod(data: Partial<PaymentMethod>): Promise<PaymentMethod> {
  mockDb.loadFromDisk();
  const saved = mockDb.savePaymentMethod(data);
  return saved;
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  mockDb.loadFromDisk();
  return mockDb.deletePaymentMethod(id);
}

/**
 * Validates plan, payment method, idempotency, and records the manual payment submission.
 */
export async function submitPaymentProof(
  params: SubmitPaymentParams
): Promise<PaymentSubmissionResult> {
  const {
    userId,
    userEmail,
    userName,
    planTier,
    paymentMethodId,
    transactionId,
    paymentNote,
    proofFileName,
    proofFileUrl,
  } = params;

  // 1. Validate plan tier from server catalog
  const normalizedTier = (planTier === 'STUDENT' ? 'STARTER' : planTier).toUpperCase();
  const planConfig = ACADEMIC_PLANS[normalizedTier];
  if (!planConfig) {
    throw new Error(`Invalid plan tier: "${planTier}"`);
  }

  // 2. Validate payment method
  mockDb.loadFromDisk();
  const method = mockDb.getPaymentMethodById(paymentMethodId);
  if (!method || !method.enabled) {
    throw new Error('Selected payment method does not exist or is currently unavailable');
  }

  // 3. Enforce transaction ID idempotency
  const trimmedTx = transactionId.trim();
  if (!trimmedTx || trimmedTx.length < 3) {
    throw new Error('A valid Transaction ID or Reference Number is required');
  }
  if (mockDb.isTransactionIdUsed(trimmedTx)) {
    const error: any = new Error('This transaction ID has already been submitted. Please check your order status.');
    error.statusCode = 409;
    throw error;
  }

  // 4. Server-computed pricing & safe order reference
  const currency = method.currency || (method.country === 'Pakistan' ? 'PKR' : 'USD');
  const amount = currency === 'PKR' ? planConfig.pricePkr : planConfig.priceUsd;
  const orderReference = `PM-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

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
    paymentNote: paymentNote ? paymentNote.trim() : undefined,
    proofFileName: proofFileName || undefined,
    proofFileUrl: proofFileUrl || undefined,
  });

  return {
    orderReference,
    paymentId: result.payment.id,
    status: 'PENDING',
    amount,
    currency,
    planName: planConfig.name,
  };
}

export interface GetPaymentsFilter {
  status?: PaymentStatus | 'ALL';
  query?: string;
  page?: number;
  pageSize?: number;
}

export async function getAdminPayments(filter: GetPaymentsFilter = {}): Promise<{
  payments: Payment[];
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { status, query, page = 1, pageSize = 20 } = filter;
  mockDb.loadFromDisk();

  let payments = [...mockDb.payments];

  if (status && status !== 'ALL') {
    payments = payments.filter((p) => p.status === status);
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    payments = payments.filter(
      (p) =>
        p.order_reference.toLowerCase().includes(q) ||
        p.transaction_id.toLowerCase().includes(q) ||
        (p.user_email && p.user_email.toLowerCase().includes(q)) ||
        (p.user_name && p.user_name.toLowerCase().includes(q)) ||
        p.payment_method_name.toLowerCase().includes(q)
    );
  }

  const total = payments.length;
  const validPage = Math.max(1, page);
  const validSize = Math.max(1, Math.min(100, pageSize));
  const totalPages = Math.ceil(total / validSize) || 1;
  const start = (validPage - 1) * validSize;
  const paginated = payments.slice(start, start + validSize);

  return {
    payments: paginated,
    orders: mockDb.orders,
    total,
    page: validPage,
    pageSize: validSize,
    totalPages,
  };
}

export async function reviewPaymentStatus(
  paymentId: string,
  targetStatus: 'APPROVED' | 'REJECTED',
  adminNote?: string
): Promise<{
  payment: Payment;
  order?: Order;
  subscription?: any;
}> {
  mockDb.loadFromDisk();
  const result = mockDb.updatePaymentStatus(paymentId, targetStatus, adminNote);
  if (!result.payment) {
    throw new Error('Payment record not found.');
  }

  return {
    payment: result.payment,
    order: result.order,
    subscription: result.subscription,
  };
}
