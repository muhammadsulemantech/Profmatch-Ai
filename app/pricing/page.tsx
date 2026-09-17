import { getAllSiteContent } from '@/lib/cms/content-service';
import { mockDb } from '@/lib/supabase/mock-db';
import Link from 'next/link';
import { Check, ShieldCheck, Award, Building2, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Academic Plans & Subscriptions — ProfMatch AI',
  description: 'Transparent academic research outreach licenses for graduate and PhD applicants.',
};

export default async function PricingPage() {
  const content = await getAllSiteContent();
  const pricing = content.pricing || mockDb.siteContent.pricing;

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-16 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span>Transparent Academic Subscriptions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white tracking-tight">
            Designed for serious researchers.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            No recurring hidden lock-ins. Grounded entirely on verifiable university records, official faculty publications, and ethical one-to-one outreach standards.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>Over <strong className="text-emerald-400">1,420+ MS &amp; PhD candidates</strong> matched with verified faculty worldwide.</span>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricing.content.plans?.map((plan: any, idx: number) => {
            const isHighlight = plan.highlighted;
            return (
              <div
                key={idx}
                className={`rounded-2xl p-8 flex flex-col justify-between transition-all ${
                  isHighlight
                    ? 'bg-slate-900 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 relative'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {isHighlight && (
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        Recommended for 2026/2027 Cycle
                      </span>
                    </div>
                  )}
                  <h2 className="text-xl font-heading font-bold text-white">{plan.name}</h2>
                  <p className="text-xs text-slate-400 mt-1.5 min-h-[32px] leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mt-6 mb-6 pb-6 border-b border-slate-800">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-heading font-bold text-white">{plan.price}</span>
                      <span className="text-xs text-slate-400 ml-1.5">/ {plan.period}</span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Included capabilities:
                  </div>
                  <ul className="space-y-3 text-xs text-slate-300 mb-8">
                    {plan.features.map((feat: string, fIdx: number) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug text-slate-200">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={
                    plan.tier === 'FREE' || plan.price === '$0'
                      ? '/signup'
                      : `/checkout?plan=${(plan.tier || 'student').toLowerCase()}`
                  }
                  className={`w-full py-3 rounded-xl text-center text-xs font-bold transition-all shadow-md ${
                    isHighlight
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Institutional Trust & Ethics Guarantee Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 sm:p-10 space-y-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-heading font-bold text-white">
              The ProfMatch Academic Ethics &amp; Accuracy Commitment
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              We strictly enforce rate limits to protect faculty inboxes and maintain the highest academic reputation for our applicants. We never generate generic spam or guess unverified email addresses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-xs text-white">100% Verifiable Records</div>
                <div className="text-[11px] text-slate-400">
                  Every faculty profile links directly to institutional homepages and official publications.
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-xs text-white">Ethical Rate Limiting</div>
                <div className="text-[11px] text-slate-400">
                  Prevents automated mass emailing to uphold academic integrity standards.
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-xs text-white">Local &amp; Global Payments</div>
                <div className="text-[11px] text-slate-400">
                  Supports Pakistan local payment methods (JazzCash, IBAN) and international cards.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

