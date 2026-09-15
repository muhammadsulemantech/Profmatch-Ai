import { ShieldCheck, Mail, CheckCircle2, AlertTriangle, FileCheck, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Responsible Academic Outreach Policy — ProfMatch AI',
  description: 'Ethical outreach guidelines, anti-spam standards, and compliance policies for prospective graduate and PhD students.',
};

export default function ResponsibleOutreachPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#172033] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 border-b border-[#E5E7EB] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold bg-[#F1F2EE] text-[#5C8F86] border border-[#E5E7EB]">
            <ShieldCheck className="w-4 h-4 text-[#3157A4]" /> Academic Integrity Standard
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#172033] tracking-tight">
            Responsible Academic Outreach Guidelines
          </h1>
          <p className="text-sm sm:text-base text-[#556070] font-light leading-relaxed">
            ProfMatch AI is strictly engineered for legitimate, high-relevance academic communication between prospective researchers and faculty. We do not support, facilitate, or condone mass unsolicited email blasting.
          </p>
        </div>

        <div className="space-y-6 text-[#172033] text-sm leading-relaxed">
          {/* Section 1 */}
          <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#172033] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#5C8F86]" />
              1. Mandatory Grounded Personalization
            </h2>
            <p className="text-[#556070] font-light">
              Every email composed through ProfMatch AI must link specific elements of the applicant’s actual academic background (projects, undergraduate thesis, technical skills) with verified recent publications or active lab projects of the target professor.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#556070] pl-2 font-light">
              <li>No generic templates without substantive research references.</li>
              <li>No unverified citation claims or fabricated publications.</li>
              <li>Mandatory student review and confirmation before dispatch.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#172033] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#3157A4]" />
              2. Hard Sending Limits & Anti-Spam Safeguards
            </h2>
            <p className="text-[#556070] font-light">
              To prevent server reputation degradation and protect faculty inboxes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#556070] pl-2 font-light">
              <li>Daily email sending caps are enforced at the system level.</li>
              <li>Duplicate detection automatically blocks sending multiple initial inquiries to the same professor.</li>
              <li>Automated follow-ups are restricted to a maximum of 2 gentle check-ins, spaced at least 7 days apart, and immediately suppressed if any reply is received.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#172033] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#B45309]" />
              3. Respect for Faculty Time & Recruiting Guidelines
            </h2>
            <p className="text-[#556070] font-light">
              Students are expected to respect departmental instructions. If a professor profile notes &quot;Admissions via departmental committee only&quot;, students should adhere to formal application procedures and tailor inquiries accordingly.
            </p>
          </div>
        </div>

        <div className="pt-8 text-center border-t border-[#E5E7EB]">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded font-medium bg-[#3157A4] hover:bg-[#254587] text-white text-xs shadow-sm transition-colors"
          >
            Explore Verified Faculty Directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

