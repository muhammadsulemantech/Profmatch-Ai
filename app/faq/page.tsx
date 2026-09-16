import { getAllSiteContent } from '@/lib/cms/content-service';
import { mockDb } from '@/lib/supabase/mock-db';
import { HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Frequently Asked Questions — ProfMatch AI',
  description: 'Verification standards, faculty data sources, and email safety FAQs.',
};

export default async function FaqPage() {
  const content = await getAllSiteContent();
  const faq = content.faq || mockDb.siteContent.faq;

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-16 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span>Platform Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white tracking-tight">
            {faq.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {faq.subtitle}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          {faq.content.items?.map((item: any, idx: number) => (
            <div key={idx} className="glass-panel bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <h2 className="text-base font-bold text-white flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item.question}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8 font-light">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

