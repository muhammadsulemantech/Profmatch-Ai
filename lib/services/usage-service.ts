import { PlanTier } from '@/types/database';

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
    tagline: 'Unrestricted worldwide faculty indexing and unlimited autonomous outreach',
    pricePkr: 16000,
    priceUsd: 59,
    searchesLimit: 999999,
    draftsLimit: 999999,
    autopilotBatchLimit: 999999,
    allowedCountries: 'ALL',
    features: [
      '🌐 100% Worldwide Access (190+ Countries, All Global Universities)',
      'Unlimited Grounded Professor Searches',
      'Unlimited AI Grounded Personalized Email Drafts',
      'Priority Autonomous AutoPilot (Unlimited Batches)',
      'Direct Professor Email, Phone, Lab Grants & Office Indexing',
      'Dedicated 1-on-1 Academic Admissions & Verification Assistance',
    ],
  },
};

// Aliases for backwards compatibility
ACADEMIC_PLANS.STUDENT = ACADEMIC_PLANS.STARTER;

const SEARCH_USAGE_KEY = 'profmatch_search_usage_count';
const USER_TIER_OVERRIDE_KEY = 'profmatch_user_tier_override';

export function getEffectiveUserTier(userId?: string): PlanTier {
  if (typeof window === 'undefined') return 'FREE';

  try {
    // Check if there is an override in localStorage (e.g. after approval or testing)
    const override = localStorage.getItem(USER_TIER_OVERRIDE_KEY);
    if (override && (override === 'STARTER' || override === 'PRO' || override === 'ELITE' || override === 'STUDENT')) {
      return override as PlanTier;
    }

    // Check user cookie or auth object
    const cookieMatch = document.cookie.match(/profmatch_user=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      const parsed = JSON.parse(decodeURIComponent(cookieMatch[1]));
      if (parsed.role === 'ADMIN') return 'ELITE'; // Admins get full worldwide access
      if (parsed.plan_tier) return parsed.plan_tier;
      if (parsed.plan_type) return parsed.plan_type;
    }
  } catch {}

  return 'FREE';
}

export function setUserTierOverride(tier: PlanTier) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_TIER_OVERRIDE_KEY, tier);
  }
}

export function getPlanConfig(tier: PlanTier): PlanConfig {
  if (tier === 'STUDENT') return ACADEMIC_PLANS.STARTER;
  return ACADEMIC_PLANS[tier] || ACADEMIC_PLANS.FREE;
}

export function getSearchUsage(userId?: string): {
  used: number;
  limit: number;
  remaining: number;
  isExhausted: boolean;
  tier: PlanTier;
} {
  const tier = getEffectiveUserTier(userId);
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

  const limit = plan.searchesLimit;
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
