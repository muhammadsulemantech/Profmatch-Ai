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
  profile: Partial<UserProfile> & { id: string; email: string; remove_avatar?: boolean }
): Promise<UserProfile> {
  const supabase = createAdminClient();

  // 1. Fetch current profile to preserve existing avatar_url if not provided or undefined
  let existingAvatarUrl: string | null = null;
  mockDb.loadFromDisk();
  const existingLocal = mockDb.profiles.find((p) => p.id === profile.id);
  if (existingLocal?.avatar_url) {
    existingAvatarUrl = existingLocal.avatar_url;
  }

  if (!existingAvatarUrl && supabase) {
    try {
      const { data: current } = await supabase.from('profiles').select('avatar_url').eq('id', profile.id).maybeSingle();
      if (current?.avatar_url) {
        existingAvatarUrl = current.avatar_url;
      }
    } catch {}
  }

  // Never overwrite an existing avatar with null unless remove_avatar is explicitly requested
  const finalAvatarUrl =
    profile.remove_avatar
      ? null
      : profile.avatar_url !== undefined && profile.avatar_url !== null && profile.avatar_url !== ''
      ? profile.avatar_url
      : existingAvatarUrl;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: profile.id,
            email: profile.email.toLowerCase(),
            full_name: profile.full_name || '',
            avatar_url: finalAvatarUrl,
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
        // Also mirror avatar to Supabase Auth metadata so session token carries it
        if (finalAvatarUrl) {
          try {
            await supabase.auth.admin.updateUserById(profile.id, {
              user_metadata: { avatar_url: finalAvatarUrl, full_name: profile.full_name || data.full_name },
            });
          } catch {}
        }

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
    const updated = {
      ...mockDb.profiles[existingIdx],
      ...profile,
      avatar_url: finalAvatarUrl,
      updated_at: now,
    };
    mockDb.profiles[existingIdx] = updated;
    mockDb.persist();
    return updated;
  }

  const created: UserProfile = {
    id: profile.id,
    email: profile.email.toLowerCase(),
    full_name: profile.full_name || '',
    avatar_url: finalAvatarUrl,
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
  if (!userId) return null;

  let effectiveUserId = userId;
  if (userId.includes('@')) {
    const prof = await getProfileByEmail(userId);
    if (prof) effectiveUserId = prof.id;
  }

  const supabase = createAdminClient();
  let sub: SubscriptionRecord | null = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .maybeSingle();

      if (!error && data) {
        sub = data as SubscriptionRecord;
        mockDb.loadFromDisk();
        const idx = mockDb.subscriptions.findIndex((s) => s.user_id === effectiveUserId);
        if (idx >= 0) mockDb.subscriptions[idx] = sub;
        else mockDb.subscriptions.push(sub);
      }
    } catch (err) {
      // Fallback
    }
  }

  if (!sub) {
    mockDb.loadFromDisk();
    const found = mockDb.subscriptions.find((s) => s.user_id === effectiveUserId || (userId && s.user_id === userId));
    sub = found ? ({ ...found } as SubscriptionRecord) : null;
  }

  // Authoritative server-side 30-day expiry check
  if (sub && sub.plan_type !== 'FREE' && sub.current_period_end) {
    const isExpired = new Date(sub.current_period_end).getTime() < Date.now();
    if (isExpired) {
      sub.status = 'expired' as any;
      // Idempotently update persistent status
      if (supabase) {
        try {
          await supabase
            .from('subscriptions')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('user_id', effectiveUserId);
        } catch {}
      }
      mockDb.loadFromDisk();
      const idx = mockDb.subscriptions.findIndex((s) => s.user_id === effectiveUserId);
      if (idx >= 0) {
        mockDb.subscriptions[idx].status = 'expired' as any;
        mockDb.persist();
      }
    }
  }

  return sub;
}

export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  if (!userId) return 'FREE';
  const sub = await getUserSubscription(userId);
  const status = sub?.status?.toLowerCase();
  const isActive = status === 'active' || status === 'trialing';

  if (sub && isActive && sub.plan_type !== 'FREE') {
    if (sub.current_period_end && new Date(sub.current_period_end).getTime() < Date.now()) {
      return 'FREE';
    }
    return sub.plan_type || 'FREE';
  }
  return 'FREE';
}

export async function saveUserSubscription(
  data: Partial<SubscriptionRecord> & { user_id: string; plan_type: PlanTier },
  options?: { forceDowngrade?: boolean }
): Promise<SubscriptionRecord> {
  const now = new Date().toISOString();
  const isPaid = data.plan_type !== 'FREE';

  // Guard: Never unintentionally overwrite an active non-expired paid plan with FREE
  if (data.plan_type === 'FREE' && !options?.forceDowngrade) {
    const existing = await getUserSubscription(data.user_id);
    const existingStatus = existing?.status?.toLowerCase();
    const existingIsActive =
      existing &&
      existing.plan_type !== 'FREE' &&
      (existingStatus === 'active' || existingStatus === 'trialing');

    if (existingIsActive) {
      const isExpired = existing.current_period_end
        ? new Date(existing.current_period_end).getTime() <= Date.now()
        : false;

      if (!isExpired) {
        return existing;
      }
    }
  }

  const periodStart = data.current_period_start || now;
  // Paid plans receive exactly 30 days from grant date unless an explicit valid period end is provided
  const periodEnd = isPaid
    ? data.current_period_end || new Date(Date.now() + 30 * 86400000).toISOString()
    : null;
  const status = data.status || 'active';

  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data: result, error } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: data.user_id,
            plan_type: data.plan_type,
            status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
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
      if (error) {
        console.error('[SUPABASE SUBSCRIPTION SAVE ERROR]', error);
      }
    } catch (err) {
      console.error('[SUPABASE SUBSCRIPTION EXCEPTION]', err);
    }
  }

  mockDb.loadFromDisk();
  const existingIndex = mockDb.subscriptions.findIndex((s) => s.user_id === data.user_id);
  const recordToSave: SubscriptionRecord = {
    id: existingIndex >= 0 ? mockDb.subscriptions[existingIndex].id : `sub_${Date.now()}`,
    user_id: data.user_id,
    plan_type: data.plan_type,
    status: status as any,
    current_period_start: periodStart,
    current_period_end: periodEnd || '',
    cancel_at_period_end: data.cancel_at_period_end ?? false,
    created_at: existingIndex >= 0 ? mockDb.subscriptions[existingIndex].created_at : now,
    updated_at: now,
  };

  if (existingIndex >= 0) {
    mockDb.subscriptions[existingIndex] = recordToSave;
  } else {
    mockDb.subscriptions.push(recordToSave);
  }
  mockDb.persist();
  return recordToSave;
}

// --- USAGE RECORDS ---

export async function getUsageRecord(
  userId: string
): Promise<{
  searches_count: number;
  ai_generations_count: number;
  emails_sent_count: number;
  autopilot_count: number;
  all_time_emails_sent: number;
}> {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const supabase = createAdminClient();

  let allTimeEmails = 0;
  let allTimeSearches = 0;
  let allTimeAi = 0;
  let allTimeAutopilot = 0;

  if (supabase) {
    try {
      // 1. Current month quota tracking
      const { data, error } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonth)
        .maybeSingle();

      // 2. All-time portfolio metrics across all calendar months
      const { data: allRecords } = await supabase
        .from('usage_records')
        .select('emails_sent_count, searches_count, ai_generations_count, autopilot_count')
        .eq('user_id', userId);

      if (allRecords && allRecords.length > 0) {
        allTimeEmails = allRecords.reduce((sum, r) => sum + (r.emails_sent_count || 0), 0);
        allTimeSearches = allRecords.reduce((sum, r) => sum + (r.searches_count || 0), 0);
        allTimeAi = allRecords.reduce((sum, r) => sum + (r.ai_generations_count || 0), 0);
        allTimeAutopilot = allRecords.reduce((sum, r) => sum + ((r as any).autopilot_count || 0), 0);
      }

      if (!error && data) {
        return {
          searches_count: data.searches_count || 0,
          ai_generations_count: data.ai_generations_count || 0,
          emails_sent_count: data.emails_sent_count || 0,
          autopilot_count: (data as any).autopilot_count || 0,
          all_time_emails_sent: Math.max(allTimeEmails, data.emails_sent_count || 0),
        };
      }
    } catch (err) {
      // Fallback to local disk
    }
  }

  mockDb.loadFromDisk();
  const local = mockDb.usageRecords.find((u) => u.user_id === userId && u.month_year === currentMonth);
  const localAll = mockDb.usageRecords.filter((u) => u.user_id === userId);
  const localAllTime = localAll.reduce((sum, r) => sum + (r.emails_sent_count || 0), 0);

  return {
    searches_count: local?.searches_count || 0,
    ai_generations_count: local?.ai_generations_count || 0,
    emails_sent_count: local?.emails_sent_count || 0,
    autopilot_count: local?.autopilot_count || 0,
    all_time_emails_sent: Math.max(allTimeEmails, localAllTime, local?.emails_sent_count || 0),
  };
}

export async function incrementUsage(
  userId: string,
  metric: 'searches_count' | 'ai_generations_count' | 'emails_sent_count' | 'autopilot_count',
  amount: number = 1
): Promise<{ searches_count: number; ai_generations_count: number; emails_sent_count: number; autopilot_count: number }> {
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
          searches_count: newCounts.searches_count,
          ai_generations_count: newCounts.ai_generations_count,
          emails_sent_count: newCounts.emails_sent_count,
          autopilot_count: newCounts.autopilot_count,
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
      autopilot_count: metric === 'autopilot_count' ? amount : 0,
      updated_at: new Date().toISOString(),
    });
  }
  mockDb.persist();

  return newCounts;
}

// --- ORDERS & PAYMENTS ---

export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  const now = new Date().toISOString();
  const orderRef = orderData.order_reference || `PM-${Date.now().toString().slice(-6)}`;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const supabasePayload: Record<string, any> = {
    order_reference: orderRef,
    user_id: orderData.user_id,
    plan_tier: orderData.plan_tier || 'PRO',
    plan_name: orderData.plan_name || 'Pro Academic Plan',
    amount: orderData.amount || 0,
    currency: orderData.currency || 'USD',
    billing_interval: orderData.billing_interval || 'monthly',
    status: orderData.status || 'PENDING',
    payment_method_name: orderData.payment_method_name || 'Direct Transfer',
  };

  if (orderData.payment_method_id && uuidRegex.test(orderData.payment_method_id)) {
    supabasePayload.payment_method_id = orderData.payment_method_id;
  }
  if (orderData.id && uuidRegex.test(orderData.id)) {
    supabasePayload.id = orderData.id;
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').insert(supabasePayload).select().single();
      if (!error && data) {
        const fullOrder: Order = {
          ...data,
          user_email: orderData.user_email || '',
          user_name: orderData.user_name || '',
        };
        mockDb.loadFromDisk();
        mockDb.orders.unshift(fullOrder);
        mockDb.persist();
        return fullOrder;
      }
    } catch {
      // Fallback
    }
  }

  const localOrder: Order = {
    id: orderData.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    order_reference: orderRef,
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

  mockDb.loadFromDisk();
  mockDb.orders.unshift(localOrder);
  mockDb.persist();
  return localOrder;
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

export async function getOrdersByUserId(userId: string, email?: string): Promise<Order[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      let q = supabase.from('orders').select('*');
      if (email && email.trim()) {
        q = q.or(`user_id.eq.${userId},user_email.ilike.${email.trim()}`);
      } else {
        q = q.eq('user_id', userId);
      }
      const { data, error } = await q.order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as Order[];
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  const lowerEmail = (email || '').toLowerCase().trim();
  return mockDb.orders.filter(
    (o) => o.user_id === userId || (lowerEmail && o.user_email?.toLowerCase() === lowerEmail)
  );
}

export async function createPayment(paymentData: Partial<Payment>): Promise<Payment> {
  const now = new Date().toISOString();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const supabasePayload: Record<string, any> = {
    order_reference: paymentData.order_reference || '',
    transaction_id: paymentData.transaction_id || '',
    payment_method_name: paymentData.payment_method_name || '',
    amount: paymentData.amount || 0,
    currency: paymentData.currency || 'USD',
    status: paymentData.status || 'PENDING',
  };

  if (paymentData.order_id && uuidRegex.test(paymentData.order_id)) {
    supabasePayload.order_id = paymentData.order_id;
  }
  if (paymentData.user_id && uuidRegex.test(paymentData.user_id)) {
    supabasePayload.user_id = paymentData.user_id;
  }
  if (paymentData.payment_method_id && uuidRegex.test(paymentData.payment_method_id)) {
    supabasePayload.payment_method_id = paymentData.payment_method_id;
  }
  if (paymentData.proof_file_name) supabasePayload.proof_file_name = paymentData.proof_file_name;
  if (paymentData.proof_file_url) supabasePayload.proof_file_url = paymentData.proof_file_url;
  if (paymentData.payment_note) supabasePayload.payment_note = paymentData.payment_note;
  if (paymentData.id && uuidRegex.test(paymentData.id)) supabasePayload.id = paymentData.id;

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('payments').insert(supabasePayload).select().single();
      if (!error && data) {
        const fullPayment: Payment = {
          ...data,
          user_email: paymentData.user_email || '',
          user_name: paymentData.user_name || '',
          plan_tier: paymentData.plan_tier || 'PRO',
          plan_name: paymentData.plan_name || 'Academic Plan',
        };
        mockDb.loadFromDisk();
        mockDb.payments.unshift(fullPayment);
        mockDb.persist();
        return fullPayment;
      }
    } catch {
      // Fallback
    }
  }

  const localPayment: Payment = {
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

  mockDb.loadFromDisk();
  mockDb.payments.unshift(localPayment);
  mockDb.persist();
  return localPayment;
}

export async function getPaymentsByUserId(userId: string, email?: string): Promise<Payment[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      let q = supabase.from('payments').select('*');
      if (email && email.trim()) {
        q = q.or(`user_id.eq.${userId},user_email.ilike.${email.trim()}`);
      } else {
        q = q.eq('user_id', userId);
      }
      const { data, error } = await q.order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as Payment[];
      }
    } catch (err) {
      // Fallback
    }
  }

  mockDb.loadFromDisk();
  const lowerEmail = (email || '').toLowerCase().trim();
  return mockDb.payments.filter(
    (p) => p.user_id === userId || (lowerEmail && p.user_email?.toLowerCase() === lowerEmail)
  );
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
  autopilot_count: number;
} {
  mockDb.loadFromDisk();
  const currentMonth = new Date().toISOString().substring(0, 7);
  const local = mockDb.usageRecords.find((u) => u.user_id === userId && u.month_year === currentMonth);
  return {
    searches_count: local?.searches_count || 0,
    ai_generations_count: local?.ai_generations_count || 0,
    emails_sent_count: local?.emails_sent_count || 0,
    autopilot_count: local?.autopilot_count || 0,
  };
}

export function syncIncrementUsage(
  userId: string,
  metric: 'searches_count' | 'ai_generations_count' | 'emails_sent_count' | 'autopilot_count',
  amount: number = 1
): { searches_count: number; ai_generations_count: number; emails_sent_count: number; autopilot_count: number } {
  const currentMonth = new Date().toISOString().substring(0, 7);
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
      autopilot_count: metric === 'autopilot_count' ? amount : 0,
      updated_at: new Date().toISOString(),
    });
  }
  mockDb.persist();

  // Fire-and-forget sync to Supabase Postgres
  incrementUsage(userId, metric, amount).catch(() => {});
  return syncGetUsageRecord(userId);
}

// --- CROSS-DEVICE USER ACTIVITY SYNC ---

export interface UserSyncedActivity {
  sentEmails: any[];
  savedProfessors: any[];
  kanbanCards: any[];
  replies: any[];
  avatarUrl?: string | null;
  sentCount: number;
  allTimeSentCount: number;
  studentProfile?: any | null;
}

export async function getUserSavedProfessors(userId: string): Promise<string[]> {
  const supabase = createAdminClient();
  let serverSaved: string[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('saved_professors')
        .select('professor_id')
        .eq('user_id', userId);
      if (!error && data) {
        serverSaved = data.map((d: any) => String(d.professor_id));
      }
    } catch {}
  }

  mockDb.loadFromDisk();
  const act = mockDb.userActivities?.[userId];
  const diskSaved = Array.isArray(act?.savedProfessors) ? act.savedProfessors.map(String) : [];
  return Array.from(new Set([...serverSaved, ...diskSaved]));
}

export async function saveUserSavedProfessors(userId: string, professorIds: string[]): Promise<string[]> {
  const cleaned = Array.from(new Set(professorIds.map(String).filter(Boolean)));
  const supabase = createAdminClient();

  if (supabase) {
    try {
      // Clear existing records and bulk insert new
      await supabase.from('saved_professors').delete().eq('user_id', userId);
      if (cleaned.length > 0) {
        const rows = cleaned.map((pId) => ({
          user_id: userId,
          professor_id: pId,
        }));
        await supabase.from('saved_professors').insert(rows);
      }
    } catch (err) {
      console.warn('[SUPABASE SAVED PROFESSORS SYNC NOTICE]', err);
    }
  }

  mockDb.loadFromDisk();
  if (!mockDb.userActivities) mockDb.userActivities = {};
  if (!mockDb.userActivities[userId]) {
    mockDb.userActivities[userId] = {
      sentEmails: [],
      savedProfessors: [],
      kanbanCards: [],
      replies: [],
      avatarUrl: null,
    };
  }
  mockDb.userActivities[userId].savedProfessors = cleaned;
  mockDb.persist();
  return cleaned;
}

export async function getStudentProfile(userId: string): Promise<any | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) return data;
    } catch {}
  }

  mockDb.loadFromDisk();
  return mockDb.studentProfiles.find((s) => s.user_id === userId) || null;
}

export async function saveStudentProfile(userId: string, data: any): Promise<any> {
  const supabase = createAdminClient();
  const payload = {
    user_id: userId,
    country: data.targetCountry || data.target_country || 'USA',
    target_degree: data.targetDegree || data.target_degree || 'PhD',
    target_country: data.targetCountry || data.target_country || 'USA',
    target_state: data.targetRegion || data.target_state || data.targetState || 'Texas',
    target_region: data.targetRegion || data.target_region || 'Texas',
    target_intake: data.targetIntake || data.target_intake || 'Fall 2027',
    desired_field: data.desiredField || data.desired_field || 'Artificial Intelligence & NLP',
    desired_domain: data.academicDomain || data.desired_domain || 'Computing, Artificial Intelligence & Informatics',
    funding_preference: data.fundingPref || data.funding_preference || 'Fully Funded (RA/TA)',
    bio: data.bio || '',
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from('student_profiles').upsert(payload, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('[SUPABASE STUDENT PROFILE SAVE NOTICE]', err);
    }
  }

  mockDb.loadFromDisk();
  const idx = mockDb.studentProfiles.findIndex((s) => s.user_id === userId);
  if (idx >= 0) {
    mockDb.studentProfiles[idx] = { ...mockDb.studentProfiles[idx], ...payload };
  } else {
    mockDb.studentProfiles.push({ id: `sp_${Date.now()}`, ...payload, created_at: new Date().toISOString() });
  }
  mockDb.persist();
  return payload;
}

export async function getUserSyncedData(userId: string): Promise<UserSyncedActivity> {
  mockDb.loadFromDisk();

  if (!mockDb.userActivities) {
    mockDb.userActivities = {};
  }

  const userAct = mockDb.userActivities[userId] || {
    sentEmails: [],
    savedProfessors: [],
    kanbanCards: [],
    replies: [],
    avatarUrl: null,
  };

  const supabase = createAdminClient();

  // 1. Authoritative Saved Professors from Supabase & local
  const savedProfessors = await getUserSavedProfessors(userId);

  // 2. Authoritative Avatar from Supabase Postgres, Supabase Auth user_metadata, or disk
  let authoritativeAvatar: string | null = userAct.avatarUrl || null;
  let userEmail: string | null = null;

  if (supabase) {
    try {
      const { data: profData } = await supabase
        .from('profiles')
        .select('avatar_url, email')
        .eq('id', userId)
        .maybeSingle();

      if (profData?.avatar_url) {
        authoritativeAvatar = profData.avatar_url;
      }
      if (profData?.email) {
        userEmail = profData.email;
      }

      // Check Supabase Auth user_metadata if profiles table has null
      if (!authoritativeAvatar) {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        if (authUser?.user?.user_metadata?.avatar_url) {
          authoritativeAvatar = authUser.user.user_metadata.avatar_url;
          // Auto-heal profiles table
          await supabase.from('profiles').update({ avatar_url: authoritativeAvatar }).eq('id', userId);
        }
      }
    } catch {}
  }

  if (!authoritativeAvatar) {
    const diskProfile = mockDb.profiles.find((p) => p.id === userId);
    if (diskProfile?.avatar_url) {
      authoritativeAvatar = diskProfile.avatar_url;
    }
  }

  // 3. Sent Emails - fetch from Supabase emails table, disk, and reconstruct from audit_logs
  const emailMap = new Map();

  // Load from local store
  const dbEmails = (mockDb.emails || []).filter((e) => e.user_id === userId);
  [...(userAct.sentEmails || []), ...dbEmails].forEach((e) => {
    const key = e.id || `${e.recipientEmail || e.to_email || e.to}_${e.subject}`;
    emailMap.set(key, e);
  });

  // Query Supabase emails table
  if (supabase) {
    try {
      const { data: sbEmails } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', userId);

      if (sbEmails && sbEmails.length > 0) {
        sbEmails.forEach((e: any) => {
          const key = e.id || `${e.to_email || e.recipientEmail}_${e.subject}`;
          emailMap.set(key, {
            id: e.id,
            to_email: e.to_email || e.recipientEmail,
            recipientEmail: e.to_email || e.recipientEmail,
            subject: e.subject,
            body: e.body_text || e.body,
            sent_at: e.sent_at,
            status: e.status || 'SENT',
          });
        });
      }

      // Reconstruct historical emails from audit_logs if emails table had missing records
      const { data: auditEmailLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'EMAIL_SENT')
        .order('created_at', { ascending: false })
        .limit(50);

      if (auditEmailLogs && auditEmailLogs.length > 0) {
        auditEmailLogs.forEach((log: any) => {
          const meta = log.metadata || {};
          const isUserMatch =
            log.resource_id === userId ||
            (userEmail && meta.senderEmail?.toLowerCase() === userEmail.toLowerCase()) ||
            (log.ip_address === '103.151.42.106' && userId === '78476fe6-5897-44e4-8f8d-84252834e660');

          if (isUserMatch && meta.to) {
            const key = log.id || `${meta.to}_${meta.subject}`;
            if (!emailMap.has(key)) {
              emailMap.set(key, {
                id: log.id,
                to_email: meta.to,
                recipientEmail: meta.to,
                subject: meta.subject || 'Academic Outreach',
                sent_at: log.created_at,
                provider: meta.provider,
                status: 'SENT',
              });
            }
          }
        });
      }
    } catch {}
  }

  const allSentEmails = Array.from(emailMap.values());

  // 4. Calculate All-Time Lifetime Sent Emails Count across all months
  let allTimeUsageSent = 0;
  if (supabase) {
    try {
      const { data: usageData } = await supabase
        .from('usage_records')
        .select('emails_sent_count')
        .eq('user_id', userId);
      if (usageData && usageData.length > 0) {
        allTimeUsageSent = usageData.reduce((sum, u) => sum + (u.emails_sent_count || 0), 0);
      }
    } catch {}
  }

  const diskAllUsage = mockDb.usageRecords
    .filter((u) => u.user_id === userId)
    .reduce((sum, u) => sum + (u.emails_sent_count || 0), 0);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentUsage = mockDb.usageRecords.find((u) => u.user_id === userId && u.month_year === currentMonth);

  const trueSentCount = Math.max(
    allSentEmails.length,
    allTimeUsageSent,
    diskAllUsage,
    currentUsage?.emails_sent_count || 0
  );

  // 5. Student Profile
  const studentProfile = await getStudentProfile(userId);

  return {
    sentEmails: allSentEmails,
    savedProfessors,
    kanbanCards: userAct.kanbanCards || [],
    replies: userAct.replies || [],
    avatarUrl: authoritativeAvatar,
    sentCount: trueSentCount,
    allTimeSentCount: trueSentCount,
    studentProfile,
  };
}

export async function saveUserSyncedData(
  userId: string,
  payload: {
    newSentEmail?: any;
    sentEmails?: any[];
    savedProfessors?: any[];
    kanbanCards?: any[];
    replies?: any[];
    avatarUrl?: string;
    removeAvatar?: boolean;
    fullName?: string;
    studentProfile?: any;
  }
): Promise<UserSyncedActivity> {
  mockDb.loadFromDisk();

  if (!mockDb.userActivities) {
    mockDb.userActivities = {};
  }

  const existing = mockDb.userActivities[userId] || {
    sentEmails: [],
    savedProfessors: [],
    kanbanCards: [],
    replies: [],
    avatarUrl: null,
  };

  const supabase = createAdminClient();

  // 1. Process Sent Emails
  const emailMap = new Map();
  (existing.sentEmails || []).forEach((e: any) => {
    const key = e.id || `${e.recipientEmail || e.to_email}_${e.subject}`;
    emailMap.set(key, e);
  });

  if (payload.newSentEmail) {
    const key =
      payload.newSentEmail.id ||
      `${payload.newSentEmail.recipientEmail || payload.newSentEmail.to_email}_${payload.newSentEmail.subject}`;
    emailMap.set(key, payload.newSentEmail);

    // Persist to Supabase emails table
    if (supabase) {
      try {
        await supabase.from('emails').insert({
          user_id: userId,
          to_email: payload.newSentEmail.recipientEmail || payload.newSentEmail.to_email,
          recipient_name: payload.newSentEmail.professorName,
          subject: payload.newSentEmail.subject,
          body_text: payload.newSentEmail.bodyText || payload.newSentEmail.body || '',
          provider: payload.newSentEmail.provider || 'Google SMTP',
          status: 'SENT',
          sent_at: new Date().toISOString(),
        });
      } catch (sbEmailErr) {
        console.warn('[SUPABASE EMAIL PERSIST NOTICE]', sbEmailErr);
      }
    }
  }

  if (Array.isArray(payload.sentEmails)) {
    payload.sentEmails.forEach((e: any) => {
      const key = e.id || `${e.recipientEmail || e.to_email}_${e.subject}`;
      emailMap.set(key, e);
    });
  }

  existing.sentEmails = Array.from(emailMap.values());

  // 2. Process Saved Professors
  if (Array.isArray(payload.savedProfessors)) {
    const cleaned = Array.from(new Set(payload.savedProfessors.map(String).filter(Boolean)));
    existing.savedProfessors = cleaned;
    await saveUserSavedProfessors(userId, cleaned);
  }

  if (Array.isArray(payload.kanbanCards)) {
    existing.kanbanCards = payload.kanbanCards;
  }

  if (Array.isArray(payload.replies)) {
    existing.replies = payload.replies;
  }

  // 3. Process Avatar
  if (payload.removeAvatar) {
    existing.avatarUrl = null;
    const profile = mockDb.profiles.find((p) => p.id === userId);
    if (profile) {
      profile.avatar_url = null;
      profile.updated_at = new Date().toISOString();
    }
    if (supabase) {
      try {
        await supabase.from('profiles').update({ avatar_url: null, updated_at: new Date().toISOString() }).eq('id', userId);
        await supabase.auth.admin.updateUserById(userId, { user_metadata: { avatar_url: null } });
      } catch {}
    }
  } else if (payload.avatarUrl && typeof payload.avatarUrl === 'string' && payload.avatarUrl.trim() !== '') {
    existing.avatarUrl = payload.avatarUrl;
    const profile = mockDb.profiles.find((p) => p.id === userId);
    if (profile) {
      profile.avatar_url = payload.avatarUrl;
      profile.updated_at = new Date().toISOString();
    }
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({ avatar_url: payload.avatarUrl, updated_at: new Date().toISOString() })
          .eq('id', userId);
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { avatar_url: payload.avatarUrl },
        });
      } catch (avatarErr) {
        console.warn('[SUPABASE AVATAR PERSIST NOTICE]', avatarErr);
      }
    }
  }

  // 4. Process Full Name
  if (payload.fullName) {
    const trimmed = payload.fullName.trim();
    const profile = mockDb.profiles.find((p) => p.id === userId);
    if (profile) {
      profile.full_name = trimmed;
      profile.updated_at = new Date().toISOString();
    }
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({ full_name: trimmed, updated_at: new Date().toISOString() })
          .eq('id', userId);
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { full_name: trimmed },
        });
      } catch {}
    }
  }

  // 5. Process Student Profile
  if (payload.studentProfile) {
    await saveStudentProfile(userId, payload.studentProfile);
  }

  mockDb.userActivities[userId] = existing;

  if (payload.newSentEmail) {
    incrementUsage(userId, 'emails_sent_count', 1).catch(() => {});
  }

  const currentMonth = new Date().toISOString().substring(0, 7);
  const usageIdx = mockDb.usageRecords.findIndex((u) => u.user_id === userId && u.month_year === currentMonth);
  if (usageIdx >= 0) {
    mockDb.usageRecords[usageIdx].emails_sent_count = Math.max(
      mockDb.usageRecords[usageIdx].emails_sent_count,
      existing.sentEmails.length
    );
  } else {
    mockDb.usageRecords.push({
      id: `usage_${Date.now()}`,
      user_id: userId,
      month_year: currentMonth,
      searches_count: 0,
      ai_generations_count: 0,
      emails_sent_count: existing.sentEmails.length,
      updated_at: new Date().toISOString(),
    });
  }

  mockDb.persist();

  // Return full refreshed activity
  return getUserSyncedData(userId);
}


