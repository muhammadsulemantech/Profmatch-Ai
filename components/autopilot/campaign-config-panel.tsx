'use client';

import React, { useState } from 'react';
import {
  Globe,
  GraduationCap,
  Clock,
  ShieldCheck,
  FileText,
  Pause,
  Play,
  Square,
  Paperclip,
  UploadCloud,
  Upload,
  X,
  CheckCircle2,
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
  attachedDocument?: {
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
  } | null;
  profileCv?: {
    name: string;
    size: number;
  } | null;
  onAttachProfileCv?: () => void;
  onDocumentUpload: (file: File) => void;
  onRemoveDocument: () => void;
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
  attachedDocument,
  profileCv,
  onAttachProfileCv,
  onDocumentUpload,
  onRemoveDocument,
  hasAuthorized,
  setHasAuthorized,
  engineStatus,
  isRunning,
  onLaunch,
  onPause,
  onResume,
  onAbort,
}: CampaignConfigPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
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

          {/* Document / CV Attachment Section */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5 text-xs">
                <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attach Academic CV / Document</span>
                <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
              </label>
              {attachedDocument && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Attached
                </span>
              )}
            </div>

            {attachedDocument ? (
              <div className="p-3 bg-slate-950/90 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{attachedDocument.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {Math.round(attachedDocument.size / 1024)} KB &bull; Attached for outreach review
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <label
                    htmlFor="autopilot-cv-upload-input"
                    className={`px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 ${
                      isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-700'
                    }`}
                    title="Change document"
                  >
                    <Upload className="w-3 h-3" />
                    <span className="hidden sm:inline">Change</span>
                  </label>
                  <button
                    type="button"
                    onClick={onRemoveDocument}
                    disabled={isRunning}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Remove document"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="autopilot-cv-upload-input"
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isRunning) setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (isRunning) return;
                    const file = e.dataTransfer.files?.[0];
                    if (file) onDocumentUpload(file);
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isRunning
                      ? 'border-slate-800 bg-slate-950/30 opacity-50 cursor-not-allowed'
                      : isDragging
                      ? 'border-emerald-400 bg-emerald-500/10 cursor-pointer'
                      : 'border-slate-800 hover:border-emerald-500/50 bg-slate-950/50 hover:bg-slate-950/80 cursor-pointer'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Click to upload or drag &amp; drop your CV / Resume / Document
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Supports PDF, DOC, DOCX, TXT up to 15MB &bull; Added as reviewable attachment in drafts
                    </p>
                  </div>
                </label>

                {profileCv && onAttachProfileCv && (
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs">
                    <div className="flex items-center gap-2 text-slate-400 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">Saved Account CV: <strong className="text-slate-300 font-medium">{profileCv.name}</strong></span>
                    </div>
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={onAttachProfileCv}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold hover:underline shrink-0 ml-2 disabled:opacity-50"
                    >
                      Attach from Account
                    </button>
                  </div>
                )}
              </div>
            )}

            <input
              id="autopilot-cv-upload-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              disabled={isRunning}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onDocumentUpload(file);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
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
