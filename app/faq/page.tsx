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
    <div className="min-h-screen bg-[#F8F7F3] text-[#172033] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#F1F2EE] text-[#5C8F86] border border-[#E5E7EB]">
            <span>Platform Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#172033] tracking-tight">
            {faq.title}
          </h1>
          <p className="text-sm sm:text-base text-[#556070] font-light leading-relaxed">
            {faq.subtitle}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          {faq.content.items?.map((item: any, idx: number) => (
            <div key={idx} className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
              <h2 className="text-base font-serif font-bold text-[#172033] flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#3157A4] shrink-0 mt-0.5" />
                <span>{item.question}</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#556070] leading-relaxed pl-8 font-light">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

