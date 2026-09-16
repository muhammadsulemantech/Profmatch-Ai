'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Check,
  Search,
  Bookmark,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import { formatScore } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { Professor } from '@/types/database';

export default function CampaignsPage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();

  const [savedProfessors, setSavedProfessors] = useState<Professor[]>([]);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!user) {
      setSavedProfessors([]);
      setSentEmails([]);
      setReplies([]);
      return;
    }

    const isSampleDemoStudent = user.id === 'usr_student_001';

    // 1. Saved Professors
    const savedKey = `profmatch_saved_profs_${user.id}`;
    let savedIds: string[] = [];
    try {
      const storedSaved = localStorage.getItem(savedKey);
      if (storedSaved) savedIds = JSON.parse(storedSaved);
    } catch {}

    let userProfs: Professor[] = [];
    if (savedIds.length > 0) {
      userProfs = mockDb.professors.filter((p) => savedIds.includes(p.id));
    } else if (isSampleDemoStudent) {
      userProfs = mockDb.professors.slice(0, 4);
    }

    // 2. Sent Emails
    const sentKey = `profmatch_sent_emails_${user.id}`;
    let localSent: any[] = [];
    try {
      const storedSent = localStorage.getItem(sentKey);
      if (storedSent) localSent = JSON.parse(storedSent);
    } catch {}

    const mockUserEmails = mockDb.emails.filter((e) => e.user_id === user.id);
    const combinedEmailsMap = new Map();
    [...localSent, ...mockUserEmails].forEach((e) =>
      combinedEmailsMap.set(e.id || e.email_id || Math.random(), e)
    );
    const userEmailsList = Array.from(combinedEmailsMap.values());

    if (isSampleDemoStudent && userEmailsList.length === 0) {
      setSentEmails(mockDb.emails);
      setReplies(mockDb.replies);
    } else {
      setSentEmails(userEmailsList);
      const userReps = mockDb.replies.filter((r) => {
        const matchingEmail = mockDb.emails.find((e) => e.id === r.email_id);
        return matchingEmail?.user_id === user.id;
      });
      setReplies(userReps);
    }

    setSavedProfessors(userProfs);
  }, [user]);

  // Derive pipeline list of professors (combine saved & emailed)
  const pipelineProfMap = new Map<string, Professor>();
  savedProfessors.forEach((p) => pipelineProfMap.set(p.id, p));
  sentEmails.forEach((e) => {
    const prof = mockDb.professors.find((p) => p.id === e.professor_id);
    if (prof) pipelineProfMap.set(prof.id, prof);
  });
  const pipelineProfessors = Array.from(pipelineProfMap.values());

  const shortlistedCount = savedProfessors.length;
  const emailsSentCount = sentEmails.length;
  const repliesCount = replies.length;
  const followupsDueCount = sentEmails.filter(e => e.status === 'SENT' || e.status === 'DELIVERED').length;

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block">
              Outreach Management
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-white mt-0.5">
              Faculty Outreach Campaigns
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Monitor email pipelines, scheduled follow-ups, and professor replies across targeted admissions cycles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => requireAuth('create new campaign', () => router.push('/search'))}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>

        {/* Campaign Container */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-xl font-bold text-white">
                  Global Verified Faculty Outreach — Fall 2027
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Global campaign connecting with verified faculty across USA, Europe, and Asia for funded graduate supervision.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Target Intake: <strong className="text-emerald-400 font-semibold">Fall 2027</strong>
            </div>
          </div>

          {/* Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center space-y-1">
              <p className="text-xs font-medium text-slate-400">Shortlisted Faculty</p>
              <p className="font-heading text-3xl font-bold text-white">{shortlistedCount}</p>
            </div>
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center space-y-1">
              <p className="text-xs font-medium text-slate-400">Emails Sent</p>
              <p className="font-heading text-3xl font-bold text-white">{emailsSentCount}</p>
            </div>
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center space-y-1">
              <p className="text-xs font-medium text-slate-400">Faculty Replies</p>
              <p className="font-heading text-3xl font-bold text-emerald-400">{repliesCount}</p>
            </div>
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center space-y-1">
              <p className="text-xs font-medium text-slate-400">Follow-ups Due</p>
              <p className="font-heading text-3xl font-bold text-amber-400">{followupsDueCount}</p>
            </div>
          </div>

          {/* Outreach Pipeline Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Outreach Pipeline Table
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {pipelineProfessors.length} faculty in pipeline
              </span>
            </div>

            {pipelineProfessors.length > 0 ? (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="px-4 py-3.5">Professor</th>
                      <th className="px-4 py-3.5">University</th>
                      <th className="px-4 py-3.5">Match</th>
                      <th className="px-4 py-3.5">Email</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Last Contact</th>
                      <th className="px-4 py-3.5">Next Follow-up</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                    {pipelineProfessors.map((prof) => {
                      const match = mockDb.researchMatches.find((m) => m.professor_id === prof.id);
                      const emailRecord = sentEmails.find((e) => e.professor_id === prof.id);
                      const replyRecord = replies.find((r) => r.professor_id === prof.id);

                      let statusText = 'Shortlisted (Draft)';
                      let statusStyle = 'bg-slate-800 text-slate-300 border border-slate-700';

                      if (replyRecord) {
                        statusText = 'Replied (Positive)';
                        statusStyle = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
                      } else if (emailRecord) {
                        statusText = 'Sent & Delivered';
                        statusStyle = 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
                      }

                      const lastContact = emailRecord?.sent_at
                        ? new Date(emailRecord.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—';

                      const nextFollowup = emailRecord
                        ? 'Due in 7 days'
                        : 'Draft Ready';

                      return (
                        <tr key={prof.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-white">
                            <Link href={`/professors/${prof.id}`} className="hover:text-emerald-400 font-bold transition-colors">
                              {prof.name}
                            </Link>
                            <span className="block text-[11px] text-slate-400 font-normal">{prof.title}</span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">
                            {prof.university_name}
                          </td>
                          <td className="px-4 py-3.5">
                            {match ? (
                              <span className="font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                                {formatScore(match.overall_score)}
                              </span>
                            ) : (
                              <span className="font-semibold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                                94%
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                            {prof.email || 'admissions@university.edu'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusStyle}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {lastContact}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {nextFollowup}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Link
                              href={`/outreach/generate?professorId=${prof.id}`}
                              className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold text-xs"
                            >
                              {emailRecord ? 'View Outreach' : 'Draft Email'}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="font-heading font-bold text-base text-white">No Faculty in Outreach Pipeline Yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Discover verified professors matching your degree and research interests, save them to your campaign shortlist, and prepare personalized outreach emails.
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all shadow-md shadow-emerald-500/20"
                >
                  <Search className="w-3.5 h-3.5" /> Discover Professors &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

