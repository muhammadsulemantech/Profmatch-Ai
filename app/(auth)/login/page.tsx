'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const { login } = useAuth();
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email.trim(), password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials.');
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  const handleDemoFill = () => {
    setEmail('student@example.com');
    setPassword('student123');
    setError(null);
  };

  return (
    <div className="min-h-[85vh] bg-[#080B11] flex items-center justify-center px-4 py-12 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl shadow-emerald-500/5 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Academic Outreach Workspace
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
            Sign In to ProfMatch
          </h1>
          <p className="text-xs text-slate-400">
            Access your faculty shortlist, outreach drafts, and application pipeline.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-emerald-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                Authenticating...
              </>
            ) : (
              <>
                Sign In to Workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Fill Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Quick Demo Credentials:</span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
            >
              Fill Demo Student &rarr;
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-emerald-400 font-medium hover:underline">
            Register for researcher access
          </Link>
        </p>
      </div>
    </div>
  );
}
