import { ShieldCheck, Lock, EyeOff, Database } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — ProfMatch AI',
  description: 'How ProfMatch AI protects student research data, uploaded CVs, and authentication records.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-16 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-sm leading-relaxed">
        <div className="space-y-4 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Data Protection Guarantee
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight">
            Privacy &amp; Scholarly Data Policy
          </h1>
          <p className="text-xs text-slate-400">Effective: September 2026 &bull; Strict Academic Confidentiality</p>
        </div>

        <div className="space-y-6">
          <div className="glass-panel bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              1. Student Academic Data Ownership
            </h2>
            <p className="text-slate-300 font-light leading-relaxed">
              Your uploaded CVs, statements of purpose, thesis abstracts, and project repositories belong strictly to you. We do not sell student data, share private research portfolios with third-party advertisers, or use your unpublished works to train foundation models.
            </p>
          </div>

          <div className="glass-panel bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              2. Public Academic Data Sources
            </h2>
            <p className="text-slate-300 font-light leading-relaxed">
              Faculty profiles, departmental listings, email addresses, and publication metadata are gathered exclusively from open, public academic sources, university (.edu / .ac.uk) websites, and public citation repositories (e.g. OpenAlex, Crossref, PubMed).
            </p>
          </div>

          <div className="glass-panel bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              3. Data Security &amp; Encryption
            </h2>
            <p className="text-slate-300 font-light leading-relaxed">
              All student data stored in our database is secured by Row Level Security (RLS). Direct API access requires authenticated session tokens, and documents are accessible only by their respective authenticated account owners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

