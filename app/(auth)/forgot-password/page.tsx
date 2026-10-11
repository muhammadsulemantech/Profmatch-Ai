'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, KeyRound, RefreshCw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to dispatch recovery email. Please try again.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Connection failed. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#080B11] flex items-center justify-center px-4 pt-24 sm:pt-28 pb-16 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl shadow-emerald-500/5 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Security &amp; Account Recovery
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your registered email address and we will dispatch a secure 15-minute recovery link.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Recovery Link Dispatched
              </div>
              <p className="text-slate-300 leading-relaxed">
                If an account exists for <span className="text-white font-mono font-semibold">{email}</span>, you will receive an email shortly with a secure link to choose a new password.
              </p>
              <p className="text-slate-400 text-[11px] pt-1">
                Note: Check your spam or promotions folder if it doesn&apos;t arrive within 2 minutes.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="w-full py-2.5 rounded-xl font-semibold bg-slate-950 border border-slate-800 text-slate-300 text-xs hover:border-slate-700 hover:text-white transition-all text-center"
              >
                Send to a different email
              </button>

              <Link
                href="/login"
                className="w-full py-2.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-white text-xs transition-all flex items-center justify-center gap-2 text-center"
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sending Recovery Link...
                </>
              ) : (
                <>
                  Send Recovery Link
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400">
          Remembered your password?{' '}
          <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
