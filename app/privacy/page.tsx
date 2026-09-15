import { ShieldCheck, Lock, EyeOff, Database } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — ProfMatch AI',
  description: 'How ProfMatch AI protects student research data, uploaded CVs, and authentication records.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#172033] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-sm leading-relaxed">
        <div className="space-y-4 border-b border-[#E5E7EB] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#F1F2EE] text-[#5C8F86] border border-[#E5E7EB]">
            <ShieldCheck className="w-4 h-4 text-[#3157A4]" /> Data Protection Guarantee
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#172033] tracking-tight">
            Privacy & Scholarly Data Policy
          </h1>
          <p className="text-xs text-[#556070]">Effective: September 2026 &bull; Strict Academic Confidentiality</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-base font-serif font-bold text-[#172033] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#3157A4]" />
              1. Student Academic Data Ownership
            </h2>
            <p className="text-[#556070] font-light leading-relaxed">
              Your uploaded CVs, statements of purpose, thesis abstracts, and project repositories belong strictly to you. We do not sell student data, share private research portfolios with third-party advertisers, or use your unpublished works to train foundation models.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-base font-serif font-bold text-[#172033] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#5C8F86]" />
              2. Public Academic Data Sources
            </h2>
            <p className="text-[#556070] font-light leading-relaxed">
              Faculty profiles, departmental listings, email addresses, and publication metadata are gathered exclusively from open, public academic sources, university (.edu / .ac.uk) websites, and public citation repositories (e.g. OpenAlex, Crossref, PubMed).
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-base font-serif font-bold text-[#172033] flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-[#3157A4]" />
              3. Data Security & Encryption
            </h2>
            <p className="text-[#556070] font-light leading-relaxed">
              All student data stored in our database is secured by Row Level Security (RLS). Direct API access requires authenticated session tokens, and documents are accessible only by their respective authenticated account owners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

