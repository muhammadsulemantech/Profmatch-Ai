'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Globe, Zap } from 'lucide-react';

export interface PaywallBannerProps {
  isCountryLocked: boolean;
  isGlobalLocked: boolean;
  country: string;
  onUnlock: () => void;
}

export function PaywallBanner({
  isCountryLocked,
  isGlobalLocked,
  country,
  onUnlock,
}: PaywallBannerProps) {
  return (
    <div className="sticky top-28 z-20 my-6 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-xl w-full bg-slate-950/95 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-emerald-500/25 backdrop-blur-2xl space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Globe className="w-3.5 h-3.5" />
            <span>Worldwide Academic Access Restricted</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
            {isCountryLocked
              ? `${country} Faculty Records Are Locked in Free Tier`
              : isGlobalLocked
              ? 'Global 190+ Countries Discovery Requires Pro / Elite'
              : 'Free Search Quota Reached (3 / 3 Searches Used)'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            {isCountryLocked
              ? `Free Explorer tier allows previewing Germany and Pakistan. To view verified faculty appointments, public .edu/.ac emails, and AI outreach drafts in ${country}, please upgrade to Scholar Starter, Pro, or Elite.`
              : 'Your free tier quota has been reached. To unlock full verified faculty records, official university emails, and autonomous email drafts, please upgrade your academic plan.'}
          </p>
        </div>

        {/* 3 Package Comparison Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Starter</span>
            <p className="text-xs font-bold text-white">Rs. 3,500 / mo</p>
            <p className="text-[10px] text-slate-400">10 Major Countries</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-1 relative shadow-sm">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">⭐ Pro (Popular)</span>
            <p className="text-xs font-bold text-white">Rs. 8,000 / mo</p>
            <p className="text-[10px] text-slate-300">45+ Destinations &bull; AutoPilot</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">PhD Elite</span>
            <p className="text-xs font-bold text-white">Rs. 16,000 / mo</p>
            <p className="text-[10px] text-slate-400">100% Worldwide &bull; Unlimited</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onUnlock}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-slate-950" /> Unlock Worldwide Access Now
          </button>
          <Link
            href="/choose-plan"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all text-center"
          >
            Compare All Packages →
          </Link>
        </div>
      </div>
    </div>
  );
}
