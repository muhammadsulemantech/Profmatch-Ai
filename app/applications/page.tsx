import { mockDb } from '@/lib/supabase/mock-db';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Calendar,
  ExternalLink,
  Plus,
  FileText,
  Clock,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export const metadata = { title: 'Application Tracker — ProfMatch AI' };

export default function ApplicationsPage() {
  const applications = mockDb.applications;

  // Academic status styling
  const statusStyles: Record<string, { badge: string; dot: string }> = {
    Researching: { badge: 'bg-[#F1F2EE] text-[#556070] border-[#E5E7EB]', dot: 'bg-neutral-400' },
    Shortlisted: { badge: 'bg-[#EBF2FE] text-[#3157A4] border-[#D1E0FC]', dot: 'bg-[#3157A4]' },
    Contacted: { badge: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]', dot: 'bg-[#16a34a]' },
    Replied: { badge: 'bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A]', dot: 'bg-[#ca8a04]' },
    Positive: { badge: 'bg-[#EBF8F5] text-[#226357] border-[#C8ECE3]', dot: 'bg-[#5C8F86]' },
    Applied: { badge: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]', dot: 'bg-[#9333ea]' },
    Interview: { badge: 'bg-[#FFF7ED] text-[#9A3412] border-[#FFEDD5]', dot: 'bg-[#ea580c]' },
    Offer: { badge: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]', dot: 'bg-[#15803D]' },
    Rejected: { badge: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]', dot: 'bg-[#ef4444]' },
  };

  const stages = [
    { label: 'All Tracked', count: applications.length },
    { label: 'Shortlisted', count: applications.filter(a => a.status === 'Shortlisted').length },
    { label: 'Contacted', count: applications.filter(a => a.status === 'Contacted').length },
    { label: 'Applied', count: applications.filter(a => a.status === 'Applied').length },
    { label: 'Interview', count: applications.filter(a => a.status === 'Interview').length },
    { label: 'Offer', count: applications.filter(a => a.status === 'Offer').length },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#172033] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5C8F86] mb-1">
              <span>Graduate Admissions Tracker</span>
              <span className="text-neutral-300">•</span>
              <span>2026 / 2027 Cycle</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#172033] tracking-tight">
              Application & Outreach Pipeline
            </h1>
            <p className="text-sm text-[#556070] mt-1 font-light">
              Systematically monitor faculty contact, portal submissions, funding agreements, and official institutional deadlines.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="px-4 py-2 text-xs font-medium text-[#172033] bg-white border border-[#E5E7EB] rounded hover:bg-[#F1F2EE] transition-colors flex items-center gap-1.5 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-[#556070]" />
              Filter Pipeline
            </button>
            <button className="px-4 py-2 text-xs font-medium text-white bg-[#3157A4] hover:bg-[#254587] rounded transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              Add Application
            </button>
          </div>
        </div>

        {/* Stage summary counts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((stg, i) => (
            <div key={i} className="bg-white border border-[#E5E7EB] p-3 rounded shadow-sm hover:border-[#3157A4]/30 transition-colors">
              <span className="text-[11px] font-medium text-[#556070] block">{stg.label}</span>
              <span className="text-xl font-serif font-bold text-[#172033] mt-0.5 block">{stg.count}</span>
            </div>
          ))}
        </div>

        {/* Main Applications Table */}
        <div className="bg-white border border-[#E5E7EB] rounded shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB] bg-[#FAF9F5] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Active Institutional Files ({applications.length})
            </h2>
            <span className="text-[11px] text-[#556070]">
              Automated reminder sync active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#F8F7F3] border-b border-[#E5E7EB] text-[#556070] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3">University & Program</th>
                  <th className="px-5 py-3">Faculty Advisor</th>
                  <th className="px-5 py-3">Intake</th>
                  <th className="px-5 py-3">Submission Deadline</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Funding Type</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {applications.map((app) => {
                  const style = statusStyles[app.status] || statusStyles.Shortlisted;
                  return (
                    <tr key={app.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#172033] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#5C8F86] shrink-0" />
                          <span>{app.university_name}</span>
                        </div>
                        <div className="text-[11px] text-[#556070] mt-0.5">
                          {app.program_name}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#172033]">
                        {app.professor_name ? (
                          <Link href={`/professors/${app.professor_id}`} className="text-[#3157A4] hover:underline font-medium flex items-center gap-1">
                            {app.professor_name}
                            <ArrowUpRight className="w-3 h-3 opacity-60" />
                          </Link>
                        ) : (
                          <span className="text-[#8C95A6] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#556070] font-medium">
                        {app.intake || 'Fall 2026'}
                      </td>
                      <td className="px-5 py-4 text-[#172033]">
                        {app.deadline ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#8C95A6]" />
                            <span className="font-mono text-[11px]">
                              {new Date(app.deadline).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#8C95A6]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${style.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] text-[#172033] bg-[#F1F2EE] px-2 py-0.5 rounded border border-[#E5E7EB]">
                          {app.funding_status || 'Full RA / TA'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {app.portal_url && (
                            <a
                              href={app.portal_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open University Application Portal"
                              className="p-1.5 text-[#556070] hover:text-[#3157A4] hover:bg-[#F1F2EE] rounded border border-transparent hover:border-[#E5E7EB] transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Link
                            href={app.professor_id ? `/outreach/generate?profId=${app.professor_id}` : '/outreach/generate'}
                            title="Compose Outreach Draft"
                            className="p-1.5 text-[#556070] hover:text-[#3157A4] hover:bg-[#F1F2EE] rounded border border-transparent hover:border-[#E5E7EB] transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {applications.length === 0 && (
            <div className="p-12 text-center text-xs text-[#556070]">
              No applications tracked yet. Start by discovering professors on the search page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

