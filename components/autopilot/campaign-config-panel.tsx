'use client';

import React from 'react';
import {
  Globe,
  GraduationCap,
  Clock,
  ShieldCheck,
  FileText,
  Pause,
  Play,
  Square,
} from 'lucide-react';

interface CountryOption {
  code: string;
  name: string;
}

export type EngineStatus =
  | 'IDLE'
  | 'SEARCHING'
  | 'DRAFTING'
  | 'SAVING_DRAFT'
  | 'SENDING'
  | 'COOLDOWN'
  | 'PAUSED'
  | 'COMPLETED';

interface CampaignConfigPanelProps {
  countries: CountryOption[];
  targetCountry: string;
  setTargetCountry: (v: string) => void;
  targetDegree: string;
  setTargetDegree: (v: string) => void;
  discipline: string;
  setDiscipline: (v: string) => void;
  keywordsText: string;
  setKeywordsText: (v: string) => void;
  batchLimit: number;
  setBatchLimit: (v: number) => void;
  cooldownSec: number;
  setCooldownSec: (v: number) => void;
  tone: 'academic' | 'concise' | 'inquisitive';
  setTone: (v: 'academic' | 'concise' | 'inquisitive') => void;
  hasAuthorized: boolean;
  setHasAuthorized: (v: boolean) => void;
  engineStatus: EngineStatus;
  isRunning: boolean;
  onLaunch: () => void;
  onPause: () => void;
  onResume: () => void;
  onAbort: () => void;
}

export function CampaignConfigPanel({
  countries,
  targetCountry,
  setTargetCountry,
  targetDegree,
  setTargetDegree,
  discipline,
  setDiscipline,
  keywordsText,
  setKeywordsText,
  batchLimit,
  setBatchLimit,
  cooldownSec,
  setCooldownSec,
  tone,
  setTone,
  hasAuthorized,
  setHasAuthorized,
  engineStatus,
  isRunning,
  onLaunch,
  onPause,
  onResume,
  onAbort,
}: CampaignConfigPanelProps) {
  return (
    <div className="space-y-6">
      {/* Campaign Configuration Form */}
      <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            1. Campaign Parameters
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">Gmail Safe Mode</span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-xs">Safety Guaranteed: Draft Mode Only</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Safe &amp; Reviewable
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              AI discovers verified faculty and prepares personalized research drafts directly inside your Gmail Drafts folder. You can review and click Send whenever you choose.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" /> Target Destination Country
            </label>
            <select
              value={targetCountry}
              disabled={isRunning}
              onChange={(e) => setTargetCountry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="Worldwide">Worldwide (Global Universities)</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Target Degree
              </label>
              <select
                value={targetDegree}
                disabled={isRunning}
                onChange={(e) => setTargetDegree(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value="PhD">Ph.D. / Doctorate</option>
                <option value="MS">M.S. with Thesis</option>
                <option value="Postdoc">Postdoctoral Fellowship</option>
                <option value="Internship">Research Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Batch Limit</label>
              <select
                value={batchLimit}
                disabled={isRunning}
                onChange={(e) => setBatchLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value={5}>5 Professors (Test Run)</option>
                <option value={10}>10 Professors (Standard)</option>
                <option value={20}>20 Professors (Targeted)</option>
                <option value={35}>35 Professors (Aggressive)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Academic Discipline</label>
            <input
              type="text"
              value={discipline}
              disabled={isRunning}
              onChange={(e) => setDiscipline(e.target.value)}
              placeholder="e.g. Artificial Intelligence, Bioinformatics, Quantum Physics"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Research Focus Keywords <span className="text-slate-500">(Used by Gemini AI for Paper Matching)</span>
            </label>
            <textarea
              rows={2}
              value={keywordsText}
              disabled={isRunning}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="e.g. LLM Reasoning, Graph Neural Networks, Multi-Hop QA"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Anti-Spam Delay
              </label>
              <select
                value={cooldownSec}
                disabled={isRunning}
                onChange={(e) => setCooldownSec(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds (Safe Recommended)</option>
                <option value={90}>90 seconds (Ultra-Safe)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Outreach Tone</label>
              <select
                value={tone}
                disabled={isRunning}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value="academic">Academic &amp; Formal</option>
                <option value="concise">Direct &amp; Concise</option>
                <option value="inquisitive">Publication-Centric</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Safeguard & Launch Card */}
      <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">2. One-Time Authorization</h2>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasAuthorized}
              onChange={(e) => setHasAuthorized(e.target.checked)}
              disabled={isRunning}
              className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 shrink-0"
            />
            <span className="text-slate-300 leading-relaxed text-[11px]">
              <strong className="text-white">One-Time Safeguard Consent:</strong> I authorize ProfMatch AI to
              autonomously search verified global professors matching my research criteria, synthesize personalized
              academic emails with Gemini AI, and prepare reviewable drafts directly in my Gmail account.
            </span>
          </label>
        </div>

        {/* Action Trigger Buttons */}
        <div className="pt-2">
          {engineStatus === 'IDLE' || engineStatus === 'COMPLETED' ? (
            <button
              type="button"
              onClick={onLaunch}
              disabled={!hasAuthorized}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              Launch AutoPilot (Create {batchLimit} Gmail Drafts)
            </button>
          ) : isRunning ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPause}
                className="flex-1 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" /> Pause AutoPilot
              </button>
              <button
                type="button"
                onClick={onAbort}
                className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResume}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <Play className="w-4 h-4" /> Resume Campaign
              </button>
              <button
                type="button"
                onClick={onAbort}
                className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Abort
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
