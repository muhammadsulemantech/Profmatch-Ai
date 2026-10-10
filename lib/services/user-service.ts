import { mockDb } from '../supabase/mock-db.ts';
import { createAdminClient } from '../supabase/admin.ts';
import { getUserProfile, saveUserProfile, saveUserSubscription } from './db-service.ts';
import { ACADEMIC_PLANS } from './usage-service.ts';
import type {
  UserProfile,
  StudentProfile,
  AcademicProfile,
  ResearchProfile,
  StudentProject,
  StudentSkill,
  PlanTier,
  UserRole,
} from '../../types/database.ts';


export interface EnrichedUser extends UserProfile {
  plan_tier: PlanTier;
  is_paid: boolean;
  subscription_status: string;
  subscription_start?: string | null;
  subscription_end: string | null;
  is_expired?: boolean;
  usage?: {
    searches_count: number;
    ai_generations_count: number;
    emails_sent_count: number;
  };
  payments_count: number;
  orders_count: number;
  last_order_date: string | null;
}

export interface GetUsersOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  planTier?: string;
}

function checkAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const configuredAdmins = (process.env.ADMIN_EMAILS || 'admin@profmatch.ai')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return configuredAdmins.includes(normalized) || normalized === 'admin@profmatch.ai';
}

export async function getEnrichedUsers(options: GetUsersOptions = {}): Promise<{
  users: EnrichedUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { page = 1, pageSize = 100, search = '', role, planTier } = options;

  let dbProfiles: UserProfile[] = [];
  let dbSubs: any[] = [];
  let dbPayments: any[] = [];
  let dbOrders: any[] = [];
  let dbUsage: any[] = [];
  let supabaseLoaded = false;

  const supabase = createAdminClient();
  if (supabase) {
    try {
      // 1. Reconcile and synchronize any Supabase Auth accounts missing in public.profiles
      try {
        const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const authUsers = authData?.users || [];
        if (!authErr && authUsers.length > 0) {
          const { data: existingProfiles } = await supabase.from('profiles').select('id');
          const existingIds = new Set((existingProfiles || []).map((p: any) => p.id));
          const missingAuthUsers = authUsers.filter((u: any) => !existingIds.has(u.id));

          if (missingAuthUsers.length > 0) {
            const missingProfiles = missingAuthUsers.map((u: any) => {
              const email = (u.email || '').toLowerCase().trim();
              const isAdmin = checkAdminEmail(email) || u.user_metadata?.role === 'ADMIN';
              return {
                id: u.id,
                email,
                full_name: u.user_metadata?.full_name || u.user_metadata?.name || email.split('@')[0] || 'User',
                avatar_url: u.user_metadata?.avatar_url || null,
                role: isAdmin ? 'ADMIN' : 'USER',
                is_suspended: Boolean(u.banned_until && new Date(u.banned_until) > new Date()),
                suspension_reason: null,
                created_at: u.created_at,
                updated_at: u.updated_at || u.created_at,
              };
            });

            await supabase.from('profiles').upsert(missingProfiles, { onConflict: 'id' });
          }
        }
      } catch {
        // Non-blocking sync attempt
      }

      // 2. Fetch all persistent profiles
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (search) {
        const term = `%${search.toLowerCase().trim()}%`;
        query = query.or(`email.ilike.${term},full_name.ilike.${term}`);
      }

      if (role) {
        query = query.eq('role', role);
      }

      const { data: pData, error: pErr } = await query;
      if (!pErr && pData) {
        dbProfiles = pData as UserProfile[];

        const [subsRes, payRes, ordRes, usageRes] = await Promise.all([
          supabase.from('subscriptions').select('*'),
          supabase.from('payments').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('usage_records').select('*'),
        ]);

        dbSubs = subsRes.data || [];
        dbPayments = payRes.data || [];
        dbOrders = ordRes.data || [];
        dbUsage = usageRes.data || [];
        supabaseLoaded = true;
      }
    } catch {
      // fallback to mockDb only if Supabase connection fails
    }
  }

  // Fallback to disk ONLY if Supabase connection failed or is unconfigured
  if (!supabaseLoaded) {
    mockDb.loadFromDisk();
    dbProfiles = [...mockDb.profiles];
    dbSubs = [...mockDb.subscriptions];
    dbPayments = [...mockDb.payments];
    dbOrders = [...mockDb.orders];
    dbUsage = [...mockDb.usageRecords];

    if (search) {
      const term = search.toLowerCase().trim();
      dbProfiles = dbProfiles.filter(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          (u.full_name && u.full_name.toLowerCase().includes(term))
      );
    }

    if (role) {
      dbProfiles = dbProfiles.filter((u) => u.role === role);
    }
  }

  const currentMonth = new Date().toISOString().substring(0, 7);

  let enriched: EnrichedUser[] = dbProfiles.map((u) => {
    const sub = dbSubs
      .filter((s) => s.user_id === u.id)
      .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime())[0];

    // Check authoritative 30-day expiration
    const isExpired = Boolean(
      sub && sub.plan_type !== 'FREE' && sub.current_period_end && new Date(sub.current_period_end).getTime() < Date.now()
    );
    const hasActiveSub = sub && (sub.status === 'active' || sub.status === 'trialing') && !isExpired;
    const currentPlan: PlanTier = hasActiveSub ? (sub.plan_type as PlanTier) : 'FREE';
    const isPaid = currentPlan !== 'FREE' && hasActiveSub;

    const userPayments = dbPayments.filter(
      (p) => p.user_id === u.id || (p.user_email && p.user_email.toLowerCase() === u.email.toLowerCase())
    );
    const userOrders = dbOrders.filter(
      (o) => o.user_id === u.id || (o.user_email && o.user_email.toLowerCase() === u.email.toLowerCase())
    );
    const userUsage = dbUsage.find(
      (ur: any) => ur.user_id === u.id && ur.month_year === currentMonth
    );

    return {
      ...u,
      plan_tier: currentPlan,
      is_paid: isPaid,
      subscription_status: isExpired ? 'expired' : (sub ? sub.status : 'free'),
      subscription_start: sub ? (sub.current_period_start || sub.created_at) : null,
      subscription_end: sub ? sub.current_period_end : null,
      is_expired: isExpired,
      usage: {
        searches_count: userUsage?.searches_count || 0,
        ai_generations_count: userUsage?.ai_generations_count || 0,
        emails_sent_count: userUsage?.emails_sent_count || 0,
      },
      payments_count: userPayments.length,
      orders_count: userOrders.length,
      last_order_date: userOrders[0]?.created_at || null,
    };
  });

  if (planTier) {
    enriched = enriched.filter((u) => u.plan_tier === planTier);
  }

  const total = enriched.length;
  const validPage = Math.max(1, page);
  const validSize = Math.max(1, Math.min(100, pageSize));
  const totalPages = Math.ceil(total / validSize) || 1;
  const start = (validPage - 1) * validSize;
  const paginated = enriched.slice(start, start + validSize);

  return {
    users: paginated,
    total,
    page: validPage,
    pageSize: validSize,
    totalPages,
  };
}

export interface UpdateUserParams {
  userId: string;
  role?: UserRole;
  isSuspended?: boolean;
  suspensionReason?: string | null;
  planTier?: PlanTier;
}

export async function updateUser(params: UpdateUserParams): Promise<UserProfile> {
  const { userId, role, isSuspended, suspensionReason, planTier } = params;

  let profile = await getUserProfile(userId);
  if (!profile) {
    throw new Error('User not found.');
  }

  if (planTier) {
    const validTiers = Object.keys(ACADEMIC_PLANS);
    if (!validTiers.includes(planTier)) {
      throw new Error(`Invalid plan tier: "${planTier}". Valid tiers are: ${validTiers.join(', ')}`);
    }
  }

  const updatedProfileData: Partial<UserProfile> & { id: string; email: string } = {
    id: userId,
    email: profile.email,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: role || profile.role,
    is_suspended: isSuspended !== undefined ? Boolean(isSuspended) : profile.is_suspended,
    suspension_reason: suspensionReason !== undefined ? suspensionReason : profile.suspension_reason,
  };

  const saved = await saveUserProfile(updatedProfileData);

  if (planTier) {
    const isPaid = planTier !== 'FREE';
    const now = new Date().toISOString();
    // Authoritative 30-day period for paid plans, null for FREE
    const periodEnd = isPaid ? new Date(Date.now() + 30 * 86400000).toISOString() : null;

    await saveUserSubscription({
      user_id: userId,
      plan_type: planTier,
      status: 'active',
      current_period_start: now,
      current_period_end: periodEnd,
    });
  }

  if (role) {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { role },
        });
      }
    } catch {
      // Non-blocking metadata sync
    }
  }

  mockDb.loadFromDisk();
  const idx = mockDb.profiles.findIndex((p) => p.id === userId);
  if (idx >= 0) {
    mockDb.profiles[idx] = saved;
    mockDb.persist();
  }

  return saved;
}


export async function getStudentProfileByUserId(userId: string): Promise<{
  student: StudentProfile | null;
  academic: AcademicProfile | null;
  research: ResearchProfile | null;
  projects: StudentProject[];
  skills: StudentSkill[];
}> {
  mockDb.loadFromDisk();

  const student = mockDb.studentProfiles.find((s) => s.user_id === userId) || mockDb.studentProfiles[0] || null;
  const studentId = student?.id;

  const academic = studentId
    ? mockDb.academicProfiles.find((a) => a.student_id === studentId) || mockDb.academicProfiles[0] || null
    : null;

  const research = studentId
    ? mockDb.researchProfiles.find((r) => r.student_id === studentId) || mockDb.researchProfiles[0] || null
    : null;

  const projects = studentId ? mockDb.studentProjects.filter((p) => p.student_id === studentId) : [];
  const skills = studentId ? mockDb.studentSkills.filter((s) => s.student_id === studentId) : [];

  return {
    student,
    academic,
    research,
    projects,
    skills,
  };
}
