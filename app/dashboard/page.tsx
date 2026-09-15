'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockDb } from '@/lib/supabase/mock-db';
import { formatScore } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Search,
  Mail,
  CheckCircle2,
  Layers,
  ArrowRight,
  ExternalLink,
  Clock,
  Send,
  MessageSquare,
  Award,
  Bookmark,
  Calendar,
  Settings,
  CreditCard,
  Inbox,
  LayoutDashboard,
  Check,
  School,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Lock,
  LogOut,
  User,
  ShieldAlert
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, requireAuth } = useAuth();

  const student = mockDb.studentProfiles[0];
  const campaigns = mockDb.campaigns;
  const emails = mockDb.emails;
  const matches = mockDb.researchMatches;
  const replies = mockDb.replies;
  const applications = mockDb.applications;

  const displayName = user?.full_name || 'Alex Vance';
  const firstName = displayName.split(' ')[0];

  const handleProtectedAction = (actionName: string, path?: string, customFn?: () => void) => {
    requireAuth(actionName, () => {
      if (path) {
        router.push(path);
      } else if (customFn) {
        customFn();
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* PREVIEW MODE BANNER (Requirement #1 & #2) */}
        {!isAuthenticated && (
          <div className="mb-8 p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Workspace Preview Mode</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                    Interactive Demo
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  You are exploring the student research workspace in demo mode. Create a free account or sign in to query live faculty registries and prepare verified outreach.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleProtectedAction('activate your researcher account')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs transition-all shrink-0 shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Create Account / Sign In
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Research Workspace Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400 block">
                  {isAuthenticated ? 'Active Workspace' : 'Workspace Preview'}
                </span>
                <p className="font-heading font-bold text-base text-white mt-0.5">
                  {displayName}
                </p>
                <p className="text-xs text-slate-400">
                  {student.target_degree} &bull; {student.target_country}
                </p>
              </div>

              <nav className="space-y-1 text-xs font-medium">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  Overview
                </Link>

                <button
                  type="button"
                  onClick={() => handleProtectedAction('search verified faculty', '/search')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                >
                  <Search className="w-4 h-4" />
                  Discover Professors
                </button>

                <button
                  type="button"
                  onClick={() => handleProtectedAction('access your saved faculty shortlist', '/search')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                >
                  <Bookmark className="w-4 h-4" />
                  Saved Faculty
                </button>

                <button
                  type="button"
                  onClick={() => handleProtectedAction('manage research campaigns', '/campaigns')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                >
                  <Layers className="w-4 h-4" />
                  Campaigns
                </button>

                <button
                  type="button"
                  onClick={() => handleProtectedAction('track your graduate applications', '/applications')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                >
                  <Award className="w-4 h-4" />
                  Applications
                </button>

                <button
                  type="button"
                  onClick={() => handleProtectedAction('view faculty responses', '/inbox')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4" />
                    Messages
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    1 new
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProtectedAction('manage billing and invoices', '/billing')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                >
                  <CreditCard className="w-4 h-4" />
                  Billing
                </button>

                <button
                  type="button"
                  onClick={() => handleProtectedAction('edit profile and research preferences', '/profile')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </nav>

              {/* Logout button if authenticated */}
              {isAuthenticated && (
                <div className="pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Target Focus Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-200">
                Active Admission Target
              </h3>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Degree:</span>
                  <span className="font-medium text-white">{student.target_degree}</span>
                </div>
                <div className="flex justify-between">
                  <span>Domain:</span>
                  <span className="font-medium text-white">{student.desired_field}</span>
                </div>
                <div className="flex justify-between">
                  <span>Intake:</span>
                  <span className="font-medium text-emerald-400">Fall 2027</span>
                </div>
                <div className="flex justify-between">
                  <span>Geography:</span>
                  <span className="font-medium text-white">{student.target_country}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Large Workspace */}
          <main className="lg:col-span-9 space-y-8">
            {/* Contextual Greeting */}
            <div className="space-y-1 pb-4 border-b border-slate-800">
              <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
                Good morning, {firstName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Targeting <span className="font-semibold text-white">{student.target_degree} in {student.desired_field}</span> ({student.target_country}). You have 24 shortlisted faculty members aligned with your research profile.
              </p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-medium text-slate-400">Professors Shortlisted</span>
                <p className="font-heading text-3xl font-bold text-white">24</p>
                <span className="text-[11px] text-emerald-400 block font-medium">+2 this week</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-medium text-slate-400">Emails Sent</span>
                <p className="font-heading text-3xl font-bold text-white">8</p>
                <span className="text-[11px] text-slate-400 block font-medium">100% verified delivered</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-medium text-slate-400">Replies</span>
                <p className="font-heading text-3xl font-bold text-emerald-400">3</p>
                <span className="text-[11px] text-emerald-400 block font-medium">37.5% response rate</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-medium text-slate-400">Positive Responses</span>
                <p className="font-heading text-3xl font-bold text-cyan-400">2</p>
                <span className="text-[11px] text-cyan-400 block font-medium">1 interview scheduled</span>
              </div>
            </div>

            {/* Recent Positive Faculty Response Banner */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="badge-verified">
                    <Check className="w-3 h-3 text-emerald-400" /> Positive Advisor Reply
                  </span>
                  <span className="text-xs text-slate-400">Yesterday</span>
                </div>
                <h3 className="font-heading text-base font-bold text-white">
                  Dr. Greg Durrett &bull; University of Texas at Austin
                </h3>
                <p className="text-xs text-slate-300 max-w-xl italic">
                  &ldquo;...I am taking 1-2 new PhD students for Fall 2027 through the UT Austin CS admissions process. Please make sure to mention my lab in your statement of purpose...&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleProtectedAction('read full advisor reply', '/inbox')}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold shrink-0 transition-colors shadow-sm"
              >
                Open Reply
              </button>
            </div>

            {/* Main 2-Column: Top Matches (7 cols) + Follow-ups & Timeline (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left: Top Research-Compatible Faculty */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-white">
                      Recommended Research Matches
                    </h2>
                    <p className="text-xs text-slate-400">Ranked by publication overlap and lab alignment</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProtectedAction('search all faculty matches', '/search')}
                    className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Search all &rarr;
                  </button>
                </div>

                <div className="space-y-3.5">
                  {mockDb.professors.slice(0, 3).map((prof) => {
                    const match = matches.find((m) => m.professor_id === prof.id);
                    return (
                      <div
                        key={prof.id}
                        className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-heading font-bold text-emerald-400 text-sm shrink-0">
                              {prof.name.split(' ').map((n) => n[0]).slice(1, 3).join('')}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleProtectedAction(`view profile for ${prof.name}`, `/professors/${prof.id}`)}
                                className="font-heading text-base font-bold text-white hover:text-emerald-400 transition-colors text-left"
                              >
                                {prof.name}
                              </button>
                              <p className="text-xs text-slate-400">{prof.title}</p>
                              <p className="text-xs text-emerald-400 font-medium">{prof.university_name}</p>
                            </div>
                          </div>

                          {match && (
                            <div className="bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded text-right">
                              <span className="font-heading font-bold text-sm text-emerald-400 block leading-none">
                                {formatScore(match.overall_score)}
                              </span>
                              <span className="text-[9px] uppercase font-semibold text-emerald-500">Match</span>
                            </div>
                          )}
                        </div>

                        {/* Why this match */}
                        {match && (
                          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                            <span className="font-semibold text-emerald-400">Overlap: </span>
                            {match.explanation}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Verified institutional profile
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleProtectedAction(`view profile for ${prof.name}`, `/professors/${prof.id}`)}
                              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 transition-colors"
                            >
                              Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProtectedAction(`draft outreach for ${prof.name}`, `/outreach/generate?professorId=${prof.id}`)}
                              className="text-xs text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-3 py-1 rounded-lg font-semibold transition-colors"
                            >
                              Draft Email
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Upcoming Follow-ups & Activity Timeline */}
              <div className="lg:col-span-5 space-y-6">
                {/* Upcoming Follow-ups */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="font-heading text-base font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      Upcoming Outreach Actions
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-white">Follow-up with Prof. Durrett</span>
                        <span className="text-emerald-400">Tomorrow</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Send research proposal summary for Fall 2027 lab openings.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-white">Stanford CS Portal Deadline</span>
                        <span className="text-amber-400">Dec 15, 2026</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Submit official transcript and letters of recommendation.</p>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                  <h3 className="font-heading text-base font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Recent Research Activity
                  </h3>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-white">Email draft approved for Dr. Anna Keller</p>
                        <p className="text-[11px] text-slate-400">3 hours ago &bull; Technical University of Munich</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-white">Added 4 faculty to Renewable Energy campaign</p>
                        <p className="text-[11px] text-slate-400">Yesterday &bull; ETH Zurich &amp; TU Munich</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-white">Created graduate profile target: Fall 2027 MS</p>
                        <p className="text-[11px] text-slate-400">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
