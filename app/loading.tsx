import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 animate-pulse">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/40 border-t-transparent animate-spin" />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          ProfMatch AI
        </p>
        <p className="text-xs text-slate-400">
          Loading scholarly records and verified directories...
        </p>
      </div>
    </div>
  );
}
