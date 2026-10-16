import {
  syncGetUserPlanTier,
  syncGetUsageRecord,
  syncIncrementUsage,
  getUserPlanTier,
  getUsageRecord,
  incrementUsage,
} from './db-service.ts';
import { ACADEMIC_PLANS, isCountryUnlockedForTier, getPlanConfig } from './usage-service.ts';
import type { PlanConfig } from './usage-service.ts';
import type { PlanTier } from '../../types/database.ts';

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
  options?: { country?: string; increment?: boolean; tier?: PlanTier }
): QuotaCheckResult {
  const tier = options?.tier || syncGetUserPlanTier(userId);
  const plan: PlanConfig = getPlanConfig(tier);
  const usage = syncGetUsageRecord(userId);
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
      syncIncrementUsage(userId, 'searches_count', 1);
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
      syncIncrementUsage(userId, 'ai_generations_count', 1);
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
    const autopilotCap = Number(plan.autopilotBatchLimit !== undefined ? plan.autopilotBatchLimit : 0);
    if (autopilotCap <= 0) {
      return {
        allowed: false,
        error: 'UPGRADE_REQUIRED',
        message: `AutoPilot outreach is unavailable on the ${plan.name} (${tier}) plan. Please upgrade to Scholar Starter or Pro Researcher.`,
        tier,
      };
    }
    const limit = autopilotCap;
    const used = usage.autopilot_count || 0;
    if (used >= limit) {
      return {
        allowed: false,
        error: 'QUOTA_EXCEEDED',
        message: `AutoPilot outreach cap reached (${used}/${limit} emails). Your active ${plan.name} (${tier}) plan allows up to ${limit} AutoPilot emails. Please upgrade your plan for additional autonomous outreach.`,
        tier,
        limit,
        used,
        remaining: 0,
      };
    }
    if (shouldIncrement) {
      syncIncrementUsage(userId, 'autopilot_count', 1);
      syncIncrementUsage(userId, 'emails_sent_count', 1);
    }
    return {
      allowed: true,
      tier,
      limit,
      used: shouldIncrement ? used + 1 : used,
      remaining: Math.max(0, limit - (shouldIncrement ? used + 1 : used)),
    };
  }

  return { allowed: true, tier };
}

export async function checkAndIncrementQuotaAsync(
  userId: string,
  feature: 'search' | 'draft' | 'autopilot' | 'analysis',
  options?: { country?: string; increment?: boolean; tier?: PlanTier }
): Promise<QuotaCheckResult> {
  const tier = options?.tier || await getUserPlanTier(userId);
  const plan: PlanConfig = getPlanConfig(tier);
  const usage = await getUsageRecord(userId);
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
      await incrementUsage(userId, 'searches_count', 1);
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
      await incrementUsage(userId, 'ai_generations_count', 1);
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
    const autopilotCap = Number(plan.autopilotBatchLimit !== undefined ? plan.autopilotBatchLimit : 0);
    if (autopilotCap <= 0) {
      return {
        allowed: false,
        error: 'UPGRADE_REQUIRED',
        message: `AutoPilot outreach is unavailable on the ${plan.name} (${tier}) plan. Please upgrade to Scholar Starter or Pro Researcher.`,
        tier,
      };
    }
    const limit = autopilotCap;
    const used = usage.autopilot_count || 0;
    if (used >= limit) {
      return {
        allowed: false,
        error: 'QUOTA_EXCEEDED',
        message: `AutoPilot outreach cap reached (${used}/${limit} emails). Your active ${plan.name} (${tier}) plan allows up to ${limit} AutoPilot emails. Please upgrade your plan for additional autonomous outreach.`,
        tier,
        limit,
        used,
        remaining: 0,
      };
    }
    if (shouldIncrement) {
      await incrementUsage(userId, 'autopilot_count', 1);
      await incrementUsage(userId, 'emails_sent_count', 1);
    }
    return {
      allowed: true,
      tier,
      limit,
      used: shouldIncrement ? used + 1 : used,
      remaining: Math.max(0, limit - (shouldIncrement ? used + 1 : used)),
    };
  }

  return { allowed: true, tier };
}
