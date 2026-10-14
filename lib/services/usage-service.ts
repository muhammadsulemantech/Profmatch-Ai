import type { PlanTier } from '../../types/database.ts';
import { mockDb } from '../supabase/mock-db.ts';

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  badge?: string;
  tagline: string;
  pricePkr: number;
  priceUsd: number;
  searchesLimit: number; // e.g. 3 for FREE, 50 for STARTER, 250 for PRO, Infinity for ELITE
  draftsLimit: number;
  autopilotBatchLimit: number;
  allowedCountries: 'ALL' | string[];
  features: string[];
  highlighted?: boolean;
  ctaText?: string;
}

export const ACADEMIC_PLANS: Record<string, PlanConfig> = {
  FREE: {
    tier: 'FREE',
    name: 'Free Explorer',
    tagline: 'Basic preview of verified academic research records',
    pricePkr: 0,
    priceUsd: 0,
    searchesLimit: 3,
    draftsLimit: 2,
    autopilotBatchLimit: 0,
    allowedCountries: ['Pakistan', 'Germany'],
    features: [
      'Preview faculty in 2 Selected Countries (Pakistan, Germany)',
      '3 Grounded Faculty Searches Total',
      '2 AI Email Outreach Previews',
      'Basic University Directory View',
      'Results blur when search quota is reached',
    ],
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Scholar Starter',
    tagline: 'Ideal for focused graduate applicants targeting top destinations',
    pricePkr: 3500,
    priceUsd: 12,
    searchesLimit: 50,
    draftsLimit: 30,
    autopilotBatchLimit: 5,
    allowedCountries: [
      'Pakistan',
      'Germany',
      'United States',
      'United Kingdom',
      'Canada',
      'Australia',
      'France',
      'Italy',
      'Sweden',
      'Netherlands',
    ],
    features: [
      'Access 10+ Major Academic Countries',
      '50 Grounded Professor Searches / month',
      '30 AI Grounded Cold Email Drafts / month',
      'Basic AutoPilot Engine (5 drafts per batch)',
      'Direct Verified Institutional Email Access',
      'Cross-department discipline matching',
    ],
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro Researcher',
    badge: 'MOST POPULAR FOR 2026/2027 INTAKE',
    tagline: 'Comprehensive global reach for MS and PhD applicants',
    pricePkr: 8000,
    priceUsd: 29,
    searchesLimit: 250,
    draftsLimit: 150,
    autopilotBatchLimit: 20,
    allowedCountries: [
      'Pakistan',
      'Germany',
      'United States',
      'United Kingdom',
      'Canada',
      'Australia',
      'France',
      'Italy',
      'Sweden',
      'Netherlands',
      'Switzerland',
      'Japan',
      'South Korea',
      'Singapore',
      'Norway',
      'Denmark',
      'Finland',
      'Belgium',
      'Austria',
      'New Zealand',
      'Ireland',
      'Spain',
      'China',
      'Hong Kong',
      'Taiwan',
      'Saudi Arabia',
      'United Arab Emirates',
      'Qatar',
      'Turkey',
      'Malaysia',
      'Poland',
      'Czech Republic',
      'Portugal',
      'Brazil',
      'South Africa',
      'Estonia',
      'Hungary',
      'Greece',
      'Chile',
      'Mexico',
      'Iceland',
      'Luxembourg',
    ],
    features: [
      '45+ Top Global Destinations (Europe, US, UK, Canada, Australia, Asia)',
      '250 Grounded Professor Searches / month',
      '150 AI Grounded Personalized Outreach Drafts / month',
      'Full AutoPilot Engine (20 drafts / batch + Gmail Sync)',
      'Phone, Office & Lab Appointment Indexing',
      'Priority Faculty Verification & Recent Papers Scraper',
    ],
  },
  ELITE: {
    tier: 'ELITE',
    name: 'PhD Elite (Worldwide Ultra)',
    badge: '100% UNRESTRICTED WORLDWIDE ACCESS',
    tagline: 'Unrestricted worldwide faculty indexing and high-capacity autonomous outreach',
    pricePkr: 16000,
    priceUsd: 59,
    searchesLimit: 999999,
    draftsLimit: 999999,
    autopilotBatchLimit: 500,
    allowedCountries: 'ALL',
    features: [
      '🌐 100% Worldwide Access (190+ Countries, All Global Universities)',
      'Unlimited Grounded Professor Searches',
      'Unlimited AI Grounded Personalized Email Drafts',
      'AutoPilot Outreach Engine (Up to 500 Emails / month)',
      'Direct Professor Email, Phone, Lab Grants & Office Indexing',
      'Dedicated 1-on-1 Academic Admissions & Verification Assistance',
    ],
  },
};

// Aliases for backwards compatibility
ACADEMIC_PLANS.STUDENT = ACADEMIC_PLANS.STARTER;

const SEARCH_USAGE_KEY = 'profmatch_search_usage_count';

export function getEffectiveUserTier(userTier?: PlanTier | string): PlanTier {
  if (userTier && (userTier === 'STARTER' || userTier === 'PRO' || userTier === 'ELITE' || userTier === 'STUDENT')) {
    return userTier === 'STUDENT' ? 'STARTER' : (userTier as PlanTier);
  }
  return 'FREE';
}

let liveServerPlans: Record<string, PlanConfig> | null = null;

export function updateLiveServerPlans(plans: Record<string, Partial<PlanConfig>> | any[]) {
  if (Array.isArray(plans)) {
    const map: Record<string, PlanConfig> = {};
    plans.forEach((p: any) => {
      const tierKey = String(p.tier || 'FREE').toUpperCase();
      const base = ACADEMIC_PLANS[tierKey] || ACADEMIC_PLANS.FREE;
      map[tierKey] = {
        ...base,
        tier: tierKey as PlanTier,
        name: p.name || base.name,
        badge: p.badge || base.badge,
        tagline: p.tagline || p.description || base.tagline,
        pricePkr: Number(p.pricePkr !== undefined ? p.pricePkr : base.pricePkr),
        priceUsd: Number(p.priceUsd !== undefined ? p.priceUsd : base.priceUsd),
        searchesLimit: Number(p.searchesLimit !== undefined ? p.searchesLimit : base.searchesLimit),
        draftsLimit: Number(p.draftsLimit !== undefined ? p.draftsLimit : base.draftsLimit),
        autopilotBatchLimit: Number(
          p.autopilotLimit !== undefined
            ? p.autopilotLimit
            : (p.autopilotBatchLimit !== undefined ? p.autopilotBatchLimit : base.autopilotBatchLimit)
        ),
        allowedCountries: p.allowedCountries || base.allowedCountries,
        features: Array.isArray(p.features) ? p.features : base.features,
        highlighted: Boolean(p.highlighted),
        ctaText: p.ctaText || p.cta || base.ctaText,
      };
    });
    liveServerPlans = map;
  } else if (typeof plans === 'object' && plans !== null) {
    liveServerPlans = { ...(liveServerPlans || ACADEMIC_PLANS), ...(plans as any) };
  }
}

export function getStoredCustomPlans(): Record<string, PlanConfig> | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('profmatch_custom_plans');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

export function getCustomPlans(): Record<string, PlanConfig> {
  const stored = getStoredCustomPlans();
  if (stored) {
    return { ...ACADEMIC_PLANS, ...stored };
  }
  return liveServerPlans || ACADEMIC_PLANS;
}

export function saveCustomPlans(plans: Record<string, Partial<PlanConfig>>) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredCustomPlans() || {};
      const updated = { ...ACADEMIC_PLANS, ...existing, ...plans };
      localStorage.setItem('profmatch_custom_plans', JSON.stringify(updated));
    } catch {}
  }
}

export function getPlanConfig(tier: PlanTier): PlanConfig {
  const normTier = tier === 'STUDENT' ? 'STARTER' : tier;

  if (liveServerPlans && liveServerPlans[normTier]) {
    return liveServerPlans[normTier];
  }

  if (typeof window === 'undefined') {
    try {
      mockDb.loadFromDisk();
      const pricingPlans = mockDb.siteContent?.pricing?.content?.plans;
      if (Array.isArray(pricingPlans) && pricingPlans.length > 0) {
        updateLiveServerPlans(pricingPlans);
        if (liveServerPlans && liveServerPlans[normTier]) {
          return liveServerPlans[normTier];
        }
      }
    } catch {}
  }

  const plans = getCustomPlans();
  return plans[normTier] || ACADEMIC_PLANS[normTier] || ACADEMIC_PLANS.FREE;
}

export async function syncLivePricingFromServer(): Promise<Record<string, PlanConfig>> {
  if (typeof window === 'undefined') return ACADEMIC_PLANS;
  try {
    const res = await fetch('/api/pricing');
    if (res.ok) {
      const data = await res.json();
      if (data.plansMap) {
        saveCustomPlans(data.plansMap);
        return { ...ACADEMIC_PLANS, ...data.plansMap };
      }
    }
  } catch (err) {
    console.warn('[PRICING SYNC NOTICE]', err);
  }
  return getCustomPlans();
}

export function getSearchUsage(
  userIdOrTier?: string,
  explicitTier?: PlanTier | string
): {
  used: number;
  limit: number;
  remaining: number;
  isExhausted: boolean;
  tier: PlanTier;
} {
  let tier: PlanTier = 'FREE';
  let userId: string | undefined = undefined;

  const validTiers = ['FREE', 'STARTER', 'PRO', 'ELITE', 'STUDENT'];
  if (userIdOrTier && validTiers.includes(userIdOrTier.toUpperCase())) {
    tier = getEffectiveUserTier(userIdOrTier);
  } else {
    userId = userIdOrTier;
    if (explicitTier) {
      tier = getEffectiveUserTier(explicitTier);
    }
  }

  // If tier is still FREE and window is defined, check stored active plan
  if (tier === 'FREE' && typeof window !== 'undefined' && userId) {
    try {
      const storedTier = localStorage.getItem(`profmatch_user_tier_${userId}`);
      if (storedTier && validTiers.includes(storedTier.toUpperCase())) {
        tier = getEffectiveUserTier(storedTier);
      }
    } catch {}
  }

  const plan = getPlanConfig(tier);

  let used = 0;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${SEARCH_USAGE_KEY}_${userId || 'anon'}`);
      if (stored) {
        used = parseInt(stored, 10) || 0;
      }
    } catch {}
  }

  const limit = Number(plan.searchesLimit !== undefined ? plan.searchesLimit : 3);
  const remaining = Math.max(0, limit - used);
  const isExhausted = used >= limit;

  return { used, limit, remaining, isExhausted, tier };
}

export function incrementSearchUsage(userId?: string): number {
  if (typeof window === 'undefined') return 1;

  try {
    const key = `${SEARCH_USAGE_KEY}_${userId || 'anon'}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    const next = current + 1;
    localStorage.setItem(key, next.toString());
    return next;
  } catch {
    return 1;
  }
}

export function resetSearchUsage(userId?: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`${SEARCH_USAGE_KEY}_${userId || 'anon'}`);
    } catch {}
  }
}

export function isCountryUnlockedForTier(tier: PlanTier, countryName: string): boolean {
  if (!countryName || countryName === 'Global (All Countries)') {
    // Free & Starter users only have access to specific countries, not the entire global pool
    return tier === 'ELITE';
  }

  const plan = getPlanConfig(tier);
  if (plan.allowedCountries === 'ALL') return true;

  return plan.allowedCountries.some(
    c => c.toLowerCase() === countryName.trim().toLowerCase()
  );
}
