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
  subscription_end: string | null;
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

export async function getEnrichedUsers(options: GetUsersOptions = {}): Promise<{
  users: EnrichedUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { page = 1, pageSize = 20, search = '', role, planTier } = options;

  let dbProfiles: UserProfile[] = [];
  let dbSubs: any[] = [];
  let dbPayments: any[] = [];
  let dbOrders: any[] = [];

  const supabase = createAdminClient();
  if (supabase) {
    try {
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

        const [subsRes, payRes, ordRes] = await Promise.all([
          supabase.from('subscriptions').select('*'),
          supabase.from('payments').select('*'),
          supabase.from('orders').select('*'),
        ]);

        dbSubs = subsRes.data || [];
        dbPayments = payRes.data || [];
        dbOrders = ordRes.data || [];
      }
    } catch {
      // fallback to mockDb
    }
  }

  // Fallback to disk if Supabase profiles are empty
  if (dbProfiles.length === 0) {
    mockDb.loadFromDisk();
    dbProfiles = [...mockDb.profiles];
    dbSubs = [...mockDb.subscriptions];
    dbPayments = [...mockDb.payments];
    dbOrders = [...mockDb.orders];

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

  let enriched: EnrichedUser[] = dbProfiles.map((u) => {
    const sub = dbSubs
      .filter((s) => s.user_id === u.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const hasActiveSub = sub && (sub.status === 'active' || sub.status === 'trialing');
    const currentPlan: PlanTier = hasActiveSub ? (sub.plan_type as PlanTier) : 'FREE';
    const isPaid = currentPlan !== 'FREE' && hasActiveSub;

    const userPayments = dbPayments.filter(
      (p) => p.user_id === u.id || (p.user_email && p.user_email.toLowerCase() === u.email.toLowerCase())
    );
    const userOrders = dbOrders.filter(
      (o) => o.user_id === u.id || (o.user_email && o.user_email.toLowerCase() === u.email.toLowerCase())
    );

    return {
      ...u,
      plan_tier: currentPlan,
      is_paid: isPaid,
      subscription_status: sub ? sub.status : 'free',
      subscription_end: sub ? sub.current_period_end : null,
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
    await saveUserSubscription({
      user_id: userId,
      plan_type: planTier,
      status: 'active',
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
    });
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
