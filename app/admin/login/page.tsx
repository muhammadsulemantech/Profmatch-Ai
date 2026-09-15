'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, KeyRound, Building2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@profmatch.ai');
  const [passphrase, setPassphrase] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Elevated Admin Authorization Check
    if (email.toLowerCase().includes('admin') || passphrase === 'admin123') {
      // Set secure admin session & role cookies
      document.cookie = `profmatch_session=admin_elevated_${Date.now()}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `profmatch_role=ADMIN; path=/; max-age=86400; SameSite=Lax`;

      // Log audit
      try {
        await fetch('/api/admin/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ADMIN_PORTAL_SIGN_IN',
            userEmail: email,
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
    <div className="min-h-[85vh] bg-[#F8F7F3] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg p-8 border border-[#E5E7EB] shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded bg-[#F1F2EE] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#3157A4]">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5C8F86]">
            Internal Operations Portal
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#172033] tracking-tight">
            System Administration
          </h1>
          <p className="text-xs text-[#556070]">
            Authorized faculty data stewards and platform operators only.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">Staff Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">Security Passphrase</label>
            <input
              type="password"
              required
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded font-medium bg-[#3157A4] hover:bg-[#254587] text-white text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Verifying Credentials...' : 'Access Administration Console'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="p-3 rounded bg-[#FAF9F5] border border-[#E5E7EB] text-[11px] text-[#556070] text-center">
          <span className="font-semibold text-[#172033]">Development credentials:</span> admin@profmatch.ai / admin123
        </div>
      </div>
    </div>
  );
}

