'use client';

import React from 'react';
import {
  MessageSquare,
  Sparkles,
  ThumbsUp,
  Edit3,
  Copy,
  Check,
  Send,
  Loader2,
  Mail,
  User
} from 'lucide-react';

interface ReplyDetailViewProps {
  selectedReply: any | null;
  suggestedDraft: string;
  setSuggestedDraft: (v: string) => void;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  copied: boolean;
  onCopy: () => void;
  isSending: boolean;
  onSendResponse: () => void;
}

export function ReplyDetailView({
  selectedReply,
  suggestedDraft,
  setSuggestedDraft,
  isEditing,
  setIsEditing,
  copied,
  onCopy,
  isSending,
  onSendResponse,
}: ReplyDetailViewProps) {
  if (!selectedReply) {
    return (
      <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center space-y-3">
        <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
        <p className="text-sm font-bold text-white">Select a reply from the left to view AI analysis</p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Choose any incoming faculty message or import a received email to generate actionable summaries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Reply Details Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              {selectedReply.subject || 'Faculty Response'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                {selectedReply.professor_name || 'Professor'}
              </span>
              <span>&bull;</span>
              <span className="font-mono text-slate-400">
                {selectedReply.sender_email || 'faculty@university.edu'}
              </span>
              {selectedReply.university_name && (
                <>
                  <span>&bull;</span>
                  <span className="text-emerald-400">{selectedReply.university_name}</span>
                </>
              )}
            </div>
          </div>
          <span className="text-xs text-slate-500 shrink-0 font-mono">
            {selectedReply.received_at ? new Date(selectedReply.received_at).toLocaleString() : ''}
          </span>
        </div>

        {/* Inbound Email Body */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Original Faculty Message
          </span>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans select-text">
            {selectedReply.body_text}
          </div>
        </div>
      </div>

      {/* AI Intent & Sentiment Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> AI Classification &amp; Core Takeaway
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                selectedReply.sentiment === 'POSITIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : selectedReply.sentiment === 'NEGATIVE'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <ThumbsUp className="w-3 h-3 inline mr-1" />
              {selectedReply.sentiment || 'NEUTRAL'}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
          {selectedReply.summary || 'Summary generated based on key faculty directives.'}
        </div>
      </div>

      {/* Suggested Response Draft Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-400" /> Suggested Professional Response
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {isEditing ? 'Preview' : 'Edit Response'}
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {isEditing ? (
          <textarea
            rows={8}
            value={suggestedDraft}
            onChange={(e) => setSuggestedDraft(e.target.value)}
            className="w-full p-4 bg-slate-950 border border-emerald-500/50 rounded-xl text-xs text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        ) : (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
            {suggestedDraft}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onSendResponse}
            disabled={isSending || !suggestedDraft.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {isSending ? 'Sending Response...' : 'Send Response'}
          </button>
          <p className="text-[11px] text-slate-400 italic">
            Manual review is confirmed before transmission.
          </p>
        </div>
      </div>
    </div>
  );
}
