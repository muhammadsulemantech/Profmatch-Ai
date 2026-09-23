'use client';

import React from 'react';
import Link from 'next/link';
import { Send, Clock } from 'lucide-react';

interface SentOutreachViewProps {
  sentMessages: any[];
  selectedSentMessage: any | null;
  onSelectSentMessage: (msg: any) => void;
}

export function SentOutreachView({
  sentMessages,
  selectedSentMessage,
  onSelectSentMessage,
}: SentOutreachViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sent List (4 cols) */}
      <div className="lg:col-span-4 space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Sent Emails &amp; Drafts ({sentMessages.length})
        </h2>

        {sentMessages.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3">
            <Send className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-white">No Outreach Sent Yet</p>
            <p className="text-[11px] text-slate-400">
              Draft outreach emails to professors and they will be archived here in real time.
            </p>
            <Link
              href="/search"
              className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold"
            >
              Find Professors
            </Link>
          </div>
        ) : (
          sentMessages.map((msg, idx) => {
            const isSelected = selectedSentMessage === msg;
            const profName = msg.professor_name || msg.recipientEmail || 'Target Faculty';
            const dateStr = msg.sent_at || msg.created_at || new Date().toISOString();

            return (
              <button
                key={msg.id || idx}
                type="button"
                onClick={() => onSelectSentMessage(msg)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-md'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">{profName}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {msg.status || 'SENT'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium truncate">{msg.subject}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {new Date(dateStr).toLocaleDateString()}
                </p>
              </button>
            );
          })
        )}
      </div>

      {/* Sent Message Detail (8 cols) */}
      <div className="lg:col-span-8">
        {selectedSentMessage ? (
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {selectedSentMessage.professor_name || selectedSentMessage.recipientEmail || 'Outreach Email'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedSentMessage.recipientEmail || selectedSentMessage.to_email || 'faculty@university.edu'}
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(selectedSentMessage.sent_at || selectedSentMessage.created_at || Date.now()).toLocaleString()}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Subject: {selectedSentMessage.subject}</span>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                {selectedSentMessage.bodyText || selectedSentMessage.body_text}
              </div>
            </div>

            {selectedSentMessage.follow_up_due_at && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Follow-up scheduled for: {new Date(selectedSentMessage.follow_up_due_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center space-y-3">
            <Send className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">Select a sent outreach email to inspect details</p>
          </div>
        )}
      </div>
    </div>
  );
}
