'use client';

import React from 'react';
import { Award } from 'lucide-react';

interface AcademicHistorySectionProps {
  university: string;
  setUniversity: (v: string) => void;
  major: string;
  setMajor: (v: string) => void;
  cgpa: string;
  setCgpa: (v: string) => void;
  gradYear: number;
  setGradYear: (v: number) => void;
}

export function AcademicHistorySection({
  university,
  setUniversity,
  major,
  setMajor,
  cgpa,
  setCgpa,
  gradYear,
  setGradYear,
}: AcademicHistorySectionProps) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Award className="w-5 h-5 text-amber-400" />
        <h2 className="text-base font-bold text-white">Undergraduate / Current Academic Credentials</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Institution</label>
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Degree &amp; Major</label>
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cumulative GPA</label>
          <input
            type="text"
            value={cgpa}
            onChange={(e) => setCgpa(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expected Graduation Year</label>
          <input
            type="number"
            value={gradYear}
            onChange={(e) => setGradYear(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
