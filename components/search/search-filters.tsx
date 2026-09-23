'use client';

import React from 'react';
import { SlidersHorizontal, ShieldCheck, Mail, Sparkles, Bookmark, Check } from 'lucide-react';
import { ACADEMIC_DOMAINS } from '@/lib/taxonomy/academic-taxonomy';
import { isCountryUnlockedForTier } from '@/lib/services/usage-service';
import { PlanTier } from '@/types/database';

export interface SearchFiltersProps {
  country: string;
  onCountryChange: (val: string) => void;
  countries: Array<{ name: string; code: string }>;
  selectedCountryObj: any;
  region: string;
  onRegionChange: (val: string) => void;
  availableRegions: string[];
  selectedDomain: string;
  onDomainChange: (val: string) => void;
  selectedDiscipline: string;
  onDisciplineChange: (val: string) => void;
  availableDisciplines: string[];
  customField: string;
  onCustomFieldChange: (val: string) => void;
  interdisciplinary: boolean;
  onInterdisciplinaryChange: (val: boolean) => void;
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (val: boolean) => void;
  emailVerifiedOnly: boolean;
  onEmailVerifiedOnlyChange: (val: boolean) => void;
  recruitingOnly: boolean;
  onRecruitingOnlyChange: (val: boolean) => void;
  savedOnly: boolean;
  onSavedOnlyChange: (val: boolean) => void;
  savedCount: number;
  userTier: PlanTier;
  onResetFilters: () => void;
}

export function SearchFilters({
  country,
  onCountryChange,
  countries,
  selectedCountryObj,
  region,
  onRegionChange,
  availableRegions,
  selectedDomain,
  onDomainChange,
  selectedDiscipline,
  onDisciplineChange,
  availableDisciplines,
  customField,
  onCustomFieldChange,
  interdisciplinary,
  onInterdisciplinaryChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  emailVerifiedOnly,
  onEmailVerifiedOnlyChange,
  recruitingOnly,
  onRecruitingOnlyChange,
  savedOnly,
  onSavedOnlyChange,
  savedCount,
  userTier,
  onResetFilters,
}: SearchFiltersProps) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" /> Filters
        </h2>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs text-slate-400 hover:text-white underline transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* 1. Country Selector */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-400">
          Country / Territory
        </label>
        <select
          value={country}
          onChange={e => onCountryChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="Global (All Countries)">
            Global (All 190+ Countries) {userTier === 'ELITE' ? '✅' : '🔒 Elite'}
          </option>
          {countries.map(c => {
            const isUnlocked = isCountryUnlockedForTier(userTier, c.name);
            return (
              <option key={c.code} value={c.name}>
                {c.name} {isUnlocked ? '✅' : '🔒 Pro'}
              </option>
            );
          })}
        </select>
      </div>

      {/* 2. Region / Province Selector */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-400">
          {selectedCountryObj ? selectedCountryObj.regionLabel : 'State / Province / Region'}
        </label>
        {availableRegions.length > 0 ? (
          <select
            value={region}
            onChange={e => onRegionChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All {selectedCountryObj?.regionLabel || 'Regions'}</option>
            {availableRegions.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={region}
            onChange={e => onRegionChange(e.target.value)}
            placeholder="e.g. Bavaria, Ontario, Tokyo"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        )}
      </div>

      {/* 3. Academic Domain Selector */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-400">Academic Domain</label>
        <select
          value={selectedDomain}
          onChange={e => {
            onDomainChange(e.target.value);
            onDisciplineChange('All Disciplines');
          }}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="All Domains">All Academic Domains</option>
          {ACADEMIC_DOMAINS.map(d => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Discipline Selector */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-400">Primary Field / Discipline</label>
        <select
          value={selectedDiscipline}
          onChange={e => onDisciplineChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="All Disciplines">All Disciplines</option>
          {availableDisciplines.map(disc => (
            <option key={disc} value={disc}>
              {disc}
            </option>
          ))}
        </select>
      </div>

      {/* 5. Custom / Novel Field Input */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-400">Research Area / Keyword</label>
        <input
          type="text"
          value={customField}
          onChange={e => onCustomFieldChange(e.target.value)}
          placeholder="e.g. CRISPR, Quantum Optomechanics, NLP"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* 6. Interdisciplinary Toggle */}
      <div className="pt-2 border-t border-slate-800">
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={interdisciplinary}
            onChange={e => onInterdisciplinaryChange(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Include Interdisciplinary Matches
          </span>
        </label>
        <p className="text-[11px] text-slate-400 ml-5 mt-0.5">
          Connects adjacent disciplines with shared methodologies.
        </p>
      </div>

      {/* 7. Verification Filter */}
      <div>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={e => onVerifiedOnlyChange(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Faculty Only
          </span>
        </label>
      </div>

      {/* 8. Institutional Email Filter */}
      <div>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={emailVerifiedOnly}
            onChange={e => onEmailVerifiedOnlyChange(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <Mail className="w-3.5 h-3.5 text-emerald-400" /> Public Institutional Email
          </span>
        </label>
      </div>

      {/* 9. Actively Recruiting Filter */}
      <div>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={recruitingOnly}
            onChange={e => onRecruitingOnlyChange(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Actively Recruiting
          </span>
        </label>
      </div>

      {/* 10. Saved Faculty Filter */}
      <div className="pt-2 border-t border-slate-800">
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={savedOnly}
            onChange={e => onSavedOnlyChange(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" /> Saved Faculty ({savedCount})
          </span>
        </label>
      </div>
    </div>
  );
}
