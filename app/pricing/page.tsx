'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  MessageCircle,
} from 'lucide-react';
import { ACADEMIC_PLANS, getCustomPlans } from '@/lib/services/usage-service';

export default function PricingPage() {
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.plans && data.plans.length > 0) {
          setPlans(data.plans);
        }
      })
      .catch(() => {});
  }, []);

  const freePlan = plans.find(p => p.tier === 'FREE') || {
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
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-16 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Worldwide Global Announcement Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Globe className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Worldwide Academic Research Registry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
                Connect with Verified Faculty Across 190+ Countries
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                ProfMatch AI is not limited to 2 or 3 local destinations. We index accredited universities and faculty appointments across <strong>North America, Europe, the UK, Asia, Australia, and worldwide</strong>.
              </p>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setCurrency('PKR')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currency === 'PKR'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
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
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌐 USD ($)
              </button>
            </div>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400">
            <span>Academic Research Platform</span>
            <span>•</span>
            <span className="text-emerald-400">Transparent Flat Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading font-bold text-white tracking-tight">
            Fair Plans for Global Researchers &amp; Applicants
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Choose the plan that fits your intake stage. No surprise subscription lock-ins. Upgrade or downgrade anytime with instantaneous access activation.
          </p>
          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Institutional Directories</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Over <strong className="text-emerald-400">1,420+ MS &amp; PhD candidates</strong> matched with verified faculty worldwide.</span>
            </div>
          </div>
        </div>

        {/* 4 Plans Grid (Free Explorer + 3 Paid Packages) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Plan 0: Free Explorer */}
          <div className="rounded-2xl p-6 bg-slate-900/40 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 uppercase tracking-wider mb-2">
                  {freePlan.badge || 'Preview Tier'}
                </div>
                <h3 className="text-lg font-heading font-bold text-white">{freePlan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                  {freePlan.description || freePlan.tagline}
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

            <Link
              href="/signup"
              className="mt-6 w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              {freePlan.ctaText || 'Get Started Free'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Plan 1: Scholar Starter */}
          <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider mb-2">
                  {starterPlan.badge || 'Focused Intake'}
                </div>
                <h3 className="text-lg font-heading font-bold text-white">{starterPlan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                  {starterPlan.description || starterPlan.tagline}
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
              className="mt-6 w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              {starterPlan.ctaText || 'Get Starter'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Plan 2: Pro Researcher (⭐ Most Popular) */}
          <div className="rounded-2xl p-6 bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 flex flex-col justify-between transition-all relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider whitespace-nowrap shadow-md">
              ⭐ Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider mb-2">
                  {proPlan.badge || 'Recommended for 2026/2027'}
                </div>
                <h3 className="text-lg font-heading font-bold text-white">{proPlan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                  {proPlan.description || proPlan.tagline}
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
              className="mt-6 w-full py-2.5 rounded-xl text-center text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              {proPlan.ctaText || 'Get Pro Researcher'} <Zap className="w-3.5 h-3.5 fill-slate-950" />
            </Link>
          </div>

          {/* Plan 3: PhD Elite (Worldwide Ultra) */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 hover:border-teal-500/60 flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider mb-2">
                  {elitePlan.badge || '100% Worldwide Ultra'}
                </div>
                <h3 className="text-lg font-heading font-bold text-white">{elitePlan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                  {elitePlan.description || elitePlan.tagline}
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
              className="mt-6 w-full py-2.5 rounded-xl text-center text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              {elitePlan.ctaText || 'Get PhD Elite'} <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            </Link>
          </div>
        </div>

        {/* Local & Global Payment Channels Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-white text-sm sm:text-base">
                Flexible Payment Verification for Pakistani &amp; Global Students
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                We accept <strong>SadaPay, NayaPay, Meezan Bank (IBFT), JazzCash, EasyPaisa</strong> for Pakistan, and <strong>Wise Transfer, USDT Crypto (TRC-20), Credit Cards, PayPal</strong> worldwide. Upload receipt for quick 1-2 hour activation.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/923227342728?text=Hi%20ProfMatch%20AI%20Team%2C%20I%20have%20a%20question%20regarding%20Academic%20Plans%20and%20Payment."
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {/* Institutional Trust & Ethics Guarantee Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-10 space-y-6">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-white">
              The ProfMatch Academic Ethics &amp; Accuracy Commitment
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              We strictly enforce rate limits to protect faculty inboxes and maintain the highest academic reputation for our applicants. We never generate generic spam or guess unverified email addresses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-semibold text-xs text-white">100% Verifiable Records</div>
                <div className="text-[11px] text-slate-400">
                  Every faculty profile links directly to institutional homepages and official publications.
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-semibold text-xs text-white">Ethical Outreach Limits</div>
                <div className="text-[11px] text-slate-400">
                  Prevents automated mass emailing to uphold international graduate admissions integrity.
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-semibold text-xs text-white">1-to-2 Hour Activation</div>
                <div className="text-[11px] text-slate-400">
                  Manual slip verification processed promptly by our academic admissions operations team.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
