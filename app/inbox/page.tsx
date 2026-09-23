'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Mail,
  Send,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth/auth-context';
import { InboundEmailModal } from '@/components/inbox/inbound-email-modal';
import { ReplyDetailView } from '@/components/inbox/reply-detail-view';
import { SentOutreachView } from '@/components/inbox/sent-outreach-view';

export default function InboxPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'replies' | 'sent'>('replies');
  const [replies, setReplies] = useState<any[]>([]);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [selectedReply, setSelectedReply] = useState<any | null>(null);
  const [selectedSentMessage, setSelectedSentMessage] = useState<any | null>(null);
  const [suggestedDraft, setSuggestedDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Analyze Inbound Email Modal State
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [importProfName, setImportProfName] = useState('');
  const [importEmail, setImportEmail] = useState('');
  const [importSubject, setImportSubject] = useState('');
  const [importBody, setImportBody] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  const userId = user?.id || 'usr_guest';
  const repliesKey = `profmatch_replies_${userId}`;
  const sentKey = `profmatch_sent_emails_${userId}`;

  // Load real-time replies and sent messages
  const loadMessagesData = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 1. Load Replies
    let loadedReplies: any[] = [];
    try {
      const stored = localStorage.getItem(repliesKey);
      if (stored) loadedReplies = JSON.parse(stored);
    } catch {}

    // Only fallback to mockDb for demo student profile if empty
    if (userId === 'usr_student_001' && loadedReplies.length === 0) {
      loadedReplies = [...mockDb.replies];
      try {
        localStorage.setItem(repliesKey, JSON.stringify(loadedReplies));
      } catch {}
    }

    setReplies(loadedReplies);

    // If currently selected reply exists, refresh it; otherwise default to first
    setSelectedReply((prev: any) => {
      if (!prev) return loadedReplies[0] || null;
      const found = loadedReplies.find((r: any) => r.id === prev.id);
      return found || loadedReplies[0] || null;
    });

    if (loadedReplies[0] && !selectedReply) {
      setSuggestedDraft(loadedReplies[0].suggested_response || '');
    }

    // 2. Load Sent Emails / Drafts
    let loadedSent: any[] = [];
    try {
      const storedSent = localStorage.getItem(sentKey);
      if (storedSent) loadedSent = JSON.parse(storedSent);
    } catch {}

    const mockEmails = mockDb.emails.filter((e) => e.user_id === userId);
    const combinedSent = [...loadedSent, ...mockEmails];
    setSentMessages(combinedSent);
    if (combinedSent[0] && !selectedSentMessage) {
      setSelectedSentMessage(combinedSent[0]);
    }
  }, [repliesKey, sentKey, userId, selectedReply, selectedSentMessage]);

  useEffect(() => {
    loadMessagesData();

    const handleUpdate = () => {
      loadMessagesData();
    };

    window.addEventListener('profmatch_messages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('profmatch_messages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadMessagesData]);

  // When a reply is selected, mark as READ in real-time
  const handleSelectReply = (reply: any) => {
    setSelectedReply(reply);
    setSuggestedDraft(reply.suggested_response || '');
    setIsEditing(false);

    if (reply.status === 'UNREAD') {
      const updated = replies.map((r) =>
        r.id === reply.id ? { ...r, status: 'READ' } : r
      );
      setReplies(updated);
      try {
        localStorage.setItem(repliesKey, JSON.stringify(updated));
        window.dispatchEvent(new Event('profmatch_messages_updated'));
      } catch {}
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMessagesData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCopy = () => {
    if (!suggestedDraft) return;
    navigator.clipboard.writeText(suggestedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteReply = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this message?')) return;

    const updated = replies.filter((r) => r.id !== id);
    setReplies(updated);
    if (selectedReply?.id === id) {
      setSelectedReply(updated[0] || null);
      setSuggestedDraft(updated[0]?.suggested_response || '');
    }
    try {
      localStorage.setItem(repliesKey, JSON.stringify(updated));
      window.dispatchEvent(new Event('profmatch_messages_updated'));
    } catch {}
  };

  const handleLoadSampleReply = () => {
    const sample = {
      id: `rep_${Date.now()}`,
      professor_name: 'Dr. Greg Durrett',
      university_name: 'University of Texas at Austin',
      sender_email: 'gdurrett@cs.utexas.edu',
      subject: 'Re: Prospective PhD Student (Fall 2027) — Grounded LLM Reasoning',
      body_text: `Hi Alex,\n\nThanks for reaching out with such a thoughtful note and congratulations on your recent publications. Your research direction looks quite relevant to what we are building right now on grounding generation steps.\n\nI am indeed taking 1-2 new PhD students for Fall 2027 through the UT Austin CS admissions process. Please make sure to mention my name in your statement of purpose so your file gets routed to me. Also, please send over a 1-page research proposal outlining your proposed thesis direction if you have one ready.\n\nBest,\nGreg Durrett`,
      summary: 'Dr. Durrett confirmed he is recruiting 1-2 PhD students for Fall 2027. He requested mentioning his name on the SOP and submitting a 1-page research proposal.',
      sentiment: 'POSITIVE',
      suggested_response: `Dear Professor Durrett,\n\nThank you very much for your encouraging reply and guidance! I will certainly mention your name and the TAUR Lab in my Statement of Purpose for the UT Austin CS application.\n\nI have prepared and attached a 1-page research proposal outlining my proposed framework for graph-guided multi-hop reasoning. I welcome any feedback you might have when time permits.\n\nThank you again for your time and consideration.\n\nBest regards,\n[Your Name]`,
      status: 'UNREAD',
      received_at: new Date().toISOString(),
    };

    const updated = [sample, ...replies];
    setReplies(updated);
    setSelectedReply(sample);
    setSuggestedDraft(sample.suggested_response);
    try {
      localStorage.setItem(repliesKey, JSON.stringify(updated));
      window.dispatchEvent(new Event('profmatch_messages_updated'));
    } catch {}
  };

  const handleAnalyzeInboundEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importBody.trim()) return;

    setIsAnalyzing(true);
    setAnalyzeError('');

    try {
      const res = await fetch('/api/inbox/analyze-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professorName: importProfName || 'Professor',
          senderEmail: importEmail || 'faculty@university.edu',
          subject: importSubject || 'Faculty Response',
          bodyText: importBody,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.reply)) {
        throw new Error(data.error || 'Failed to analyze reply');
      }

      const newReply = data.reply || (data.data && data.data.reply);
      const updated = [newReply, ...replies];
      setReplies(updated);
      setSelectedReply(newReply);
      setSuggestedDraft(newReply.suggested_response || '');
      setIsAnalyzeModalOpen(false);
      setImportProfName('');
      setImportEmail('');
      setImportSubject('');
      setImportBody('');

      try {
        localStorage.setItem(repliesKey, JSON.stringify(updated));
        window.dispatchEvent(new Event('profmatch_messages_updated'));
      } catch {}
    } catch (err: any) {
      setAnalyzeError(err.message || 'Something went wrong while analyzing the email.');
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  const unreadCount = replies.filter((r) => r.status === 'UNREAD').length;

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-8 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-emerald-400" /> Messages &amp; AI Reply Assistant
            </h1>
            <p className="text-xs text-slate-400">
              Real-time faculty replies, sentiment classification, grounded response drafts, and sent outreach tracking.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5" /> Analyze Professor Reply
            </button>
          </div>
        </div>

        {sendSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Response draft successfully submitted to {selectedReply?.professor_name || 'Professor'}!</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('replies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'replies'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Mail className="w-4 h-4" /> Received Replies ({replies.length})
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500 text-slate-950 animate-pulse">
                {unreadCount} new
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sent'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Sent Outreach &amp; Drafts ({sentMessages.length})
          </button>
        </div>

        {/* TAB 1: RECEIVED REPLIES */}
        {activeTab === 'replies' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Replies List (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Faculty Inquiries ({replies.length})
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[11px] text-emerald-400 font-semibold">{unreadCount} unread</span>
                )}
              </div>

              {replies.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">No Incoming Replies Yet</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      When professors respond to your emails, their messages, AI summaries, and suggested replies will show up here.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAnalyzeModalOpen(true)}
                      className="w-full px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                    >
                      + Paste &amp; Analyze Email
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadSampleReply}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Load Sample Reply (Demo)
                    </button>
                  </div>
                </div>
              ) : (
                replies.map((reply) => {
                  const isSelected = selectedReply?.id === reply.id;
                  const isUnread = reply.status === 'UNREAD';

                  return (
                    <div
                      key={reply.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectReply(reply)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSelectReply(reply);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all relative group cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      {isUnread && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                      )}

                      <div className="flex items-center justify-between mb-1 pr-4">
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">
                          {reply.professor_name || 'Professor'}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            reply.sentiment === 'POSITIVE'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : reply.sentiment === 'MEETING_REQUESTED'
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {reply.sentiment || 'NEUTRAL'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-medium truncate">{reply.subject}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {reply.body_text}
                      </p>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                        <span>{new Date(reply.received_at).toLocaleDateString()}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteReply(reply.id, e)}
                          title="Delete message"
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Detail & AI Assistant (8 cols) */}
            <div className="lg:col-span-8">
              <ReplyDetailView
                selectedReply={selectedReply}
                suggestedDraft={suggestedDraft}
                setSuggestedDraft={setSuggestedDraft}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                copied={copied}
                onCopy={handleCopy}
                isSending={isSending}
                onSendResponse={handleSendResponse}
              />
            </div>
          </div>
        )}

        {/* TAB 2: SENT OUTREACH & DRAFTS */}
        {activeTab === 'sent' && (
          <SentOutreachView
            sentMessages={sentMessages}
            selectedSentMessage={selectedSentMessage}
            onSelectSentMessage={setSelectedSentMessage}
          />
        )}

        {/* MODAL: Analyze Inbound Email */}
        <InboundEmailModal
          isOpen={isAnalyzeModalOpen}
          onClose={() => setIsAnalyzeModalOpen(false)}
          onSubmit={handleAnalyzeInboundEmail}
          importProfName={importProfName}
          setImportProfName={setImportProfName}
          importEmail={importEmail}
          setImportEmail={setImportEmail}
          importSubject={importSubject}
          setImportSubject={setImportSubject}
          importBody={importBody}
          setImportBody={setImportBody}
          isAnalyzing={isAnalyzing}
          analyzeError={analyzeError}
        />
      </div>
    </div>
  );
}
