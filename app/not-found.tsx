import React from 'react';
import Link from 'next/link';
import { Search, Home, GraduationCap, ArrowRight, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Page Not Found (404) — ProfMatch AI',
  description: 'The requested faculty profile, research unit, or directory page could not be located.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-[#080B11] text-slate-100 flex items-center justify-center px-4 py-16 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Glow badge */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-slate-900 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-2xl shadow-emerald-500/10">
            <GraduationCap className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
            404
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Academic Route Not Located</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight">
            Scholarly Resource Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The faculty record, departmental directory, or application file you were seeking does not exist or may have been updated.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all min-h-[44px]"
          >
            <Search className="w-4 h-4" />
            Search Verified Faculty
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-colors min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            Return to Homepage
          </Link>
        </div>

        {/* Quick Nav Suggestions */}
        <div className="pt-8 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Popular Research Destinations
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <Link
              href="/pricing"
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 text-slate-300 hover:text-white transition-all flex flex-col items-center gap-1.5 min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Academic Plans</span>
            </Link>
            <Link
              href="/dashboard"
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 text-slate-300 hover:text-white transition-all flex flex-col items-center gap-1.5 min-h-[44px]"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Workspace</span>
            </Link>
            <Link
              href="/tracker"
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 text-slate-300 hover:text-white transition-all flex flex-col items-center gap-1.5 min-h-[44px]"
            >
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span>Tracker</span>
            </Link>
            <Link
              href="/faq"
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 text-slate-300 hover:text-white transition-all flex flex-col items-center gap-1.5 min-h-[44px]"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>FAQs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
