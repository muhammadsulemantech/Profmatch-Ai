'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  HelpCircle,
  Clock,
  Compass,
} from 'lucide-react';
import { ACADEMIC_PLANS, getCustomPlans } from '@/lib/services/usage-service';
import { useAuth } from '@/lib/auth/auth-context';

export default function ChoosePlanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    // 1. Instantly check localStorage custom plans
    try {
      const custom = getCustomPlans();
      if (custom && Object.keys(custom).length > 0) {
        const localPlans = Object.values(custom);
        if (localPlans.length >= 3) {
          setPlans(localPlans);
        }
      }
    } catch {}

    const refreshPlans = () => {
      fetch('/api/pricing')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.plans && data.plans.length > 0) {
            setPlans(data.plans);
          }
        })
        .catch(() => {});
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

  const freePlan = plans.find(p => p.tier === 'FREE') || {
    name: 'Free Explorer',
    badge: 'Preview Tier',
    pricePkr: 0,
    priceUsd: 0,
    description: 'Basic sample preview with restricted country access and limited searches.',
    features: [
      '2 Preview Countries (Pakistan, Germany)',
      '3 Faculty Searches Total',
      '2 Sample Email Outreach Drafts',
      'Worldwide professors blurred after limit',
      'No autonomous AutoPilot engine',
    ],
    ctaText: 'Continue Free',
    highlighted: false,
  };

  const starterPlan = plans.find(p => p.tier === 'STARTER') || {
    name: 'Scholar Starter',
    badge: 'Focused Intake',
    pricePkr: 3500,
    priceUsd: 12,
    description: 'Essential tools for graduate applicants targeting top 10 academic nations.',
    features: [
      '10+ Major Academic Countries (USA, UK, Canada, Germany, etc.)',
      '50 Grounded Searches / mo',
      '30 AI Cold Email Drafts / mo',
      'Basic AutoPilot (5 drafts/batch)',
      'Direct Institutional Email Access',
    ],
    ctaText: 'Get Starter',
    highlighted: false,
  };

  const proPlan = plans.find(p => p.tier === 'PRO') || {
    name: 'Pro Researcher',
    badge: 'Recommended for 2026/2027',
    pricePkr: 8000,
    priceUsd: 29,
    description: 'Broad international reach across 45+ countries with autonomous Gmail drafts.',
    features: [
      '45+ Global Destinations (Europe, US, UK, East Asia, Oceania)',
      '250 Grounded Searches / mo',
      '150 AI Grounded Drafts / mo',
      'Full AutoPilot (20 drafts/batch + Gmail)',
      'Phone & Lab Appointment Indexing',
    ],
    ctaText: 'Get Pro Researcher',
    highlighted: true,
  };

  const elitePlan = plans.find(p => p.tier === 'ELITE') || {
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
  };

  const isFreeHighlighted = Boolean(freePlan.highlighted);
  const isStarterHighlighted = Boolean(starterPlan.highlighted);
  const isProHighlighted = Boolean(proPlan.highlighted);
  const isEliteHighlighted = Boolean(elitePlan.highlighted);

  const handleContinueFree = () => {
    router.push('/search');
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-16 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Worldwide Global Announcement Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Globe className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Unrestricted Worldwide Academic Network</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
                Connect with Professors Across 190+ Countries
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                ProfMatch AI is not confined to 2 or 3 local destinations. We index accredited university faculties, public research labs, and verified contact registries across <strong>North America, Europe, Asia, Oceania, and Latin America</strong>.
              </p>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setCurrency('PKR')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currency === 'PKR'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇵🇰 PKR (Rs.)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currency === 'USD'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌐 USD ($)
              </button>
            </div>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight">
            Select Your Academic Outreach Tier
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Choose the package aligned with your graduate target cycle. Upgrade anytime with instant proof verification.
          </p>
        </div>

        {/* 4 Plans Grid (Free Explorer + 3 Paid Packages) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Plan 0: Free Explorer */}
          <div
            className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
              isFreeHighlighted
                ? 'bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 ring-1 ring-emerald-500/20'
                : 'bg-slate-900/40 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {isFreeHighlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider whitespace-nowrap shadow-md z-10">
                ⭐ Most Popular
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 uppercase tracking-wider mb-2">
                  {freePlan.badge || 'Preview Tier'}
                </div>
                <h3 className="text-lg font-heading font-bold text-white">{freePlan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">
                  {freePlan.description}
                </p>
              </div>

              <div className="py-3 border-y border-slate-800">
                <span className="text-3xl font-heading font-bold text-white">Free</span>
                <span className="text-xs text-slate-500 ml-1.5">forever</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {(freePlan.features || []).map((feat: string, i: number) => {
                  const isLocked = feat.toLowerCase().includes('blurred') || feat.toLowerCase().includes('no autonomous');
                  return (
                    <div key={i} className={`flex items-start gap-2 ${isLocked ? 'text-slate-500' : ''}`}>
                      {isLocked ? (
                        <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-500/70" />
                      ) : (
                        <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span>{feat}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinueFree}
              className={`mt-6 w-full py-2.5 rounded-xl text-center text-xs transition-all flex items-center justify-center gap-1.5 ${
                isFreeHighlighted
                  ? 'font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {freePlan.ctaText || 'Continue Free'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Plan 1: Scholar Starter */}
          <div
            className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
              isStarterHighlighted
                ? 'bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 ring-1 ring-emerald-500/20'
                : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {isStarterHighlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider whitespace-nowrap shadow-md z-10">
                ⭐ Most Popular
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider mb-2">
                  {starterPlan.badge || 'Focused Intake'}
                </div>
                <h3 className="text-lg font-heading font-bold text-white">{starterPlan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">
                  {starterPlan.description}
                </p>
              </div>

              <div className="py-3 border-y border-slate-800">
                <span className="text-3xl font-heading font-bold text-white">
                  {currency === 'PKR' ? `Rs. ${Number(starterPlan.pricePkr).toLocaleString()}` : `$${starterPlan.priceUsd}`}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">/ month</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {(starterPlan.features || []).map((feat: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/checkout?plan=starter&currency=${currency}`}
              className={`mt-6 w-full py-2.5 rounded-xl text-center text-xs transition-all flex items-center justify-center gap-1.5 ${
                isStarterHighlighted
                  ? 'font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {starterPlan.ctaText || 'Get Starter'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Plan 2: Pro Researcher */}
          <div
            className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
              isProHighlighted
                ? 'bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 ring-1 ring-emerald-500/20'
                : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {isProHighlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider whitespace-nowrap shadow-md z-10">
                ⭐ Most Popular
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider mb-2">
                  {proPlan.badge || 'Recommended for 2026/2027'}
                </div>
                <h3 className="text-lg font-heading font-bold text-white">{proPlan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">
                  {proPlan.description}
                </p>
              </div>

              <div className="py-3 border-y border-slate-800">
                <span className="text-3xl font-heading font-bold text-white">
                  {currency === 'PKR' ? `Rs. ${Number(proPlan.pricePkr).toLocaleString()}` : `$${proPlan.priceUsd}`}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">/ month</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {(proPlan.features || []).map((feat: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/checkout?plan=pro&currency=${currency}`}
              className={`mt-6 w-full py-2.5 rounded-xl text-center text-xs transition-all flex items-center justify-center gap-1.5 ${
                isProHighlighted
                  ? 'font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {proPlan.ctaText || 'Get Pro Researcher'} {isProHighlighted ? <Zap className="w-3.5 h-3.5 fill-slate-950" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </Link>
          </div>

          {/* Plan 3: PhD Elite (Worldwide Ultra) */}
          <div
            className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
              isEliteHighlighted
                ? 'bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 ring-1 ring-emerald-500/20'
                : 'bg-gradient-to-b from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 hover:border-teal-500/60'
            }`}
          >
            {isEliteHighlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider whitespace-nowrap shadow-md z-10">
                ⭐ Most Popular
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider mb-2">
                  {elitePlan.badge || '100% Worldwide Ultra'}
                </div>
                <h3 className="text-lg font-heading font-bold text-white">{elitePlan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">
                  {elitePlan.description}
                </p>
              </div>

              <div className="py-3 border-y border-slate-800">
                <span className="text-3xl font-heading font-bold text-white">
                  {currency === 'PKR' ? `Rs. ${Number(elitePlan.pricePkr).toLocaleString()}` : `$${elitePlan.priceUsd}`}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">/ month</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {(elitePlan.features || []).map((feat: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/checkout?plan=elite&currency=${currency}`}
              className={`mt-6 w-full py-2.5 rounded-xl text-center text-xs transition-all flex items-center justify-center gap-1.5 ${
                isEliteHighlighted
                  ? 'font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20'
              }`}
            >
              {elitePlan.ctaText || 'Get PhD Elite'} <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            </Link>
          </div>
        </div>

        {/* Manual Payment Proof Assurance Banner */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Local &amp; International Payment Options</p>
              <p className="text-[11px] text-slate-400">
                Pay with SadaPay, NayaPay, Meezan Bank, JazzCash, EasyPaisa, Wise, or USDT Crypto. Upload receipt for fast 1-2 hour activation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinueFree}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors underline whitespace-nowrap"
          >
            I want to test with Free Explorer first →
          </button>
        </div>
      </div>
    </div>
  );
}
