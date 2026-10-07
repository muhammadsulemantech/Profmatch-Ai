import crypto from 'crypto';
import { mockDb } from '../supabase/mock-db.ts';
import { createAdminClient } from '../supabase/admin.ts';
import { ManualPaymentProvider } from '../providers/payment/index.ts';
import { ACADEMIC_PLANS } from './usage-service.ts';
import { saveUserSubscription } from './db-service.ts';
import type { PaymentMethod, Payment, Order, PaymentStatus, PlanTier } from '../../types/database.ts';


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
  const supabase = createAdminClient();
  if (supabase) {
    try {
      let query = supabase.from('payment_methods').select('*').order('sort_order', { ascending: true });
      if (country) {
        query = query.or(`country.ilike.%${country}%,country.eq.Global`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        mockDb.paymentMethods = data as PaymentMethod[];
        return data as PaymentMethod[];
      }
    } catch {
      // fallback to disk
    }
  }
  mockDb.loadFromDisk();
  if (country) {
    return mockDb.getPaymentMethods(country);
  }
  return mockDb.paymentMethods;
}

export async function getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('payment_methods').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return data as PaymentMethod;
      }
    } catch {
      // fallback
    }
  }
  mockDb.loadFromDisk();
  return mockDb.getPaymentMethodById(id) || null;
}

export async function savePaymentMethod(data: Partial<PaymentMethod>): Promise<PaymentMethod> {
  const supabase = createAdminClient();
  let savedFromDb: PaymentMethod | null = null;
  const now = new Date().toISOString();

  if (supabase) {
    try {
      if (data.id) {
        const { data: updated, error } = await supabase
          .from('payment_methods')
          .update({
            ...data,
            updated_at: now,
          })
          .eq('id', data.id)
          .select()
          .single();
        if (!error && updated) savedFromDb = updated as PaymentMethod;
      } else {
        const { data: created, error } = await supabase
          .from('payment_methods')
          .insert({
            name: data.name || 'New Payment Method',
            type: data.type || 'other',
            country: data.country || 'Global',
            country_code: data.country_code || null,
            currency: data.currency || 'USD',
            account_name: data.account_name || '',
            account_number: data.account_number || '',
            account_identifier: data.account_identifier || null,
            instructions: data.instructions || '',
            logo: data.logo || null,
            enabled: data.enabled ?? true,
            sort_order: data.sort_order || 0,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();
        if (!error && created) savedFromDb = created as PaymentMethod;
      }
    } catch {
      // fallback
    }
  }

  mockDb.loadFromDisk();
  const saved = mockDb.savePaymentMethod(savedFromDb || data);
  return savedFromDb || saved;
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from('payment_methods').delete().eq('id', id);
    } catch {
      // fallback
    }
  }
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
  const validPage = Math.max(1, page);
  const validSize = Math.max(1, Math.min(100, pageSize));
  const start = (validPage - 1) * validSize;
  const end = start + validSize - 1;

  const supabase = createAdminClient();
  if (supabase) {
    try {
      let q = supabase.from('payments').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      if (status && status !== 'ALL') {
        q = q.eq('status', status);
      }
      if (query && query.trim() !== '') {
        const term = `%${query.trim().toLowerCase()}%`;
        q = q.or(`order_reference.ilike.${term},transaction_id.ilike.${term},user_email.ilike.${term},user_name.ilike.${term}`);
      }
      const { data: paymentsData, count, error } = await q.range(start, end);
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (!error && paymentsData !== null) {
        const total = count ?? paymentsData.length;
        const totalPages = Math.ceil(total / validSize) || 1;
        return {
          payments: paymentsData as Payment[],
          orders: (ordersData || []) as Order[],
          total,
          page: validPage,
          pageSize: validSize,
          totalPages,
        };
      }
    } catch {
      // fallback
    }
  }

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
  const totalPages = Math.ceil(total / validSize) || 1;
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
  const now = new Date().toISOString();
  let updatedPayment: Payment | null = null;
  let updatedOrder: Order | undefined = undefined;
  let updatedSub: any = undefined;

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data: pData, error: pErr } = await supabase
        .from('payments')
        .update({
          status: targetStatus,
          admin_review_note: adminNote || null,
          reviewed_at: now,
          updated_at: now,
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (!pErr && pData) {
        updatedPayment = pData as Payment;

        // Also update matching order
        const { data: oData } = await supabase
          .from('orders')
          .update({
            status: targetStatus,
            updated_at: now,
          })
          .eq('order_reference', updatedPayment.order_reference)
          .select()
          .maybeSingle();

        if (oData) updatedOrder = oData as Order;

        // If approved, activate subscription in PostgreSQL
        if (targetStatus === 'APPROVED' && updatedPayment.user_id && updatedPayment.plan_tier) {
          updatedSub = await saveUserSubscription({
            user_id: updatedPayment.user_id,
            plan_type: updatedPayment.plan_tier,
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
          });
        }
      }
    } catch {
      // fallback
    }
  }

  mockDb.loadFromDisk();
  const result = mockDb.updatePaymentStatus(paymentId, targetStatus, adminNote);

  if (!updatedPayment && !result.payment) {
    throw new Error('Payment record not found.');
  }

  return {
    payment: updatedPayment || result.payment!,
    order: updatedOrder || result.order,
    subscription: updatedSub || result.subscription,
  };
}

