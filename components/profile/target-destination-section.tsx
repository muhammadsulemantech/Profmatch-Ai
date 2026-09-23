'use client';

import React from 'react';
import { GraduationCap, Globe, Layers } from 'lucide-react';
import { ACADEMIC_DOMAINS } from '@/lib/taxonomy/academic-taxonomy';

interface TargetDestinationSectionProps {
  targetDegree: string;
  setTargetDegree: (v: string) => void;
  targetCountry: string;
  setTargetCountry: (v: string) => void;
  targetRegion: string;
  setTargetRegion: (v: string) => void;
  academicDomain: string;
  setAcademicDomain: (v: string) => void;
  desiredField: string;
  setDesiredField: (v: string) => void;
  fundingPref: string;
  setFundingPref: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  countries: any[];
  selectedCountryObj: any;
  availableRegions: string[];
}

export function TargetDestinationSection({
  targetDegree,
  setTargetDegree,
  targetCountry,
  setTargetCountry,
  targetRegion,
  setTargetRegion,
  academicDomain,
  setAcademicDomain,
  desiredField,
  setDesiredField,
  fundingPref,
  setFundingPref,
  bio,
  setBio,
  countries,
  selectedCountryObj,
  availableRegions,
}: TargetDestinationSectionProps) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <GraduationCap className="w-5 h-5 text-emerald-400" />
        <h2 className="text-base font-bold text-white">Target Academic Destination</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Academic Degree</label>
          <select
            value={targetDegree}
            onChange={(e) => setTargetDegree(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="PhD">Ph.D. (Doctor of Philosophy / Doctorate)</option>
            <option value="MS">M.S. / M.Sc. (Master of Science with Thesis)</option>
            <option value="MA">M.A. (Master of Arts)</option>
            <option value="MPhil">M.Phil. (Master of Philosophy)</option>
            <option value="Postdoc">Postdoctoral Fellowship</option>
            <option value="Research Internship">Visiting / Research Internship</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" /> Target Destination Country
          </label>
          <select
            value={targetCountry}
            onChange={(e) => {
              setTargetCountry(e.target.value);
              setTargetRegion('');
            }}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name} ({c.continent})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target {selectedCountryObj ? selectedCountryObj.regionLabel : 'Region / Province / State'}
          </label>
          {availableRegions.length > 0 ? (
            <select
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Regions</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              placeholder="e.g. Zurich, Tokyo, Ontario, Bavaria"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Overarching Academic Domain
          </label>
          <select
            value={academicDomain}
            onChange={(e) => setAcademicDomain(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {ACADEMIC_DOMAINS.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Desired Research Discipline / Sub-field</label>
          <input
            type="text"
            value={desiredField}
            onChange={(e) => setDesiredField(e.target.value)}
            placeholder="e.g. Sustainable Urbanism, Molecular Assays, Econometrics"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Funding Requirement</label>
          <select
            value={fundingPref}
            onChange={(e) => setFundingPref(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Fully Funded (RA/TA)">Fully Funded (Research Assistantship / Teaching Assistantship)</option>
            <option value="Fellowship / Scholarship">External Fellowship / Government Scholarship</option>
            <option value="Self / Partial">Self-Funded or Partial</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Bio &amp; Statement of Purpose Summary</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
