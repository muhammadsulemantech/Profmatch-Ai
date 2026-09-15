import { mockDb } from '@/lib/supabase/mock-db';
import Link from 'next/link';
import {
  Layers,
  Mail,
  CheckCircle2,
  ArrowRight,
  Plus,
  MessageSquare,
  Send,
  Clock,
  ExternalLink,
  Check
} from 'lucide-react';
import { formatScore } from '@/lib/utils';

export const metadata = { title: 'Outreach Campaigns — ProfMatch AI' };

export default function CampaignsPage() {
  const campaigns = mockDb.campaigns;
  const emails = mockDb.emails;
  const professors = mockDb.professors;
  const matches = mockDb.researchMatches;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8F7F3] text-[#172033]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5C8F86] block">
            Outreach Management
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#172033] mt-0.5">
            Faculty Outreach Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-[#525C6F]">
            Monitor email pipelines, scheduled follow-ups, and professor replies across targeted admissions cycles.
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-[#3157A4] hover:bg-[#264687] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {/* Campaigns Workflow */}
      <div className="space-y-8">
        {campaigns.map((campaign) => {
          const campaignEmails = emails.filter((e) => e.campaign_id === campaign.id);
          return (
            <div key={campaign.id} className="academic-card p-6 bg-white border border-[#E5E7EB] space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-serif text-xl font-bold text-[#172033]">{campaign.name}</h2>
                    <span className="badge-verified">
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#525C6F] mt-0.5">{campaign.description}</p>
                </div>
                <div className="text-xs text-[#525C6F]">
                  Target Intake: <strong className="text-[#172033]">{campaign.target_intake}</strong>
                </div>
              </div>

              {/* Restrained Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F8F7F3] rounded-lg border border-[#E5E7EB] text-center">
                  <p className="text-[11px] text-[#525C6F]">Shortlisted Faculty</p>
                  <p className="font-serif text-2xl font-bold text-[#172033] mt-0.5">{campaign.professors_count || 0}</p>
                </div>
                <div className="p-3 bg-[#F8F7F3] rounded-lg border border-[#E5E7EB] text-center">
                  <p className="text-[11px] text-[#525C6F]">Emails Sent</p>
                  <p className="font-serif text-2xl font-bold text-[#172033] mt-0.5">{campaign.emails_sent_count || 0}</p>
                </div>
                <div className="p-3 bg-[#F8F7F3] rounded-lg border border-[#E5E7EB] text-center">
                  <p className="text-[11px] text-[#525C6F]">Faculty Replies</p>
                  <p className="font-serif text-2xl font-bold text-[#355E57] mt-0.5">{campaign.replies_count || 0}</p>
                </div>
                <div className="p-3 bg-[#F8F7F3] rounded-lg border border-[#E5E7EB] text-center">
                  <p className="text-[11px] text-[#525C6F]">Follow-ups Due</p>
                  <p className="font-serif text-2xl font-bold text-[#B87333] mt-0.5">1</p>
                </div>
              </div>

              {/* Professional Campaign Table (Requirement #23) */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#172033]">
                  Outreach Pipeline Table
                </h3>

                <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8F7F3] border-b border-[#E5E7EB] text-[#525C6F] font-semibold">
                      <tr>
                        <th className="px-4 py-3">Professor</th>
                        <th className="px-4 py-3">University</th>
                        <th className="px-4 py-3">Match</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Last Contact</th>
                        <th className="px-4 py-3">Next Follow-up</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] bg-white">
                      {professors.slice(0, 4).map((prof, pIdx) => {
                        const match = matches.find((m) => m.professor_id === prof.id);
                        const emailRecord = campaignEmails.find((e) => e.professor_id === prof.id);
                        const status = emailRecord ? emailRecord.status : (pIdx === 0 ? 'REPLIED' : pIdx === 1 ? 'SENT' : 'SCHEDULED');
                        const lastContact = pIdx === 0 ? 'Sep 14, 2026' : pIdx === 1 ? 'Sep 12, 2026' : '—';
                        const nextFollowup = pIdx === 0 ? 'Interview Prep' : pIdx === 1 ? 'Sep 19, 2026' : 'Sep 16, 2026';

                        return (
                          <tr key={prof.id} className="hover:bg-[#F8F7F3] transition-colors">
                            <td className="px-4 py-3 font-medium text-[#172033]">
                              <Link href={`/professors/${prof.id}`} className="hover:text-[#3157A4] underline">
                                {prof.name}
                              </Link>
                              <span className="block text-[11px] text-[#525C6F] font-normal">{prof.title}</span>
                            </td>
                            <td className="px-4 py-3 text-[#525C6F]">
                              {prof.university_name}
                            </td>
                            <td className="px-4 py-3">
                              {match ? (
                                <span className="font-serif font-bold text-xs text-[#1D3667] bg-[#EEF2F9] px-2 py-0.5 rounded border border-[#C7D8F1]">
                                  {formatScore(match.overall_score)}
                                </span>
                              ) : (
                                <span className="text-[#9CA3AF]">92%</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-[#525C6F]">
                              {prof.email || 'admissions@university.edu'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                status === 'REPLIED'
                                  ? 'bg-[#F0F5F4] text-[#355E57] border border-[#CDE0DC]'
                                  : status === 'SENT' || status === 'DELIVERED'
                                  ? 'bg-[#EEF2F9] text-[#264687] border border-[#C7D8F1]'
                                  : 'bg-[#FEF7EE] text-[#9A5B13] border border-[#F3DFC2]'
                              }`}>
                                {status === 'REPLIED' ? 'Replied (Positive)' : status === 'SENT' ? 'Sent & Delivered' : 'Follow-up Due'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#525C6F]">
                              {lastContact}
                            </td>
                            <td className="px-4 py-3 text-[#525C6F]">
                              {nextFollowup}
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <Link
                                href={`/outreach/generate?professorId=${prof.id}`}
                                className="text-[#3157A4] hover:underline font-medium"
                              >
                                View Draft
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

