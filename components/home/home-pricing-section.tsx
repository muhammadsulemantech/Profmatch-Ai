'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  MessageCircle,
} from 'lucide-react';

interface HomePricingSectionProps {
  initialPlans?: any[];
}

export default function HomePricingSection({ initialPlans }: HomePricingSectionProps) {
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');

  return (
    <section id="pricing" className="py-24 bg-slate-950/70 border-b border-slate-800/80 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Worldwide Global Announcement Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Globe className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Worldwide Academic Research Registry</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
                Connect with Verified Faculty Across 190+ Countries
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                ProfMatch AI is not limited to 2 or 3 local destinations. We index accredited universities and faculty appointments across <strong>North America, Europe, the UK, Asia, Australia, and worldwide</strong>.
              </p>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-2 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
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

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Transparent Pricing
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Simple, accessible academic plans.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Start exploring global faculty for free; upgrade when launching multi-country active outreach campaigns.
          </p>
        </div>

        {/* 4 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Plan 0: Free Explorer */}
          <div className="rounded-2xl p-6 bg-slate-900/40 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 uppercase tracking-wider mb-2">
                  Preview Tier
                </div>
                <h3 className="text-lg font-heading font-bold text-white">Free Explorer</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                  Basic sample preview with restricted country access and limited searches.
                </p>
              </div>

              <div className="py-3 border-y border-slate-800">
                <span className="text-3xl font-heading font-bold text-white">Free</span>
                <span className="text-xs text-slate-500 ml-1.5">forever</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>2 Preview Countries (Pakistan, Germany)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>3 Grounded Faculty Searches Total</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>2 Sample Email Outreach Drafts</span>
                </div>
                <div className="flex items-start gap-2 text-slate-500">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-500/70" />
                  <span>Worldwide professors blurred after limit</span>
                </div>
                <div className="flex items-start gap-2 text-slate-500">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-500/70" />
                  <span>No autonomous AutoPilot engine</span>
                </div>
              </div>
            </div>

            <Link
              href="/signup"
              className="mt-6 w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              Get Started Free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Plan 1: Scholar Starter */}
          <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider mb-2">
                  Focused Intake
                </div>
                <h3 className="text-lg font-heading font-bold text-white">Scholar Starter</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                  Essential tools for graduate applicants targeting top 10 academic nations.
                </p>
              </div>

              <div className="py-3 border-y border-slate-800">
                <span className="text-3xl font-heading font-bold text-white">
                  {currency === 'PKR' ? 'Rs. 3,500' : '$12'}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">/ month</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>10+ Major Academic Countries</strong> (USA, UK, Canada, Germany, etc.)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>50 Grounded Searches</strong> / mo</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>30 AI Cold Email Drafts</strong> / mo</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Basic AutoPilot (5 drafts/batch)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Direct Institutional Email Access</span>
                </div>
              </div>
            </div>

            <Link
              href={`/checkout?plan=starter&currency=${currency}`}
              className="mt-6 w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              Get Starter <ArrowRight className="w-3.5 h-3.5" />
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
                  Recommended for 2026/2027
                </div>
                <h3 className="text-lg font-heading font-bold text-white">Pro Researcher</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                  Broad international reach across 45+ countries with autonomous Gmail drafts.
                </p>
              </div>

              <div className="py-3 border-y border-slate-800">
                <span className="text-3xl font-heading font-bold text-white">
                  {currency === 'PKR' ? 'Rs. 8,000' : '$29'}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">/ month</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>45+ Global Destinations</strong> (Europe, US, UK, East Asia, Oceania)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>250 Grounded Searches</strong> / mo</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>150 AI Grounded Drafts</strong> / mo</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Full AutoPilot (20 drafts/batch + Gmail)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Phone &amp; Lab Appointment Indexing</span>
                </div>
              </div>
            </div>

            <Link
              href={`/checkout?plan=pro&currency=${currency}`}
              className="mt-6 w-full py-2.5 rounded-xl text-center text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              Get Pro Researcher <Zap className="w-3.5 h-3.5 fill-slate-950" />
            </Link>
          </div>

          {/* Plan 3: PhD Elite (Worldwide Ultra) */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 hover:border-teal-500/60 flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider mb-2">
                  100% Worldwide Ultra
                </div>
                <h3 className="text-lg font-heading font-bold text-white">PhD Elite</h3>
                <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                  Unrestricted worldwide access to all 190+ countries with high-capacity autonomous outreach.
                </p>
              </div>

              <div className="py-3 border-y border-slate-800">
                <span className="text-3xl font-heading font-bold text-white">
                  {currency === 'PKR' ? 'Rs. 16,000' : '$59'}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">/ month</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>🌐 <strong>100% Worldwide Access (190+ Countries)</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Unlimited</strong> Faculty Searches</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Unlimited</strong> AI Grounded Drafts</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>AutoPilot Engine</strong> (Up to 500 Emails / mo)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Direct Phone/Office &amp; 1-on-1 Support</span>
                </div>
              </div>
            </div>

            <Link
              href={`/checkout?plan=elite&currency=${currency}`}
              className="mt-6 w-full py-2.5 rounded-xl text-center text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              Get PhD Elite <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
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
      </div>
    </section>
  );
}
