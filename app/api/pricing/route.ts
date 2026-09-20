import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { getSiteContentSection, updateSiteContent } from '@/lib/cms/content-service';
import { ACADEMIC_PLANS, PlanConfig } from '@/lib/services/usage-service';
import { verifyAdminSession } from '@/lib/auth/server-auth';

export async function GET() {
  try {
    mockDb.loadFromDisk();
    const pricingSection = await getSiteContentSection('pricing');
    const plans = pricingSection?.content?.plans || [
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
        features: [
          '45+ Global Destinations (Europe, US, UK, East Asia, Oceania)',
          '250 Grounded Searches / mo',
          '150 AI Grounded Drafts / mo',
          'Full AutoPilot (20 drafts/batch + Gmail)',
          'Phone & Lab Appointment Indexing',
        ],
        ctaText: 'Get Pro Researcher',
        ctaHref: '/checkout?plan=pro',
        highlighted: true,
      },
      {
        tier: 'ELITE',
        name: 'PhD Elite',
        tagline: 'Unrestricted worldwide access to all 190+ countries with high-capacity autonomous outreach.',
        badge: '100% WORLDWIDE ULTRA',
        pricePkr: 16000,
        priceUsd: 59,
        searchesLimit: 999999,
        draftsLimit: 999999,
        autopilotLimit: 500,
        features: [
          '🌐 100% Worldwide Access (190+ Countries)',
          'Unlimited Faculty Searches',
          'Unlimited AI Grounded Drafts',
          'AutoPilot Engine (Up to 500 Emails / mo)',
          'Direct Phone/Office & 1-on-1 Support',
        ],
        ctaText: 'Get PhD Elite',
        ctaHref: '/checkout?plan=elite',
        highlighted: false,
      },
    ];

    // Build map for quick access by tier key
    const plansMap: Record<string, any> = {};
    plans.forEach((p: any) => {
      const baseConfig = ACADEMIC_PLANS[p.tier as keyof typeof ACADEMIC_PLANS] || {};
      plansMap[p.tier] = {
        ...baseConfig,
        tier: p.tier,
        name: p.name,
        pricePkr: Number(p.pricePkr !== undefined ? p.pricePkr : baseConfig.pricePkr || 0),
        priceUsd: Number(p.priceUsd !== undefined ? p.priceUsd : baseConfig.priceUsd || 0),
        searchesLimit: p.searchesLimit !== undefined ? Number(p.searchesLimit) : baseConfig.searchesLimit,
        draftsLimit: p.draftsLimit !== undefined ? Number(p.draftsLimit) : baseConfig.draftsLimit,
        autopilotBatchLimit: p.autopilotLimit !== undefined ? Number(p.autopilotLimit) : baseConfig.autopilotBatchLimit,
        features: p.features || baseConfig.features,
        description: p.description || p.tagline || baseConfig.tagline,
        tagline: p.tagline || p.description || baseConfig.tagline,
        badge: p.badge || baseConfig.badge,
        highlighted: Boolean(p.highlighted),
      };
    });

    return NextResponse.json({
      success: true,
      plans,
      plansMap,
      updated_at: pricingSection?.updated_at || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API PRICING GET ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdminSession(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Administrative access required.' }, { status: 401 });
    }

    const body = await request.json();
    const { plans } = body;

    if (!Array.isArray(plans)) {
      return NextResponse.json({ success: false, error: 'plans array is required.' }, { status: 400 });
    }

    const updated = await updateSiteContent('pricing', {
      title: 'Simple, accessible academic plans.',
      subtitle: 'Start exploring global faculty for free; upgrade when launching multi-country active outreach campaigns.',
      content: {
        title: 'Simple, accessible academic plans.',
        subtitle: 'Start exploring global faculty for free; upgrade when launching multi-country active outreach campaigns.',
        plans,
      },
    });

    return NextResponse.json({ success: true, pricing: updated });
  } catch (error: any) {
    console.error('[API PRICING PUT ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
