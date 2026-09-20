'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Lock,
  User,
  Sparkles
} from 'lucide-react';

export default function SettingsPage() {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [connectedStatus, setConnectedStatus] = useState<{
    connected: boolean;
    account?: { email: string; connected_at: string; scope?: string } | null;
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
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isConnectedParam = params.get('gmail_connected');
      const emailParam = params.get('gmail_email');

      if (isConnectedParam === 'true' && emailParam) {
        const backupState = {
          connected: true,
          account: {
            email: emailParam,
            connected_at: new Date().toISOString(),
          },
        };
        setConnectedStatus(backupState);
        localStorage.setItem('profmatch_gmail_connection', JSON.stringify(backupState));
      }
    }

    fetchGmailStatus();
  }, []);

  const fetchGmailStatus = async () => {
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
        // Check local storage backup
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
      console.error('Failed to fetch Gmail status:', e);
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

  const handleConnectGmail = () => {
    window.location.href = '/api/auth/google/gmail?redirectTo=/settings';
  };

  const handleDisconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account? Draft creation will require reconnecting.')) {
      return;
    }

    setDisconnecting(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('profmatch_gmail_connection');
      }
      const res = await fetch('/api/auth/google/gmail/status', {
        method: 'DELETE',
      });
      setConnectedStatus({ connected: false, account: null });
    } catch (e) {
      console.error('Failed to disconnect Gmail:', e);
      setConnectedStatus({ connected: false, account: null });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Back */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Account Settings &amp; Integrations
          </h1>
          <p className="text-sm text-slate-400">
            Manage connected email services, Google OAuth permissions, and security scope settings.
          </p>
        </div>

        {/* Section: Email Integration */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" /> Email Integration (Google OAuth)
            </h2>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Direct Gmail Drafts Enabled
            </span>
          </div>

          <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                  <Mail className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-white">Google Gmail Connection</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                    Connect your Gmail account via Google OAuth to directly save generated professor outreach emails into your official Gmail Drafts folder.
                  </p>
                </div>
              </div>

              {/* Status & Action */}
              <div className="shrink-0">
                {checkingStatus ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Checking Status...
                  </div>
                ) : connectedStatus.connected ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDisconnectGmail}
                      disabled={disconnecting}
                      className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Disconnect Gmail
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGmail}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" /> Connect Gmail
                  </button>
                )}
              </div>
            </div>

            {/* Connection Details Box */}
            {connectedStatus.connected && connectedStatus.account && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>Connected as {connectedStatus.account.email}</span>
                  </div>
                  <a
                    href="https://mail.google.com/mail/u/0/#drafts"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline font-semibold flex items-center gap-1 text-[11px]"
                  >
                    Open Gmail Drafts <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-slate-300">
                  <span className="text-slate-400">Connected Date: </span>
                  <span className="font-mono text-white">
                    {new Date(connectedStatus.account.connected_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {/* Privacy & Minimal Scope Guarantees */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Security &amp; Minimal Scope Privacy Guarantees
              </h4>
              <ul className="space-y-2 text-slate-300 leading-relaxed font-light">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Zero Passwords Stored:</strong> Authentication is handled strictly server-side via official Google OAuth authorization code exchange.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Minimal Scope Only (<code className="text-emerald-300 font-mono">gmail.compose</code>):</strong> We only request access to create email drafts. We cannot read your inbox or edit existing emails.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">100% User Control:</strong> Drafts are created as unsent drafts in your official Gmail folder. No emails are ever sent automatically.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
