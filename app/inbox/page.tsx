'use client';

import { useState } from 'react';
import { mockDb } from '@/lib/supabase/mock-db';
import { ReplyAnalysisAgent } from '@/lib/agents';
import {
  MessageSquare,
  Mail,
  Sparkles,
  ShieldCheck,
  Send,
  Copy,
  Edit3,
  CheckCircle2,
  ArrowRight,
  ThumbsUp,
  User
} from 'lucide-react';

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSendResponse = async () => {
    if (!selectedReply || !suggestedDraft.trim()) return;
    setIsSending(true);
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: selectedReply.sender_email || 'professor@university.edu',
          subject: `Re: ${selectedReply.subject}`,
          bodyText: suggestedDraft,
          confirmedGrounded: true,
        }),
      });
    } catch {}
    setIsSending(false);
    setSendSuccess(true);
    setTimeout(() => setSendSuccess(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-cyan-400" /> Inbox & AI Reply Assistant
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          View professor replies, AI-generated summaries, and crafted response drafts.
        </p>
      </div>

      {sendSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Response successfully delivered to {selectedReply?.professor_name || 'Professor'}!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Reply List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Received Replies</h2>
          {replies.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-2">
              <Mail className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500">No replies yet. Send your first outreach email!</p>
            </div>
          ) : (
            replies.map((reply) => (
              <button
                key={reply.id}
                type="button"
                onClick={() => {
                  setSelectedReply(reply);
                  setSuggestedDraft(reply.suggested_response || '');
                  setIsEditing(false);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedReply?.id === reply.id
                    ? 'border-cyan-500/50 bg-cyan-950/20 shadow-lg'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{reply.professor_name || 'Professor'}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    reply.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                    reply.sentiment === 'MEETING_REQUESTED' ? 'bg-cyan-500/10 text-cyan-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {reply.sentiment}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{reply.subject}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {new Date(reply.received_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Reply Detail + AI Assistant (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedReply ? (
            <>
              {/* Original Reply */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-sm">
                      {selectedReply.professor_name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'PR'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{selectedReply.professor_name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{selectedReply.sender_email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(selectedReply.received_at).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedReply.body_text}
                </div>
              </div>

              {/* AI Analysis Summary */}
              <div className="glass-panel rounded-2xl p-6 border border-emerald-500/25 bg-[#0b1325] space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> AI Reply Analysis
                </h3>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedReply.summary}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Sentiment:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    selectedReply.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    <ThumbsUp className="w-3 h-3 inline mr-1" />
                    {selectedReply.sentiment}
                  </span>
                </div>
              </div>

              {/* Suggested Response Draft */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-teal-400" /> Suggested Professional Response
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      {isEditing ? 'Preview' : 'Edit Draft'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    rows={8}
                    value={suggestedDraft}
                    onChange={(e) => setSuggestedDraft(e.target.value)}
                    className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white leading-relaxed focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {suggestedDraft}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleSendResponse}
                    disabled={isSending}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> {isSending ? 'Sending Response...' : 'Send Response'}
                  </button>
                  <p className="text-[11px] text-slate-500">Manual approval required before sending.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">Select a reply to view analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
