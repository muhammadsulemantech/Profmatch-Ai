'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verify token validity on load
  useEffect(() => {
    if (!token || !email) {
      setTokenError('The password reset link is missing required parameters. Please request a new link.');
      setVerifyingToken(false);
      return;
    }

    async function checkToken() {
      try {
        const res = await fetch(
          `/api/auth/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          setTokenError(data.error || 'Password reset link is invalid or has expired.');
        }
      } catch {
        setTokenError('Unable to verify reset link. Please check your internet connection.');
      } finally {
        setVerifyingToken(false);
      }
    }

    checkToken();
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to reset password. Please try requesting a new link.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setFormError('Network error while resetting password. Please try again.');
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
            Account Security
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-400">
            Choose a strong password for <span className="text-slate-200 font-mono font-medium">{email || 'your account'}</span>
          </p>
        </div>

        {verifyingToken ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Verifying recovery link...</span>
          </div>
        ) : tokenError ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Invalid or Expired Link
              </div>
              <p className="text-slate-300 leading-relaxed">{tokenError}</p>
            </div>

            <Link
              href="/forgot-password"
              className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              Request a New Recovery Link
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Password Reset Successfully!
              </div>
              <p className="text-slate-300 leading-relaxed">
                Your password has been securely updated. You can now access your research workspace with your new credentials.
              </p>
            </div>

            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              Sign In Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Minimum 6 characters, securely hashed</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  Update Password &amp; Sign In
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400">
          Remember your password?{' '}
          <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] bg-[#080B11] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
