'use client';

import React from 'react';
import { Save, CreditCard, Plus } from 'lucide-react';
import { PricingPlan, PricingPlansGrid } from './pricing-tab';

export interface HeroContent {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
}

export interface ContentTabProps {
  heroContent: HeroContent;
  setHeroContent: (content: HeroContent) => void;
  pricingPlans: PricingPlan[];
  saving: boolean;
  onSaveContent: () => void;
  onAddPlan: () => void;
  onRemovePlan: (index: number) => void;
  onUpdatePlan: (index: number, field: string, value: any) => void;
  onAddFeature: (planIndex: number) => void;
  onRemoveFeature: (planIndex: number, featureIndex: number) => void;
  onUpdateFeature: (planIndex: number, featureIndex: number, value: string) => void;
}

export function ContentTab({
  heroContent,
  setHeroContent,
  pricingPlans,
  saving,
  onSaveContent,
  onAddPlan,
  onRemovePlan,
  onUpdatePlan,
  onAddFeature,
  onRemoveFeature,
  onUpdateFeature,
}: ContentTabProps) {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white">Homepage &amp; Global Editorial CMS</h2>
          <p className="text-xs text-slate-400">Modify headline copy, call-to-actions, and global value propositions.</p>
        </div>
        <button
          onClick={onSaveContent}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? 'Publishing...' : 'Publish Content'}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Pill Badge</label>
          <input
            type="text"
            value={heroContent.badge}
            onChange={e => setHeroContent({ ...heroContent, badge: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Main Title (H1)</label>
          <input
            type="text"
            value={heroContent.title}
            onChange={e => setHeroContent({ ...heroContent, title: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Subtitle Paragraph</label>
          <textarea
            rows={3}
            value={heroContent.subtitle}
            onChange={e => setHeroContent({ ...heroContent, subtitle: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary CTA Button Label</label>
          <input
            type="text"
            value={heroContent.primaryCta}
            onChange={e => setHeroContent({ ...heroContent, primaryCta: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* PRICING PLANS EDITABLE CMS SECTION */}
      <div className="pt-8 border-t border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Academic Pricing Packages &amp; Subscriptions Manager
            </h3>
            <p className="text-xs text-slate-400">
              Update live prices (PKR &amp; USD), quotas, autopilot caps, or features for any tier. Changes sync live across Homepage, /pricing, /choose-plan, and /checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddPlan}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom Tier
          </button>
        </div>

        <PricingPlansGrid
          pricingPlans={pricingPlans}
          onRemovePlan={onRemovePlan}
          onUpdatePlan={onUpdatePlan}
          onAddFeature={onAddFeature}
          onRemoveFeature={onRemoveFeature}
          onUpdateFeature={onUpdateFeature}
        />
      </div>
    </div>
  );
}
