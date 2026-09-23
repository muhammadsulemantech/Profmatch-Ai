'use client';

import React from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface InboundEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  importProfName: string;
  setImportProfName: (v: string) => void;
  importEmail: string;
  setImportEmail: (v: string) => void;
  importSubject: string;
  setImportSubject: (v: string) => void;
  importBody: string;
  setImportBody: (v: string) => void;
  isAnalyzing: boolean;
  analyzeError: string;
}

export function InboundEmailModal({
  isOpen,
  onClose,
  onSubmit,
  importProfName,
  setImportProfName,
  importEmail,
  setImportEmail,
  importSubject,
  setImportSubject,
  importBody,
  setImportBody,
  isAnalyzing,
  analyzeError,
}: InboundEmailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Analyze Inbound Professor Email</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {analyzeError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {analyzeError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Professor Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Greg Durrett"
                value={importProfName}
                onChange={(e) => setImportProfName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Professor Email</label>
              <input
                type="email"
                placeholder="faculty@university.edu"
                value={importEmail}
                onChange={(e) => setImportEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Email Subject</label>
            <input
              type="text"
              placeholder="e.g. Re: Prospective PhD Student Inquiry"
              value={importSubject}
              onChange={(e) => setImportSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Inbound Email Body Text <span className="text-emerald-400">*</span>
            </label>
            <textarea
              rows={6}
              required
              placeholder="Paste the message content received from the professor..."
              value={importBody}
              onChange={(e) => setImportBody(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAnalyzing || !importBody.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isAnalyzing ? 'Analyzing with AI...' : 'Analyze & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
