import { createAdminClient } from '../supabase/admin.ts';
import { mockDb } from '../supabase/mock-db.ts';
import { encryptToken, decryptToken } from '../security/encryption.ts';
import type {
  UserProfile,
  SubscriptionRecord,
  Order,
  Payment,
  ConnectedEmailAccount,
  UsageRecord,
  PlanTier,
  PaymentMethod,
} from '../../types/database.ts';

/**
 * Unified Database Access Layer.
 * Primary runtime reads and writes go through Supabase PostgreSQL.
 * If Supabase environment variables are unconfigured or unavailable,
 * seamlessly falls back to resilient disk-backed storage to ensure 
 * cold starts and restarts never lose user accounts, orders, or tokens.
 */

// --- PROFILES ---

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as UserProfile;
      }
    } catch (err) {
      // Fallback on network/query failure
    }
  }

  mockDb.loadFromDisk();
  const found = mockDb.profiles.find((p) => p.id === userId);
  return found || null;
}

export async function getProfileByEmail(email: string): Promise<UserProfile | null> {
  const normalized = email.trim().toLowerCase();
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', normalized)
        .maybeSingle();

      if (!error && data) {
        return data as UserProfile;
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  const found = mockDb.profiles.find((p) => p.email.toLowerCase() === normalized);
  return found || null;
}

export async function saveUserProfile(
  profile: Partial<UserProfile> & { id: string; email: string }
): Promise<UserProfile> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: profile.id,
            email: profile.email.toLowerCase(),
            full_name: profile.full_name || '',
            avatar_url: profile.avatar_url || null,
            role: profile.role || 'USER',
            is_suspended: profile.is_suspended ?? false,
            suspension_reason: profile.suspension_reason || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (!error && data) {
        // Mirror to local disk
        mockDb.loadFromDisk();
        const idx = mockDb.profiles.findIndex((p) => p.id === profile.id);
        if (idx >= 0) mockDb.profiles[idx] = data as UserProfile;
        else mockDb.profiles.push(data as UserProfile);
        mockDb.persist();
        return data as UserProfile;
      }
    } catch (err) {
      // Fallback to local disk
    }
  }

  mockDb.loadFromDisk();
  const existingIdx = mockDb.profiles.findIndex((p) => p.id === profile.id);
  const now = new Date().toISOString();
  if (existingIdx >= 0) {
    const updated = { ...mockDb.profiles[existingIdx], ...profile, updated_at: now };
    mockDb.profiles[existingIdx] = updated;
    mockDb.persist();
    return updated;
  }

  const created: UserProfile = {
    id: profile.id,
    email: profile.email.toLowerCase(),
    full_name: profile.full_name || '',
    avatar_url: profile.avatar_url || null,
    role: profile.role || 'USER',
    is_suspended: profile.is_suspended ?? false,
    suspension_reason: profile.suspension_reason || null,
    created_at: now,
    updated_at: now,
  };
  mockDb.profiles.push(created);
  mockDb.persist();
  return created;
}

// --- SUBSCRIPTIONS & TIERS ---

export async function getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as SubscriptionRecord;
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  const found = mockDb.subscriptions.find((s) => s.user_id === userId);
  return found || null;
}

export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  const sub = await getUserSubscription(userId);
  if (sub && sub.status === 'active') {
    return sub.plan_type || 'FREE';
  }
  return 'FREE';
}

export async function saveUserSubscription(
  data: Partial<SubscriptionRecord> & { user_id: string; plan_type: PlanTier }
): Promise<SubscriptionRecord> {
  const now = new Date().toISOString();
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data: result, error } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: data.user_id,
            plan_type: data.plan_type,
            status: data.status || 'active',
            current_period_start: data.current_period_start || now,
            current_period_end: data.current_period_end || new Date(Date.now() + 30 * 86400000).toISOString(),
            cancel_at_period_end: data.cancel_at_period_end ?? false,
            updated_at: now,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (!error && result) {
        // Mirror locally
        mockDb.loadFromDisk();
        const idx = mockDb.subscriptions.findIndex((s) => s.user_id === data.user_id);
        if (idx >= 0) mockDb.subscriptions[idx] = result as SubscriptionRecord;
        else mockDb.subscriptions.push(result as SubscriptionRecord);
        mockDb.persist();
        return result as SubscriptionRecord;
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  const existingIndex = mockDb.subscriptions.findIndex((s) => s.user_id === data.user_id);
  if (existingIndex >= 0) {
    const updated = { ...mockDb.subscriptions[existingIndex], ...data, updated_at: now };
    mockDb.subscriptions[existingIndex] = updated;
    mockDb.persist();
    return updated;
  }

  const created: SubscriptionRecord = {
    id: `sub_${Date.now()}`,
    user_id: data.user_id,
    plan_type: data.plan_type,
    status: data.status || 'active',
    current_period_start: data.current_period_start || now,
    current_period_end: data.current_period_end || new Date(Date.now() + 30 * 86400000).toISOString(),
    cancel_at_period_end: data.cancel_at_period_end ?? false,
    created_at: now,
    updated_at: now,
  };
  mockDb.subscriptions.push(created);
  mockDb.persist();
  return created;
}

// --- USAGE RECORDS ---

export async function getUsageRecord(
  userId: string
): Promise<{ searches_count: number; ai_generations_count: number; emails_sent_count: number }> {
  const currentMonth = new Date().toISOString().substring(0, 7); // '2026-09'
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonth)
        .maybeSingle();

      if (!error && data) {
        return {
          searches_count: data.searches_count || 0,
          ai_generations_count: data.ai_generations_count || 0,
          emails_sent_count: data.emails_sent_count || 0,
        };
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  const local = mockDb.usageRecords.find((u) => u.user_id === userId && u.month_year === currentMonth);
  return {
    searches_count: local?.searches_count || 0,
    ai_generations_count: local?.ai_generations_count || 0,
    emails_sent_count: local?.emails_sent_count || 0,
  };
}

export async function incrementUsage(
  userId: string,
  metric: 'searches_count' | 'ai_generations_count' | 'emails_sent_count',
  amount: number = 1
): Promise<{ searches_count: number; ai_generations_count: number; emails_sent_count: number }> {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const current = await getUsageRecord(userId);
  const newCounts = {
    ...current,
    [metric]: (current[metric] || 0) + amount,
  };

  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from('usage_records').upsert(
        {
          user_id: userId,
          month_year: currentMonth,
          ...newCounts,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month_year' }
      );
    } catch (err) {
      // Non-fatal, local will persist
    }
  }

  mockDb.loadFromDisk();
  const existing = mockDb.usageRecords.find((u) => u.user_id === userId && u.month_year === currentMonth);
  if (existing) {
    existing[metric] = (existing[metric] || 0) + amount;
    existing.updated_at = new Date().toISOString();
  } else {
    mockDb.usageRecords.push({
      id: `usage_${Date.now()}`,
      user_id: userId,
      month_year: currentMonth,
      searches_count: metric === 'searches_count' ? amount : 0,
      ai_generations_count: metric === 'ai_generations_count' ? amount : 0,
      emails_sent_count: metric === 'emails_sent_count' ? amount : 0,
      updated_at: new Date().toISOString(),
    });
  }
  mockDb.persist();

  return newCounts;
}

// --- ORDERS & PAYMENTS ---

export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  const now = new Date().toISOString();
  const order: Order = {
    id: orderData.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    order_reference: orderData.order_reference || `PM-${Date.now().toString().slice(-6)}`,
    user_id: orderData.user_id || '',
    user_email: orderData.user_email || '',
    user_name: orderData.user_name || '',
    plan_tier: orderData.plan_tier || 'PRO',
    plan_name: orderData.plan_name || 'Pro Academic Plan',
    amount: orderData.amount || 0,
    currency: orderData.currency || 'USD',
    billing_interval: orderData.billing_interval || 'monthly',
    status: orderData.status || 'PENDING',
    payment_method_id: orderData.payment_method_id || '',
    payment_method_name: orderData.payment_method_name || 'Direct Transfer',
    created_at: now,
    updated_at: now,
  };

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (!error && data) {
        mockDb.loadFromDisk();
        mockDb.orders.unshift(data as Order);
        mockDb.persist();
        return data as Order;
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  mockDb.orders.unshift(order);
  mockDb.persist();
  return order;
}

export async function getOrderByReference(reference: string): Promise<Order | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_reference', reference)
        .maybeSingle();

      if (!error && data) {
        return data as Order;
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  const found = mockDb.orders.find((o) => o.order_reference === reference);
  return found || null;
}

export async function createPayment(paymentData: Partial<Payment>): Promise<Payment> {
  const now = new Date().toISOString();
  const payment: Payment = {
    id: paymentData.id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    order_id: paymentData.order_id || '',
    order_reference: paymentData.order_reference || '',
    user_id: paymentData.user_id || '',
    user_email: paymentData.user_email || '',
    user_name: paymentData.user_name || '',
    plan_tier: paymentData.plan_tier || 'PRO',
    plan_name: paymentData.plan_name || 'Academic Plan',
    transaction_id: paymentData.transaction_id || '',
    payment_method_id: paymentData.payment_method_id || '',
    payment_method_name: paymentData.payment_method_name || '',
    amount: paymentData.amount || 0,
    currency: paymentData.currency || 'USD',
    proof_file_name: paymentData.proof_file_name,
    proof_file_url: paymentData.proof_file_url,
    payment_note: paymentData.payment_note,
    status: paymentData.status || 'PENDING',
    admin_review_note: paymentData.admin_review_note,
    reviewed_by: paymentData.reviewed_by,
    reviewed_at: paymentData.reviewed_at,
    created_at: now,
    updated_at: now,
  };

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('payments').insert(payment).select().single();
      if (!error && data) {
        mockDb.loadFromDisk();
        mockDb.payments.unshift(data as Payment);
        mockDb.persist();
        return data as Payment;
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  mockDb.payments.unshift(payment);
  mockDb.persist();
  return payment;
}

export async function getPaymentsByUserId(userId: string): Promise<Payment[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Payment[];
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  return mockDb.payments.filter((p) => p.user_id === userId);
}

// --- CONNECTED EMAIL ACCOUNTS (GMAIL OAUTH) ---

export async function getConnectedEmailAccount(userId: string): Promise<ConnectedEmailAccount | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('connected_email_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          access_token: data.access_token ? decryptToken(data.access_token) : '',
          refresh_token: data.refresh_token ? decryptToken(data.refresh_token) : '',
        } as ConnectedEmailAccount;
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  const acc = mockDb.getConnectedEmailAccount(userId);
  return acc || null;
}

export async function saveConnectedEmailAccount(
  data: Partial<ConnectedEmailAccount> & { email: string; user_id: string }
): Promise<ConnectedEmailAccount> {
  const now = new Date().toISOString();
  const encryptedAccessToken = data.access_token ? encryptToken(data.access_token) : undefined;
  const encryptedRefreshToken = data.refresh_token ? encryptToken(data.refresh_token) : undefined;

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const payload: Record<string, any> = {
        user_id: data.user_id,
        email: data.email,
        provider: data.provider || 'gmail',
        status: data.status || 'ACTIVE',
        last_used_at: now,
        updated_at: now,
      };

      if (encryptedAccessToken !== undefined) payload.access_token = encryptedAccessToken;
      if (encryptedRefreshToken !== undefined) payload.refresh_token = encryptedRefreshToken;
      if (data.token_expires_at !== undefined) payload.token_expires_at = data.token_expires_at;

      const { data: saved, error } = await supabase
        .from('connected_email_accounts')
        .upsert(payload, { onConflict: 'user_id,provider' })
        .select()
        .single();

      if (!error && saved) {
        mockDb.loadFromDisk();
        mockDb.saveConnectedEmailAccount(data);
        return {
          ...saved,
          access_token: data.access_token || (saved.access_token ? decryptToken(saved.access_token) : ''),
          refresh_token: data.refresh_token || (saved.refresh_token ? decryptToken(saved.refresh_token) : ''),
        } as ConnectedEmailAccount;
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  return mockDb.saveConnectedEmailAccount(data);
}

export async function deleteConnectedEmailAccount(userId: string, provider: string = 'gmail'): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase
        .from('connected_email_accounts')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  return mockDb.deleteConnectedEmailAccount(userId);
}

// --- PAYMENT METHODS ---

export async function getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return data as PaymentMethod;
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  const found = mockDb.getPaymentMethodById(id);
  return found || null;
}

export async function getAllPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        return data as PaymentMethod[];
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  return mockDb.paymentMethods;
}

// --- SYNCHRONOUS ACCELERATED ACCESSORS (FOR ROUTE GUARDS) ---

export function syncGetUserPlanTier(userId: string): PlanTier {
  mockDb.loadFromDisk();
  return mockDb.getUserPlanTier(userId);
}

export function syncGetUsageRecord(userId: string): {
  searches_count: number;
  ai_generations_count: number;
  emails_sent_count: number;
} {
  mockDb.loadFromDisk();
  const currentMonth = new Date().toISOString().substring(0, 7);
  const local = mockDb.usageRecords.find((u) => u.user_id === userId && u.month_year === currentMonth);
  return {
    searches_count: local?.searches_count || 0,
    ai_generations_count: local?.ai_generations_count || 0,
    emails_sent_count: local?.emails_sent_count || 0,
  };
}

export function syncIncrementUsage(
  userId: string,
  metric: 'searches_count' | 'ai_generations_count' | 'emails_sent_count',
  amount: number = 1
): { searches_count: number; ai_generations_count: number; emails_sent_count: number } {
  mockDb.loadFromDisk();
  mockDb.incrementUsage(userId, metric, amount);
  // Fire-and-forget sync to Supabase Postgres
  incrementUsage(userId, metric, amount).catch(() => {});
  return syncGetUsageRecord(userId);
}

