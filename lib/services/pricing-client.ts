'use client';

import { useState, useEffect } from 'react';
import { getStoredCustomPlans } from '@/lib/services/usage-service';

export interface LivePlanItem {
  tier: 'FREE' | 'STARTER' | 'PRO' | 'ELITE' | string;
  name: string;
  badge?: string;
  pricePkr: number;
  priceUsd: number;
  description?: string;
  tagline?: string;
  features: string[];
  ctaText?: string;
  highlighted?: boolean;
}

const DEFAULT_PLANS: Record<string, LivePlanItem> = {
  FREE: {
    tier: 'FREE',
    name: 'Free Explorer',
    badge: 'Preview Tier',
    pricePkr: 0,
    priceUsd: 0,
    description: 'Basic preview of verified academic research records and faculty appointments.',
    features: [
      '2 Preview Countries (Pakistan, Germany)',
      '3 Grounded Faculty Searches Total',
      '2 AI Email Outreach Previews',
      'Worldwide professors blurred after limit',
      'No autonomous AutoPilot engine',
    ],
    ctaText: 'Get Started Free',
    highlighted: false,
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Scholar Starter',
    badge: 'Focused Intake',
    pricePkr: 3500,
    priceUsd: 12,
    description: 'Essential toolkit for targeted applications across 10+ major study destinations.',
    features: [
      '10+ Major Nations (incl. US, UK, Canada)',
      '50 Grounded Faculty Searches / mo',
      '30 AI Grounded Drafts / mo',
      'Basic AutoPilot (5 drafts / batch)',
      'Verified Institutional Emails',
    ],
    ctaText: 'Get Scholar Starter',
    highlighted: false,
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro Researcher',
    badge: 'Full International',
    pricePkr: 8000,
    priceUsd: 29,
    description: 'Comprehensive global outreach engine covering 45+ leading academic countries.',
    features: [
      '45+ Academic Countries Worldwide',
      '250 Grounded Faculty Searches / mo',
      '150 AI Grounded Drafts / mo',
      'Full AutoPilot (20 drafts/batch + Gmail)',
      'Phone & Lab Appointment Indexing',
    ],
    ctaText: 'Get Pro Researcher',
    highlighted: true,
  },
  ELITE: {
    tier: 'ELITE',
    name: 'PhD Elite',
    badge: '100% Worldwide Ultra',
    pricePkr: 16000,
    priceUsd: 59,
    description: 'Unrestricted worldwide access to all 190+ countries with high-capacity autonomous outreach.',
    features: [
      '🌐 100% Worldwide Access (190+ Countries)',
      'Unlimited Faculty Searches',
      'Unlimited AI Grounded Drafts',
      'AutoPilot Engine (Up to 500 Emails / mo)',
      'Direct Phone/Office & 1-on-1 Support',
    ],
    ctaText: 'Get PhD Elite',
    highlighted: false,
  },
};

export function useLivePricingPlans() {
  const [plans, setPlans] = useState<LivePlanItem[]>([]);

  useEffect(() => {
    try {
      const stored = getStoredCustomPlans();
      if (stored && Object.keys(stored).length > 0) {
        const localPlans = Object.values(stored) as unknown as LivePlanItem[];
        if (localPlans.length >= 3) {
          setPlans(localPlans);
        }
      }
    } catch {}

    const refreshPlans = async () => {
      try {
        const res = await fetch(`/api/pricing?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const incomingPlans =
          Array.isArray(data.plans) && data.plans.length > 0
            ? data.plans
            : Array.isArray(data.data?.plans) && data.data.plans.length > 0
            ? data.data.plans
            : null;
        if (incomingPlans && incomingPlans.length >= 3) {
          setPlans(incomingPlans);
        }
      } catch (err) {
        console.warn('Live pricing sync warning:', err);
      }
    };

    refreshPlans();

    const onPricingSync = () => refreshPlans();
    window.addEventListener('profmatch_pricing_updated', onPricingSync);
    window.addEventListener('storage', onPricingSync);

    return () => {
      window.removeEventListener('profmatch_pricing_updated', onPricingSync);
      window.removeEventListener('storage', onPricingSync);
    };
  }, []);

  const freePlan = plans.find((p) => p.tier === 'FREE') || DEFAULT_PLANS.FREE;
  const starterPlan = plans.find((p) => p.tier === 'STARTER') || DEFAULT_PLANS.STARTER;
  const proPlan = plans.find((p) => p.tier === 'PRO') || DEFAULT_PLANS.PRO;
  const elitePlan = plans.find((p) => p.tier === 'ELITE') || DEFAULT_PLANS.ELITE;

  return { plans, freePlan, starterPlan, proPlan, elitePlan };
}
