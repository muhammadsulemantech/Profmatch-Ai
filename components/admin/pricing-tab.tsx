'use client';

import React from 'react';
import { Sparkles, Plus, Save, Trash2 } from 'lucide-react';

export interface PricingPlan {
  name: string;
  tier: string;
  price: string;
  pricePkr?: number;
  priceUsd?: number;
  period?: string;
  description: string;
  features: string[];
  cta?: string;
  ctaText?: string;
  highlighted?: boolean;
  searchesLimit?: number;
  draftsLimit?: number;
  autopilotLimit?: number;
  badge?: string;
}

export interface PricingTabProps {
  pricingPlans: PricingPlan[];
  saving: boolean;
  onAddPlan: () => void;
  onRemovePlan: (index: number) => void;
  onUpdatePlan: (index: number, field: string, value: any) => void;
  onAddFeature: (planIndex: number) => void;
  onRemoveFeature: (planIndex: number, featureIndex: number) => void;
  onUpdateFeature: (planIndex: number, featureIndex: number, value: string) => void;
  onSavePricing: () => void;
}

export function PricingTab({
  pricingPlans,
  saving,
  onAddPlan,
  onRemovePlan,
  onUpdatePlan,
  onAddFeature,
  onRemoveFeature,
  onUpdateFeature,
  onSavePricing,
}: PricingTabProps) {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Global Subscription Configurator</span>
          </div>
          <h2 className="text-xl font-heading font-bold text-white">Academic Packages &amp; Pricing Management</h2>
          <p className="text-xs text-slate-400">
            Change prices (PKR &amp; USD), quotas, autopilot caps, or features for any tier. Changes sync instantly live to Homepage, /pricing, /choose-plan, and /checkout.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onAddPlan}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Custom Tier
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSavePricing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Publishing Changes...' : 'Save & Publish Packages Live'}
          </button>
        </div>
      </div>

      {/* 4 Packages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pricingPlans.map((plan, pIdx) => {
          const tierBadgeColor =
            plan.tier === 'FREE'
              ? 'bg-slate-800 text-slate-400'
              : plan.tier === 'STARTER'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : plan.tier === 'PRO'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-teal-500 text-slate-950 font-bold';

          return (
            <div
              key={pIdx}
              className={`p-6 rounded-2xl border space-y-5 transition-all relative ${
                plan.highlighted
                  ? 'bg-slate-900/90 border-emerald-500/60 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${tierBadgeColor}`}>
                    {plan.tier}
                  </span>
                  <span className="text-xs font-bold text-white">Tier #{pIdx + 1}</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plan.highlighted}
                      onChange={e => onUpdatePlan(pIdx, 'highlighted', e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>⭐ Highlighted / Popular</span>
                  </label>
                  {pricingPlans.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemovePlan(pIdx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Package Name</label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={e => onUpdatePlan(pIdx, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tier Key (e.g. FREE, STARTER, PRO, ELITE)</label>
                  <input
                    type="text"
                    value={plan.tier}
                    onChange={e => onUpdatePlan(pIdx, 'tier', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dual Currency & Pricing Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    🇵🇰 Price PKR (Rs.)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8000"
                    value={plan.pricePkr !== undefined ? plan.pricePkr : (plan.price.includes('3,500') ? 3500 : plan.price.includes('8,000') ? 8000 : plan.price.includes('16,000') ? 16000 : 0)}
                    onChange={e => {
                      const val = Number(e.target.value);
                      onUpdatePlan(pIdx, 'pricePkr', val);
                      const usdVal = plan.priceUsd || (val === 3500 ? 12 : val === 8000 ? 29 : val === 16000 ? 59 : 0);
                      onUpdatePlan(pIdx, 'price', val === 0 ? 'Free' : `Rs. ${val.toLocaleString()} / $${usdVal}`);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    🌐 Price USD ($)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 29"
                    value={plan.priceUsd !== undefined ? plan.priceUsd : (plan.price.includes('12') ? 12 : plan.price.includes('29') ? 29 : plan.price.includes('59') ? 59 : 0)}
                    onChange={e => {
                      const val = Number(e.target.value);
                      onUpdatePlan(pIdx, 'priceUsd', val);
                      const pkrVal = plan.pricePkr || (val === 12 ? 3500 : val === 29 ? 8000 : val === 59 ? 16000 : 0);
                      onUpdatePlan(pIdx, 'price', val === 0 ? 'Free' : `Rs. ${pkrVal.toLocaleString()} / $${val}`);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Display Label
                  </label>
                  <input
                    type="text"
                    value={plan.price}
                    onChange={e => onUpdatePlan(pIdx, 'price', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quotas & Limits Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Searches Quota
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50, 250, 999999"
                    value={plan.searchesLimit !== undefined ? plan.searchesLimit : (plan.tier === 'FREE' ? 3 : plan.tier === 'STARTER' ? 50 : plan.tier === 'PRO' ? 250 : 999999)}
                    onChange={e => onUpdatePlan(pIdx, 'searchesLimit', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    AI Drafts Limit
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 30, 150, 999999"
                    value={plan.draftsLimit !== undefined ? plan.draftsLimit : (plan.tier === 'FREE' ? 2 : plan.tier === 'STARTER' ? 30 : plan.tier === 'PRO' ? 150 : 999999)}
                    onChange={e => onUpdatePlan(pIdx, 'draftsLimit', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    AutoPilot Cap (Emails)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 0, 5, 20, 500"
                    value={plan.autopilotLimit !== undefined ? plan.autopilotLimit : (plan.tier === 'FREE' ? 0 : plan.tier === 'STARTER' ? 5 : plan.tier === 'PRO' ? 20 : 500)}
                    onChange={e => onUpdatePlan(pIdx, 'autopilotLimit', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Top Badge (e.g. Focused Intake, Recommended)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Focused Intake"
                    value={plan.badge || ''}
                    onChange={e => onUpdatePlan(pIdx, 'badge', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Get Starter"
                    value={plan.cta || plan.ctaText || ''}
                    onChange={e => {
                      onUpdatePlan(pIdx, 'cta', e.target.value);
                      onUpdatePlan(pIdx, 'ctaText', e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tagline / Short Summary</label>
                <textarea
                  rows={2}
                  value={plan.description}
                  onChange={e => onUpdatePlan(pIdx, 'description', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Bullet Features Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Feature Bullet Points ({plan.features.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => onAddFeature(pIdx)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Add Point
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Remove feature"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Save Action */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          disabled={saving}
          onClick={onSavePricing}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Publishing Changes Live...' : 'Save & Publish All Packages Live'}
        </button>
      </div>
    </div>
  );
}
