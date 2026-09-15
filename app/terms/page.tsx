export const metadata = {
  title: 'Terms of Service — ProfMatch AI',
  description: 'Terms of Service governing the use of ProfMatch AI platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#172033] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-sm leading-relaxed">
        <div className="space-y-4 border-b border-[#E5E7EB] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#F1F2EE] text-[#5C8F86] border border-[#E5E7EB]">
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#172033] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-[#556070]">Effective Date: September 2026 &bull; Revision 2.4</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-base font-serif font-bold text-[#172033]">1. Permitted Use</h2>
            <p className="text-[#556070] font-light leading-relaxed">
              ProfMatch AI provides tools for graduate admissions research, faculty discovery, and personal academic outreach. Users agree to utilize the platform in accordance with the Responsible Outreach Guidelines and applicable institutional communication standards.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-base font-serif font-bold text-[#172033]">2. Prohibited Conduct</h2>
            <p className="text-[#556070] font-light leading-relaxed">
              Automated scraping of our platform, unauthorized account credential sharing, distributing malicious content, sending unsolicited bulk spam, or attempting to compromise server security is strictly forbidden and subject to immediate account revocation.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-base font-serif font-bold text-[#172033]">3. Disclaimer of Admission Outcomes</h2>
            <p className="text-[#556070] font-light leading-relaxed">
              ProfMatch AI provides matching analytics and outreach drafting assistance based on public scholarly data. We do not guarantee university admission, graduate assistantship funding, or responses from specific faculty members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

