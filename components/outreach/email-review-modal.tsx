'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Edit3,
  Send,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Professor } from '@/types/database';

interface EmailReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  professor: Professor;
  initialSubject?: string;
  initialBody?: string;
}

export default function EmailReviewModal({
  isOpen,
  onClose,
  professor,
  initialSubject = '',
  initialBody = '',
}: EmailReviewModalProps) {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [connectedStatus, setConnectedStatus] = useState<{
    connected: boolean;
    account?: { email: string; connected_at: string } | null;
  }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('profmatch_gmail_connection');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.connected) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return { connected: false };
  });
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftResult, setDraftResult] = useState<{
    success: boolean;
    draftUrl?: string;
    message?: string;
    error?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Initialize data on modal open
  useEffect(() => {
    if (isOpen) {
      const cleanProfEmail = professor.email || 'faculty@university.edu';
      setToEmail(cleanProfEmail);

      const defaultSubject = initialSubject || `Prospective MS/PhD Research Student — Interested in ${professor.primary_discipline || 'Academic Research'}`;
      setSubject(defaultSubject);

      const defaultBody = initialBody || `Dear Professor ${professor.name},\n\nI hope this email finds you well.\n\nI have been closely following your research group's work in ${professor.primary_discipline || 'your department'} at ${professor.university_name || (typeof professor.university === 'string' ? professor.university : 'your university')}. I am writing to express my strong interest in joining your lab as a prospective graduate research assistant.\n\nMy academic background and research interests align strongly with your publications. I would appreciate the opportunity to discuss any open positions in your lab for the upcoming term.\n\nThank you for your time and consideration. I have attached my CV for your review.\n\nSincerely,\n[Your Name]`;
      setBodyText(defaultBody);

      setDraftResult(null);
      checkConnectionStatus();
    }
  }, [isOpen, professor, initialSubject, initialBody]);

  const checkConnectionStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/auth/google/gmail/status');
      const data = await res.json();
      if (res.ok && (data.connected || data.isConnected)) {
        const state = {
          connected: true,
          account: data.account || null,
        };
        setConnectedStatus(state);
        if (typeof window !== 'undefined') {
          localStorage.setItem('profmatch_gmail_connection', JSON.stringify(state));
        }
      } else {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('profmatch_gmail_connection');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.connected && parsed.account?.email) {
                await fetch('/api/auth/google/gmail/status', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: parsed.account.email,
                    connected_at: parsed.account.connected_at,
                  }),
                });
                setConnectedStatus(parsed);
                setCheckingStatus(false);
                return;
              }
            } catch (err) {}
          }
        }
        setConnectedStatus({ connected: false, account: null });
      }
    } catch (e) {
      console.error('Failed to check Gmail status:', e);
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('profmatch_gmail_connection');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.connected) {
              setConnectedStatus(parsed);
            }
          } catch (err) {}
        }
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!toEmail || !subject || !bodyText) return;
    setIsCreatingDraft(true);
    setDraftResult(null);

    try {
      const res = await fetch('/api/outreach/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail,
          subject,
          bodyText,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDraftResult({
          success: true,
          draftUrl: data.draftUrl || 'https://mail.google.com/mail/u/0/#drafts',
          message: data.message || 'Draft successfully created in your Gmail account!',
        });
      } else {
        setDraftResult({
          success: false,
          error: data.error || 'Failed to create draft in Gmail.',
        });
      }
    } catch (e: any) {
      setDraftResult({
        success: false,
        error: e.message || 'Network error while contacting draft API.',
      });
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleConnectGmail = () => {
    window.location.href = '/api/auth/google/gmail';
  };

  const handleCopyContent = () => {
    const fullText = `To: ${toEmail}\nSubject: ${subject}\n\n${bodyText}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 my-auto text-slate-100">
        {/* Top Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Review &amp; Create Gmail Draft
              </h3>
              <p className="text-xs text-slate-400">
                Outreach to <span className="text-slate-200 font-semibold">{professor.name}</span> ({professor.university_name || 'University'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gmail Connection Status Header Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {checkingStatus ? (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
            ) : connectedStatus.connected ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="truncate">
              {checkingStatus ? (
                <span className="text-slate-400">Checking Gmail connection...</span>
              ) : connectedStatus.connected ? (
                <span className="text-slate-300">
                  Connected to Gmail as <strong className="text-emerald-400">{connectedStatus.account?.email}</strong>
                </span>
              ) : (
                <span className="text-amber-300 font-medium">
                  Gmail account not connected. Connect to create direct drafts.
                </span>
              )}
            </div>
          </div>

          {!checkingStatus && !connectedStatus.connected && (
            <button
              type="button"
              onClick={handleConnectGmail}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 transition-all flex items-center gap-1 shadow-md shadow-emerald-500/20"
            >
              Connect Gmail
            </button>
          )}
        </div>

        {/* Success / Error Draft Result Alert */}
        {draftResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              draftResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {draftResult.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Draft Created Successfully in Gmail!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>Failed to Create Draft</span>
                </>
              )}
            </div>
            <p className="text-slate-300 leading-relaxed">
              {draftResult.success
                ? 'Your email has been saved into your official Gmail Drafts folder. It has NOT been sent — you have full control to inspect, refine, or send it directly from Gmail.'
                : draftResult.error}
            </p>

            {draftResult.success && draftResult.draftUrl && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={draftResult.draftUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Open Gmail Drafts Folder (1-Click) <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Form Controls */}
        <div className="space-y-4 text-xs">
          {/* To Field */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">To (Professor Email):</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Body Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-semibold">Email Body:</label>
              <span className="text-[11px] text-slate-500">
                {bodyText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-emerald-500/50 transition-colors resize-y"
            />
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCopyContent}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Content'}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            {connectedStatus.connected ? (
              <button
                type="button"
                onClick={handleCreateDraft}
                disabled={isCreatingDraft || !toEmail || !subject || !bodyText}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isCreatingDraft ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating Draft...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Create Gmail Draft
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGmail}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Connect Gmail to Create Draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
