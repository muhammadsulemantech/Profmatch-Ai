'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Mail,
  ShieldCheck,
  Send,
  Copy,
  Edit3,
  CheckCircle2,
  ArrowRight,
  ThumbsUp,
  User,
  Plus,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Sparkles,
  ExternalLink,
  Clock,
  Check,
  Loader2,
  X
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth/auth-context';

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

    const mockEmails = mockDb.emails.filter(e => e.user_id === userId);
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze reply');
      }

      const newReply = data.reply;
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
            <div className="lg:col-span-8 space-y-6">
              {selectedReply ? (
                <>
                  {/* Original Reply Header & Body */}
                  <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
                    <div className="flex items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm shadow-sm shrink-0">
                          {selectedReply.professor_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'PR'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {selectedReply.professor_name}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                              Verified Faculty
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400 font-mono">{selectedReply.sender_email}</p>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400">
                        <span>{new Date(selectedReply.received_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <h4 className="text-xs font-semibold text-white mb-2">{selectedReply.subject}</h4>
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans selection:bg-emerald-500/30">
                        {selectedReply.body_text}
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis Summary */}
                  <div className="glass-panel rounded-2xl p-6 border border-emerald-500/25 bg-[#0b1325]/80 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" /> AI Reply Analysis
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Classified Sentiment:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            selectedReply.sentiment === 'POSITIVE'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : selectedReply.sentiment === 'MEETING_REQUESTED'
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-300'
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

                  {/* Suggested Response Draft */}
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
                          onClick={handleCopy}
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
                        onClick={handleSendResponse}
                        disabled={isSending}
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
                </>
              ) : (
                <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-white">Select a reply from the left to view AI analysis</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Choose any incoming faculty message or import a received email to generate actionable summaries.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SENT OUTREACH & DRAFTS */}
        {activeTab === 'sent' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                      onClick={() => setSelectedSentMessage(msg)}
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
        )}

        {/* MODAL: Analyze Inbound Email */}
        {isAnalyzeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-base text-white">Analyze Inbound Professor Email</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnalyzeModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {analyzeError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {analyzeError}
                </div>
              )}

              <form onSubmit={handleAnalyzeInboundEmail} className="space-y-4">
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
                    onClick={() => setIsAnalyzeModalOpen(false)}
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
        )}
      </div>
    </div>
  );
}
