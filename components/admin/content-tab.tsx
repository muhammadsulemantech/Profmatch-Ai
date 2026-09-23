'use client';

import React from 'react';
import { Save, CreditCard, Plus, Trash2 } from 'lucide-react';
import { PricingPlan } from './pricing-tab';

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
              Academic Pricing Plans &amp; Subscriptions Manager
            </h3>
            <p className="text-xs text-slate-400">
              Update live prices, tier names, billing cycles, features, and call-to-actions across the entire platform in real-time.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddPlan}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Pricing Tier
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pricingPlans.map((plan, pIdx) => (
            <div
              key={pIdx}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 relative group"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Tier #{pIdx + 1}: {plan.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemovePlan(pIdx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={e => onUpdatePlan(pIdx, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tier Code</label>
                  <input
                    type="text"
                    value={plan.tier}
                    onChange={e => onUpdatePlan(pIdx, 'tier', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Price Label (e.g. $0, $19)</label>
                  <input
                    type="text"
                    value={plan.price}
                    onChange={e => onUpdatePlan(pIdx, 'price', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Billing Period (e.g. forever, per month)</label>
                  <input
                    type="text"
                    value={plan.period || ''}
                    onChange={e => onUpdatePlan(pIdx, 'period', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Plan Description</label>
                <textarea
                  rows={2}
                  value={plan.description}
                  onChange={e => onUpdatePlan(pIdx, 'description', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">CTA Button Label</label>
                  <input
                    type="text"
                    value={plan.cta || ''}
                    onChange={e => onUpdatePlan(pIdx, 'cta', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(plan.highlighted)}
                      onChange={e => onUpdatePlan(pIdx, 'highlighted', e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-300">Highlighted / Featured</span>
                  </label>
                </div>
              </div>

              {/* Bullet Point Features List */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Features List</span>
                  <button
                    type="button"
                    onClick={() => onAddFeature(pIdx)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Feature Bullet
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={e => onUpdateFeature(pIdx, fIdx, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveFeature(pIdx, fIdx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
