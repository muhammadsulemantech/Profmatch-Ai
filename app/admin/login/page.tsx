'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, KeyRound, Building2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const inputEmail = email.trim().toLowerCase();
    const inputPass = passphrase.trim();

    // Strict Administrative Credential Check
    if (inputEmail === 'sulemanmunir6752@gmail.com' && inputPass === 'suleman6752') {
      // Set secure admin session & role cookies
      document.cookie = `profmatch_session=admin_elevated_${Date.now()}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `profmatch_role=ADMIN; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `profmatch_user=${encodeURIComponent(JSON.stringify({
        id: 'usr_admin_001',
        email: 'sulemanmunir6752@gmail.com',
        full_name: 'Suleman Munir (Admin)',
        role: 'ADMIN'
      }))}; path=/; max-age=86400; SameSite=Lax`;

      // Log audit event
      try {
        await fetch('/api/admin/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ADMIN_PORTAL_SIGN_IN',
            userEmail: inputEmail,
            resourceType: 'ADMIN_CONSOLE',
          }),
        });
      } catch {
        // silent audit catch
      }

      router.push('/admin');
      router.refresh();
    } else {
      setError('Invalid elevated administrative credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#080B11] text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel bg-slate-900/60 rounded-2xl p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Internal Operations Portal
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            System Administration
          </h1>
          <p className="text-xs text-slate-400">
            Authorized platform operator &amp; data stewards only.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">Staff Email</label>
            <input
              type="email"
              required
              placeholder="Enter admin email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">Security Passphrase</label>
            <input
              type="password"
              required
              placeholder="Enter security passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Verifying Credentials...' : 'Access Administration Console'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
