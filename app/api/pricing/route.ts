import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSiteContentSection, updateSiteContent } from '@/lib/cms/content-service';
import { ACADEMIC_PLANS, updateLiveServerPlans } from '@/lib/services/usage-service';
import { assertAdmin } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const DEFAULT_PLANS = [
  {
    tier: 'FREE',
    name: 'Free Explorer',
    tagline: 'Basic preview of verified academic research records and faculty appointments.',
    badge: 'PREVIEW TIER',
    pricePkr: 0,
    priceUsd: 0,
    searchesLimit: 3,
    draftsLimit: 2,
    autopilotLimit: 0,
    autopilotBatchLimit: 0,
    features: [
      '2 Preview Countries (Pakistan, Germany)',
      '3 Grounded Faculty Searches Total',
      '2 AI Email Outreach Previews',
      'Worldwide professors blurred after limit',
      'No autonomous AutoPilot engine',
    ],
    ctaText: 'Get Started Free',
    ctaHref: '/search',
    highlighted: false,
  },
  {
    tier: 'STARTER',
    name: 'Scholar Starter',
    tagline: 'Essential tools for graduate applicants targeting top 10 academic nations.',
    badge: 'FOCUSED INTAKE',
    pricePkr: 3500,
    priceUsd: 12,
    searchesLimit: 50,
    draftsLimit: 30,
    autopilotLimit: 5,
    autopilotBatchLimit: 5,
    features: [
      '10+ Major Academic Countries (USA, UK, Canada, Germany, etc.)',
      '50 Grounded Searches / mo',
      '30 AI Cold Email Drafts / mo',
      'Basic AutoPilot (5 drafts/batch)',
      'Direct Institutional Email Access',
    ],
    ctaText: 'Get Starter',
    ctaHref: '/checkout?plan=starter',
    highlighted: false,
  },
  {
    tier: 'PRO',
    name: 'Pro Researcher',
    tagline: 'Broad international reach across 45+ countries with autonomous Gmail drafts.',
    badge: 'RECOMMENDED FOR 2026/2027',
    pricePkr: 8000,
    priceUsd: 29,
    searchesLimit: 250,
    draftsLimit: 150,
    autopilotLimit: 20,
    autopilotBatchLimit: 20,
    features: [
      'All 45+ Academic Countries (Europe, Asia, Americas, Australasia)',
      '250 Grounded Searches / mo',
      '150 AI Personalized Grounded Drafts / mo',
      'Autonomous AutoPilot (20 emails/batch)',
      'Deep Research Alignment Match Scoring',
      'Gmail OAuth One-Click Drafts & Dispatch',
      'Email Tracking & Analytics',
    ],
    ctaText: 'Upgrade to Pro',
    ctaHref: '/checkout?plan=pro',
    highlighted: true,
  },
  {
    tier: 'ELITE',
    name: 'PhD Elite',
    tagline: 'Comprehensive doctoral candidate suite with priority indexing and personal review.',
    badge: 'MAXIMUM ADMISSIONS CHANCES',
    pricePkr: 16000,
    priceUsd: 59,
    searchesLimit: 999999,
    draftsLimit: 999999,
    autopilotLimit: 500,
    autopilotBatchLimit: 500,
    features: [
      'Global Unrestricted University Database',
      'Unlimited Searches / mo',
      'Unlimited AI Grounded Drafts',
      'AutoPilot Engine (Up to 500 Emails / mo)',
      'Direct Phone/Office & 1-on-1 Support',
    ],
    ctaText: 'Get PhD Elite',
    ctaHref: '/checkout?plan=elite',
    highlighted: false,
  },
];

export async function GET() {
  try {
    const pricingSection = await getSiteContentSection('pricing');
    const rawPlans = pricingSection?.content?.plans;
    const plans = Array.isArray(rawPlans) && rawPlans.length > 0 ? rawPlans : DEFAULT_PLANS;

    const normalizedPlans = plans.map((p: any) => {
      const tierKey = (p.tier || 'FREE').toUpperCase();
      const baseConfig = ACADEMIC_PLANS[tierKey] || ACADEMIC_PLANS.FREE;
      const autoLimit = p.autopilotLimit !== undefined 
        ? Number(p.autopilotLimit) 
        : (p.autopilotBatchLimit !== undefined ? Number(p.autopilotBatchLimit) : baseConfig.autopilotBatchLimit);

      return {
        ...baseConfig,
        ...p,
        tier: tierKey,
        name: p.name || baseConfig.name,
        tagline: p.tagline || p.description || baseConfig.tagline,
        description: p.description || p.tagline || baseConfig.tagline,
        badge: p.badge || baseConfig.badge,
        pricePkr: Number(p.pricePkr !== undefined ? p.pricePkr : baseConfig.pricePkr || 0),
        priceUsd: Number(p.priceUsd !== undefined ? p.priceUsd : baseConfig.priceUsd || 0),
        searchesLimit: Number(p.searchesLimit !== undefined ? p.searchesLimit : baseConfig.searchesLimit),
        draftsLimit: Number(p.draftsLimit !== undefined ? p.draftsLimit : baseConfig.draftsLimit),
        autopilotLimit: autoLimit,
        autopilotBatchLimit: autoLimit,
        features: Array.isArray(p.features) ? p.features : baseConfig.features,
        highlighted: Boolean(p.highlighted),
        ctaText: p.ctaText || p.cta || 'Get Started',
      };
    });

    const plansMap: Record<string, any> = {};
    normalizedPlans.forEach((p: any) => {
      plansMap[p.tier] = p;
    });

    // Sync live in-memory server cache
    updateLiveServerPlans(normalizedPlans);

    return apiSuccess({
      plans: normalizedPlans,
      plansMap,
      updated_at: pricingSection?.updated_at || new Date().toISOString(),
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch pricing', 500);
  }
}

const UpdatePricingSchema = z.object({
  plans: z.array(z.record(z.any())),
});

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const parsed = UpdatePricingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid pricing update', 400);
    }

    const cleanPlans = parsed.data.plans.map((p: any) => {
      const tierKey = String(p.tier || 'FREE').toUpperCase();
      const baseConfig = ACADEMIC_PLANS[tierKey] || ACADEMIC_PLANS.FREE;
      const autoLimit = p.autopilotLimit !== undefined 
        ? Number(p.autopilotLimit) 
        : (p.autopilotBatchLimit !== undefined ? Number(p.autopilotBatchLimit) : baseConfig.autopilotBatchLimit);

      return {
        ...baseConfig,
        ...p,
        tier: tierKey,
        name: p.name || baseConfig.name,
        price: p.price || (p.pricePkr ? `Rs. ${Number(p.pricePkr).toLocaleString()} / $${p.priceUsd || 0}` : 'Free'),
        pricePkr: Number(p.pricePkr !== undefined ? p.pricePkr : baseConfig.pricePkr || 0),
        priceUsd: Number(p.priceUsd !== undefined ? p.priceUsd : baseConfig.priceUsd || 0),
        searchesLimit: Number(p.searchesLimit !== undefined ? p.searchesLimit : baseConfig.searchesLimit),
        draftsLimit: Number(p.draftsLimit !== undefined ? p.draftsLimit : baseConfig.draftsLimit),
        autopilotLimit: autoLimit,
        autopilotBatchLimit: autoLimit,
        features: Array.isArray(p.features) ? p.features : baseConfig.features,
        description: p.description || p.tagline || baseConfig.tagline,
        tagline: p.tagline || p.description || baseConfig.tagline,
        badge: p.badge || baseConfig.badge,
        highlighted: Boolean(p.highlighted),
        ctaText: p.cta || p.ctaText || 'Get Started',
      };
    });

    const updated = await updateSiteContent('pricing', {
      title: 'Simple, accessible academic plans.',
      subtitle: 'Start exploring global faculty for free; upgrade when launching multi-country active outreach campaigns.',
      content: {
        title: 'Simple, accessible academic plans.',
        subtitle: 'Start exploring global faculty for free; upgrade when launching multi-country active outreach campaigns.',
        plans: cleanPlans,
      },
    });

    // Update server live memory
    updateLiveServerPlans(cleanPlans);

    return apiSuccess({ pricing: updated, plans: cleanPlans });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update pricing', 500);
  }
}
