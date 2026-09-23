'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ExternalLink } from 'lucide-react';

export interface ContactedProfRecord {
  id: string;
  name: string;
  university: string;
  country: string;
  email: string;
  subject: string;
  sentAt: string;
  sentVia: string;
  draftUrl?: string;
}

interface PreparedDraftsListProps {
  contactedHistory: ContactedProfRecord[];
}

export function PreparedDraftsList({ contactedHistory }: PreparedDraftsListProps) {
  return (
    <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">
            Prepared Gmail Drafts ({contactedHistory.length})
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://mail.google.com/mail/u/0/#drafts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            Open Gmail Drafts <ExternalLink className="w-3 h-3" />
          </a>
          <Link
            href="/tracker"
            className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1"
          >
            Kanban <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {contactedHistory.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">
          No outreach drafts prepared yet in this session.
        </p>
      ) : (
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {contactedHistory.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold border flex items-center gap-1 bg-cyan-500/15 text-cyan-400 border-cyan-500/30">
                    <FileText className="w-2.5 h-2.5" /> Draft in {item.sentVia}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {item.university} &bull; {item.email}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.draftUrl && (
                  <a
                    href={item.draftUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm shadow-emerald-500/20"
                  >
                    Open Draft <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                <span className="text-[10px] font-mono text-slate-500">
                  {item.sentAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
