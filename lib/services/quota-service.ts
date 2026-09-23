import { mockDb } from '@/lib/supabase/mock-db';
import { ACADEMIC_PLANS, PlanConfig, isCountryUnlockedForTier } from '@/lib/services/usage-service';
import { PlanTier } from '@/types/database';

export interface QuotaCheckResult {
  allowed: boolean;
  error?: 'UPGRADE_REQUIRED' | 'QUOTA_EXCEEDED';
  message?: string;
  tier: PlanTier;
  limit?: number;
  used?: number;
  remaining?: number;
}

export function checkAndIncrementQuota(
  userId: string,
  feature: 'search' | 'draft' | 'autopilot' | 'analysis',
  options?: { country?: string; increment?: boolean }
): QuotaCheckResult {
  mockDb.loadFromDisk();
  const tier = mockDb.getUserPlanTier(userId);
  const plan: PlanConfig = ACADEMIC_PLANS[tier] || ACADEMIC_PLANS.FREE;
  const usage = mockDb.getUsageRecord(userId);
  const shouldIncrement = options?.increment !== false;

  // 1. Country restriction check (for searches or autopilot)
  if (options?.country && options.country !== 'Global (All Countries)') {
    const countryAllowed = isCountryUnlockedForTier(tier, options.country);
    if (!countryAllowed) {
      return {
        allowed: false,
        error: 'UPGRADE_REQUIRED',
        message: `Faculty in "${options.country}" is not accessible on the ${plan.name} (${tier}) tier. Please upgrade your subscription to unlock this destination.`,
        tier,
      };
    }
  }

  // 2. Feature-specific limits
  if (feature === 'search') {
    const limit = plan.searchesLimit;
    const used = usage.searches_count || 0;
    if (used >= limit) {
      return {
        allowed: false,
        error: 'QUOTA_EXCEEDED',
        message: `Search quota exceeded (${used}/${limit}). Please upgrade your plan for additional professor searches.`,
        tier,
        limit,
        used,
        remaining: 0,
      };
    }
    if (shouldIncrement) {
      mockDb.incrementUsage(userId, 'searches_count', 1);
    }
    return {
      allowed: true,
      tier,
      limit,
      used: shouldIncrement ? used + 1 : used,
      remaining: Math.max(0, limit - (shouldIncrement ? used + 1 : used)),
    };
  }

  if (feature === 'draft' || feature === 'analysis') {
    const limit = plan.draftsLimit;
    const used = usage.ai_generations_count || 0;
    if (used >= limit) {
      return {
        allowed: false,
        error: 'QUOTA_EXCEEDED',
        message: `AI generation quota exceeded (${used}/${limit}). Please upgrade your plan to generate more drafts and match analyses.`,
        tier,
        limit,
        used,
        remaining: 0,
      };
    }
    if (shouldIncrement) {
      mockDb.incrementUsage(userId, 'ai_generations_count', 1);
    }
    return {
      allowed: true,
      tier,
      limit,
      used: shouldIncrement ? used + 1 : used,
      remaining: Math.max(0, limit - (shouldIncrement ? used + 1 : used)),
    };
  }

  if (feature === 'autopilot') {
    if (plan.autopilotBatchLimit <= 0) {
      return {
        allowed: false,
        error: 'UPGRADE_REQUIRED',
        message: `AutoPilot outreach is unavailable on the ${plan.name} (${tier}) plan. Please upgrade to Scholar Starter or Pro Researcher.`,
        tier,
      };
    }
    const limit = plan.draftsLimit;
    const used = usage.ai_generations_count || 0;
    if (used >= limit) {
      return {
        allowed: false,
        error: 'QUOTA_EXCEEDED',
        message: `Outreach quota exceeded (${used}/${limit}). Please upgrade your plan for additional autonomous drafts.`,
        tier,
        limit,
        used,
        remaining: 0,
      };
    }
    return {
      allowed: true,
      tier,
      limit,
      used,
      remaining: Math.max(0, limit - used),
    };
  }

  return { allowed: true, tier };
}
