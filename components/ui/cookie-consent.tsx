'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('profmatch_cookie_consent');
      if (!consent) {
        // Small delay so it appears smoothly without layout thrashing
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('profmatch_cookie_consent', 'accepted_all');
    } catch {}
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem('profmatch_cookie_consent', 'essential_only');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      role="region"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#0B0F19]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl shadow-black/80 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-tight">Academic Privacy &amp; Cookies</h4>
              <p className="text-[10px] text-emerald-400 font-medium">Zero tracking for external ad networks</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEssentialOnly}
            aria-label="Close cookie consent notice"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed font-light">
          We use strictly essential authentication cookies and local research session state to remember your shortlisted professors and drafts. Review our{' '}
          <Link href="/privacy" className="text-emerald-400 underline hover:text-emerald-300 font-medium">
            Privacy Policy
          </Link>.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/15 transition-all text-center min-h-[38px]"
          >
            Accept Cookies
          </button>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors text-center min-h-[38px]"
          >
            Essential Only
          </button>
        </div>
      </div>
    </aside>
  );
}
