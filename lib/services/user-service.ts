import { mockDb } from '@/lib/supabase/mock-db';
import { createAdminClient } from '@/lib/supabase/admin';
import { saveUserProfile, saveUserSubscription } from './db-service';
import { ACADEMIC_PLANS } from './usage-service';
import type {
  UserProfile,
  StudentProfile,
  AcademicProfile,
  ResearchProfile,
  StudentProject,
  StudentSkill,
  PlanTier,
  UserRole,
} from '@/types/database';

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
  mockDb.loadFromDisk();

  let enriched: EnrichedUser[] = mockDb.profiles.map((u) => {
    const sub = mockDb.subscriptions
      .filter((s) => s.user_id === u.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const hasActiveSub = sub && sub.status === 'active';
    const currentPlan: PlanTier = hasActiveSub ? sub.plan_type : 'FREE';
    const isPaid = currentPlan !== 'FREE' && hasActiveSub;

    const userPayments = mockDb.payments.filter(
      (p) => p.user_id === u.id || p.user_email?.toLowerCase() === u.email.toLowerCase()
    );
    const userOrders = mockDb.orders.filter(
      (o) => o.user_id === u.id || o.user_email?.toLowerCase() === u.email.toLowerCase()
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

  if (search) {
    const term = search.toLowerCase().trim();
    enriched = enriched.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        (u.full_name && u.full_name.toLowerCase().includes(term))
    );
  }

  if (role) {
    enriched = enriched.filter((u) => u.role === role);
  }

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
  mockDb.loadFromDisk();

  const profile = mockDb.profiles.find((p) => p.id === userId);
  if (!profile) {
    throw new Error('User not found.');
  }

  if (planTier) {
    const validTiers = Object.keys(ACADEMIC_PLANS);
    if (!validTiers.includes(planTier)) {
      throw new Error(`Invalid plan tier: "${planTier}". Valid tiers are: ${validTiers.join(', ')}`);
    }
  }

  if (role) profile.role = role;
  if (isSuspended !== undefined) {
    profile.is_suspended = Boolean(isSuspended);
    profile.suspension_reason = suspensionReason || null;
  }
  profile.updated_at = new Date().toISOString();

  if (planTier) {
    await saveUserSubscription({
      user_id: userId,
      plan_type: planTier,
      status: 'active',
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
    });
  }

  if (role || isSuspended !== undefined) {
    await saveUserProfile({
      id: userId,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      is_suspended: profile.is_suspended,
      suspension_reason: profile.suspension_reason,
    });
  }

  mockDb.persist();
  return profile;
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
