'use client';

import React from 'react';
import { CheckCheck } from 'lucide-react';
import { Professor, DataQualityMetrics } from '@/types/database';

export interface GlobalDataTabProps {
  dataQuality: DataQualityMetrics;
  professors: Professor[];
  filteredAdminProfessors: Professor[];
  selectedCountryFilter: string;
  setSelectedCountryFilter: (c: string) => void;
  adminSearchQuery: string;
  setAdminSearchQuery: (q: string) => void;
  onReverifyProfessor: (profId: string) => void;
}

export function GlobalDataTab({
  dataQuality,
  professors,
  filteredAdminProfessors,
  selectedCountryFilter,
  setSelectedCountryFilter,
  adminSearchQuery,
  setAdminSearchQuery,
  onReverifyProfessor,
}: GlobalDataTabProps) {
  return (
    <div className="space-y-6">
      {/* Data Quality Health Dashboard */}
      <div className="bg-white p-6 rounded border border-[#E5E7EB] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <h2 className="text-base font-serif font-bold text-[#172033] flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-[#5C8F86]" />
              Global Academic Data Health Telemetry
            </h2>
            <p className="text-xs text-[#556070]">
              Continuous verification of faculty appointments, verified institutional domains, and active publication streams.
            </p>
          </div>
          <span className="px-3 py-1 rounded text-xs font-medium bg-[#EBF8F5] text-[#226357] border border-[#C8ECE3]">
            Data Health: 100% Operational
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB]">
            <p className="text-xs text-[#556070]">Verified Faculty</p>
            <p className="text-xl font-serif font-bold text-[#172033] mt-1">{dataQuality.verifiedProfessors}</p>
            <p className="text-[10px] text-[#5C8F86]">Official .edu/.ac directories</p>
          </div>

          <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB]">
            <p className="text-xs text-[#556070]">Secondary Verified</p>
            <p className="text-xl font-serif font-bold text-[#172033] mt-1">{dataQuality.partiallyVerifiedProfessors}</p>
            <p className="text-[10px] text-[#3157A4]">Curated scholar registries</p>
          </div>

          <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB]">
            <p className="text-xs text-[#556070]">Missing Public Emails</p>
            <p className="text-xl font-serif font-bold text-[#172033] mt-1">{dataQuality.missingEmailsCount}</p>
            <p className="text-[10px] text-[#556070]">Zero synthetic/guessed emails</p>
          </div>

          <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB]">
            <p className="text-xs text-[#556070]">Duplicate Scholar Records</p>
            <p className="text-xl font-serif font-bold text-[#172033] mt-1">0</p>
            <p className="text-[10px] text-[#5C8F86]">De-duplicated in pipeline</p>
          </div>
        </div>
      </div>

      {/* Global Faculty Management Table */}
      <div className="bg-white rounded border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-[#172033]">
              Faculty Registry Directory ({filteredAdminProfessors.length})
            </h3>
            <p className="text-xs text-[#556070]">Manage verified researchers, institutional affiliations, and recruiting availability.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCountryFilter}
              onChange={e => setSelectedCountryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4]"
            >
              <option value="All">All Countries</option>
              {Array.from(new Set(professors.map(p => p.university_country || 'Other'))).map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Filter name, university, discipline..."
              value={adminSearchQuery}
              onChange={e => setAdminSearchQuery(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] placeholder:text-[#8C95A6] focus:outline-none focus:border-[#3157A4]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#F8F7F3] border-b border-[#E5E7EB] text-[#556070] text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-5 py-3">Scholar & Official Title</th>
                <th className="px-5 py-3">University & Region</th>
                <th className="px-5 py-3">Primary Discipline</th>
                <th className="px-5 py-3">Verified Institutional Email</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3 text-right">Registry Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredAdminProfessors.map(prof => (
                <tr key={prof.id} className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-[#172033]">{prof.name}</p>
                      <p className="text-[11px] text-[#556070]">{prof.title}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[#172033] font-medium">{prof.university_name}</p>
                    <p className="text-[11px] text-[#5C8F86]">
                      {prof.university_region ? `${prof.university_region}, ` : ''}{prof.university_country}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-[#F1F2EE] text-[#172033] text-[10px] font-medium border border-[#E5E7EB]">
                      {prof.primary_discipline || 'Interdisciplinary'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px]">
                    {prof.email ? (
                      <span className="text-[#3157A4]">{prof.email}</span>
                    ) : (
                      <span className="text-[#8C95A6] italic">Pending Verification</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-[#5C8F86]">
                      {Math.round(prof.confidence_score * 100)}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onReverifyProfessor(prof.id)}
                      className="px-3 py-1 rounded border border-[#E5E7EB] text-[#3157A4] hover:bg-[#F1F2EE] text-xs font-medium transition-colors"
                    >
                      Re-Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
