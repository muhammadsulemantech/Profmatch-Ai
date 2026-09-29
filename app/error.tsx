'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Search, ShieldCheck } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error captured in error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] bg-[#080B11] text-slate-100 flex items-center justify-center px-4 py-16 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 uppercase tracking-wider">
            <span>Runtime Exception</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
            Unexpected System Interruption
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            An unexpected error occurred while loading this scholarly view. Your profile and saved data remain securely intact.
          </p>
        </div>

        {error.message && process.env.NODE_ENV !== 'production' && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-red-300 text-left overflow-x-auto">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-colors min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Need assistance? Contact support@profmatch.ai</span>
        </div>
      </div>
    </div>
  );
}
