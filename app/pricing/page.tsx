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
    <div className="min-h-screen bg-[#F8F7F3] text-[#172033] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#F1F2EE] text-[#5C8F86] border border-[#E5E7EB]">
            <span>Transparent Academic Subscriptions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#172033] tracking-tight">
            Designed for serious researchers.
          </h1>
          <p className="text-sm sm:text-base text-[#556070] font-light leading-relaxed">
            No recurring hidden lock-ins. Grounded entirely on verifiable university records, official faculty publications, and ethical one-to-one outreach standards.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricing.content.plans?.map((plan: any, idx: number) => {
            const isHighlight = plan.highlighted;
            return (
              <div
                key={idx}
                className={`bg-white rounded p-8 flex flex-col justify-between border transition-shadow shadow-sm ${
                  isHighlight
                    ? 'border-[#3157A4] ring-1 ring-[#3157A4]/20 shadow-md relative'
                    : 'border-[#E5E7EB]'
                }`}
              >
                <div>
                  {isHighlight && (
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#EBF2FE] text-[#3157A4] border border-[#D1E0FC]">
                        Recommended for 2026/2027 Cycle
                      </span>
                    </div>
                  )}
                  <h2 className="text-xl font-serif font-bold text-[#172033]">{plan.name}</h2>
                  <p className="text-xs text-[#556070] mt-1.5 min-h-[32px] font-light leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mt-6 mb-6 pb-6 border-b border-[#E5E7EB]">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-serif font-bold text-[#172033]">{plan.price}</span>
                      <span className="text-xs text-[#556070] ml-1.5 font-light">/ {plan.period}</span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-[#172033] uppercase tracking-wider mb-3">
                    Included capabilities:
                  </div>
                  <ul className="space-y-3 text-xs text-[#556070] mb-8 font-light">
                    {plan.features.map((feat: string, fIdx: number) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#5C8F86] shrink-0 mt-0.5" />
                        <span className="leading-snug text-[#172033]">{feat}</span>
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
                  className={`w-full py-2.5 rounded text-center text-xs font-medium transition-all shadow-sm ${
                    isHighlight
                      ? 'bg-[#3157A4] hover:bg-[#254587] text-white'
                      : 'bg-[#FAF9F5] hover:bg-[#F1F2EE] text-[#172033] border border-[#E5E7EB]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Institutional Trust & Ethics Guarantee Section */}
        <div className="bg-[#F1F2EE] border border-[#E5E7EB] rounded p-8 sm:p-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <ShieldCheck className="w-8 h-8 text-[#5C8F86] mx-auto" />
            <h3 className="text-xl font-serif font-bold text-[#172033]">
              The ProfMatch Academic Ethics & Accuracy Commitment
            </h3>
            <p className="text-xs sm:text-sm text-[#556070] font-light leading-relaxed">
              We strictly enforce rate limits to protect faculty inboxes and maintain the highest academic reputation for our applicants. We never generate generic spam or guess unverified email addresses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
              <div className="bg-white p-4 rounded border border-[#E5E7EB]">
                <div className="font-semibold text-xs text-[#172033]">100% Verifiable Records</div>
                <div className="text-[11px] text-[#556070] mt-1 font-light">
                  Every faculty profile links directly to institutional homepages and official publications.
                </div>
              </div>
              <div className="bg-white p-4 rounded border border-[#E5E7EB]">
                <div className="font-semibold text-xs text-[#172033]">Ethical Rate Limiting</div>
                <div className="text-[11px] text-[#556070] mt-1 font-light">
                  Prevents automated mass emailing to uphold academic integrity standards.
                </div>
              </div>
              <div className="bg-white p-4 rounded border border-[#E5E7EB]">
                <div className="font-semibold text-xs text-[#172033]">Local & Global Payments</div>
                <div className="text-[11px] text-[#556070] mt-1 font-light">
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

