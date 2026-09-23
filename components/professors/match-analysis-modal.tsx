'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  RefreshCw,
  X,
  CheckCircle2,
  GraduationCap,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Professor } from '@/types/database';

export interface MatchAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  prof: Professor;
  matchData: any;
  isAnalyzing: boolean;
  analysisStage: string;
  analysisError: string | null;
  onReanalyze: () => void;
}

export function MatchAnalysisModal({
  isOpen,
  onClose,
  prof,
  matchData,
  isAnalyzing,
  analysisStage,
  analysisError,
  onReanalyze,
}: MatchAnalysisModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 my-auto">
        {/* Modal Header Decorative Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-500" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Real-time AI Match Analysis
                {isAnalyzing && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing live
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Deep semantic matching of your profile against {prof.name}&apos;s verified publications
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Animation Stage */}
        {isAnalyzing && (
          <div className="py-12 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Synthesizing Research Fit...</p>
              <p className="text-xs text-slate-400 font-mono animate-pulse">{analysisStage}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {analysisError && !isAnalyzing && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <p className="font-semibold">Analysis Notice:</p>
            <p>{analysisError}</p>
            <button
              type="button"
              onClick={onReanalyze}
              className="text-xs text-rose-200 underline hover:text-white font-medium"
            >
              Try Re-analyzing
            </button>
          </div>
        )}

        {/* Match Result Display */}
        {matchData && !isAnalyzing && (
          <div className="space-y-5 text-xs">
            {/* Top Score Banner */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Overall Alignment Fit
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {Math.round(matchData.overall_score * 100)}%
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Strong High-Priority Match</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Overlapping Topics & Papers */}
            {matchData.breakdown && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchData.breakdown.overlapping_topics?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">
                      Common Research Topics:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {matchData.breakdown.overlapping_topics.map((topic: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-200 border border-slate-800"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {matchData.breakdown.relevant_professor_papers?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">
                      Corresponding Faculty Papers:
                    </span>
                    <ul className="space-y-1 text-slate-300 text-[11px] pt-1">
                      {matchData.breakdown.relevant_professor_papers.slice(0, 2).map((paper: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-teal-400 font-bold">&bull;</span>
                          <span className="truncate">{paper}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Match Rationale */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" /> Grounded Analysis &amp; Thesis Alignment
              </h4>
              <p className="text-slate-300 leading-relaxed font-light">{matchData.explanation}</p>
            </div>

            {/* Strategic Advice */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
              <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Recommended Cold Email Hook
              </h4>
              <p className="text-slate-200 leading-relaxed font-light">
                {matchData.breakdown?.suggested_angle ||
                  `Highlight your thesis background directly in relation to ${prof.name}'s publications.`}
              </p>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Re-analyze in Real-Time
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <Link
              href={`/outreach/generate?professorId=${prof.id}`}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
            >
              Draft Email using this Analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
