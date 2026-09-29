'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080B11] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900/90 p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Application Error
            </h1>
            <p className="text-xs text-slate-400">
              A critical error occurred while initializing the platform interface.
            </p>
          </div>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Interface
          </button>
        </div>
      </body>
    </html>
  );
}
