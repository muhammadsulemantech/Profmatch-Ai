'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DollarSign, ShieldCheck, ExternalLink, HelpCircle, X, Sparkles } from 'lucide-react';
import type { FacultyGrantInfo } from '@/lib/services/grant-service';

interface GrantFundingBadgeProps {
  profName: string;
  institutionName?: string;
}

export default function GrantFundingBadge({ profName, institutionName }: GrantFundingBadgeProps) {
  const [grant, setGrant] = useState<FacultyGrantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  useEffect(() => {
    let isMounted = true;

    async function fetchGrants() {
      try {
        const res = await fetch(
          `/api/professors/grants?name=${encodeURIComponent(profName)}&institution=${encodeURIComponent(
            institutionName || ''
          )}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && isMounted) {
            setGrant(json.data);
          }
        }
      } catch (err) {
        // Fall back gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchGrants();

    return () => {
      isMounted = false;
    };
  }, [profName, institutionName]);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400 animate-pulse">
        <DollarSign className="w-3.5 h-3.5 text-slate-500" />
        <span>Detecting Active Grants...</span>
      </div>
    );
  }

  if (!grant) return null;

  const isActive = grant.grantStatus === 'ACTIVE_GRANT';
  const isRecent = grant.grantStatus === 'RECENT_GRANT';

  const modalContent = isModalOpen && mounted ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="federal-grant-report-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsModalOpen(false);
        }
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl text-slate-100 space-y-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 id="federal-grant-report-title" className="font-bold text-white text-base">Federal Grant &amp; Funding Report</h3>
              <p className="text-[11px] text-slate-400">Verified US Federal Research Pipeline (NSF)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close report"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <span className="text-slate-400">Target Faculty:</span>
              <span className="font-semibold text-white sm:text-right break-words">{profName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <span className="text-slate-400">Funding Agency:</span>
              <span className="font-semibold text-emerald-400 sm:text-right">{grant.agency} (National Science Foundation)</span>
            </div>
            {grant.awardAmount && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                <span className="text-slate-400">Obligated Budget:</span>
                <span className="font-bold text-emerald-300 font-mono text-sm sm:text-right">{grant.awardAmount}</span>
              </div>
            )}
            {grant.validThrough && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                <span className="text-slate-400">Active Cycle Through:</span>
                <span className="font-semibold text-slate-200 sm:text-right">{grant.validThrough}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4">
              <span className="text-slate-400">PhD Sponsorship Likelihood:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] tracking-wide inline-block w-fit ${
                  grant.likelihoodToSponsorPhDs === 'HIGH'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                {grant.likelihoodToSponsorPhDs} PROBABILITY
              </span>
            </div>
          </div>

          {grant.awardTitle && (
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Award Title / Research Scope:</span>
              <p className="text-slate-200 italic p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 leading-relaxed break-words">
                &ldquo;{grant.awardTitle}&rdquo;
              </p>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Outreach Strategy Tip:
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Mentioning this active grant in your email shows you researched the professor’s current funded pipeline, increasing faculty response rates by up to 300%.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer text-center"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
          isActive
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/20'
            : isRecent
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-300'
        }`}
        title="Click to view verified federal research funding details"
      >
        <DollarSign className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : isRecent ? 'text-amber-400' : 'text-slate-500'}`} />
        <span>
          {isActive
            ? `Active ${grant.agency} Grant (${grant.awardAmount})`
            : isRecent
            ? `Recent ${grant.agency} Funding`
            : 'Departmental Funding'}
        </span>
        <span className="text-[10px] opacity-75 ml-0.5">ℹ</span>
      </button>

      {mounted && typeof document !== 'undefined' && modalContent
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
