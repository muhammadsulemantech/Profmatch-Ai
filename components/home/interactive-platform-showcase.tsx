'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Mail,
  BarChart3,
  ShieldCheck,
  Check,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { mockDb } from '@/lib/supabase/mock-db';

export default function InteractivePlatformShowcase() {
  const [activeTab, setActiveTab] = useState<'match' | 'papers' | 'proposal' | 'pipeline'>('match');
  const [selectedField, setSelectedField] = useState('All Fields');

  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    identifiedFaculty: 24,
    identifiedSubtext: '+4 this week',
    inquiriesSent: 8,
    inquiriesSubtext: 'Custom verified crafts',
    repliesReceived: 5,
    repliesSubtext: '62.5% response rate',
    interviewsScheduled: 2,
    interviewsSubtext: 'TUM • ETH Zurich'
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setStats({
        identifiedFaculty: 24,
        identifiedSubtext: '+4 this week',
        inquiriesSent: 8,
        inquiriesSubtext: 'Custom verified crafts',
        repliesReceived: 5,
        repliesSubtext: '62.5% response rate',
        interviewsScheduled: 2,
        interviewsSubtext: 'TUM • ETH Zurich'
      });
      return;
    }

    // 1. Saved Faculty / Identified Faculty count
    const savedKey = `profmatch_saved_profs_${user.id}`;
    let savedIds: string[] = [];
    try {
      const storedSaved = localStorage.getItem(savedKey);
      if (storedSaved) savedIds = JSON.parse(storedSaved);
    } catch {}
    const savedCount = savedIds.length;

    // 2. Sent Inquiries count
    const sentKey = `profmatch_sent_emails_${user.id}`;
    let localSent: any[] = [];
    try {
      const storedSent = localStorage.getItem(sentKey);
      if (storedSent) localSent = JSON.parse(storedSent);
    } catch {}
    const mockUserEmails = mockDb.emails.filter(e => e.user_id === user.id);
    const combinedEmailsMap = new Map();
    [...localSent, ...mockUserEmails].forEach(e => combinedEmailsMap.set(e.id || e.email_id || Math.random(), e));
    const userEmails = Array.from(combinedEmailsMap.values());
    const sentCount = userEmails.length;

    // 3. Replies Received & Response Rate
    const userReps = mockDb.replies.filter(r => {
      const matchingEmail = mockDb.emails.find(e => e.id === r.email_id);
      return matchingEmail?.user_id === user.id;
    });
    const repliesCount = userReps.length;
    const respRate = sentCount > 0 ? Math.round((repliesCount / sentCount) * 100) : 0;

    // 4. Interviews Scheduled / Active Pipeline
    const appKey = `profmatch_user_applications_${user.id}`;
    let localApps: any[] = [];
    try {
      const storedApps = localStorage.getItem(appKey);
      if (storedApps) localApps = JSON.parse(storedApps);
    } catch {}
    const mockUserApps = mockDb.applications.filter(a => a.user_id === user.id);
    const combinedAppsMap = new Map();
    [...localApps, ...mockUserApps].forEach(a => combinedAppsMap.set(a.id, a));
    const userApps: any[] = Array.from(combinedAppsMap.values());
    const interviewApps = userApps.filter(a => a.status === 'Interviewing' || a.status === 'Offer');
    const positiveReplies = userReps.filter(r => r.sentiment === 'POSITIVE');
    const interviewsCount = Math.max(interviewApps.length, positiveReplies.length);

    setStats({
      identifiedFaculty: savedCount,
      identifiedSubtext: savedCount > 0 ? `${savedCount} saved in workspace` : '0 saved in workspace',
      inquiriesSent: sentCount,
      inquiriesSubtext: sentCount > 0 ? 'Verified email crafts' : 'No outreach sent yet',
      repliesReceived: repliesCount,
      repliesSubtext: sentCount > 0 ? `${respRate}% response rate` : '0% response rate',
      interviewsScheduled: interviewsCount,
      interviewsSubtext: interviewsCount > 0 ? 'Active candidate pipeline' : 'Pending offers'
    });
  }, [isAuthenticated, user]);

  return (
    <div className="mt-12 max-w-6xl mx-auto rounded-2xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-2xl shadow-emerald-500/5 overflow-hidden">
      {/* Console Header Bar */}
      <div className="bg-slate-900/90 px-5 py-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          <span className="ml-2 font-sans font-medium text-slate-200">
            ProfMatch Intelligence Engine &bull; Live Console
          </span>
        </div>

        {/* Console Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('match')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'match'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:inline">Faculty</span> Matching
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('papers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'papers'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paper &amp;</span> Grants
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('proposal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'proposal'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Precision</span> Proposal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Application</span> Pipeline
          </button>
        </div>
      </div>

      {/* Console Interactive Body */}
      <div className="p-6 sm:p-8">
        {/* TAB 1: SMART FACULTY MATCHING */}
        {activeTab === 'match' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  AI-Assisted Compatibility Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Semantic synthesis between candidate research background and verified active faculty laboratories.
                </p>
              </div>
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shrink-0 shadow-lg shadow-emerald-500/15"
              >
                <Search className="w-3.5 h-3.5" />
                Explore 50,000+ Professors
              </Link>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1 font-medium">Topic Focus:</span>
              {['All Fields', 'Quantum Algorithms', 'Clean Energy', 'Embodied Robotics', 'Biomedical AI'].map(field => (
                <button
                  key={field}
                  type="button"
                  onClick={() => setSelectedField(field)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    selectedField === field
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {field}
                </button>
              ))}
            </div>

            {/* Two Faculty Match Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1 */}
              <div className="p-5 rounded-xl bg-slate-905/60 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 group bg-slate-900/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-base group-hover:text-emerald-400 transition-colors">
                        Prof. Elena Rostova
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        98% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      ETH Zurich &bull; Quantum Computing &amp; Systems
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Zurich, Switzerland &bull; Verified .ch Academic Faculty
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-sm shrink-0">
                    ER
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="text-emerald-400 font-medium">Research Synergy:</span>
                    <span>Grant: ERC Advanced 2025&ndash;2029</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Direct overlap with your published thesis on fault-tolerant tensor networks and Hamiltonian simulations.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['Quantum Fault-Tolerance', 'Tensor Networks', 'NISQ Simulation'].map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/70 text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                    <Check className="w-3 h-3" /> 2 PhD Openings (Funded)
                  </span>
                  <Link
                    href="/search"
                    className="text-slate-300 hover:text-white font-medium inline-flex items-center gap-1 text-xs transition-colors"
                  >
                    View Faculty &rarr;
                  </Link>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 group">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-base group-hover:text-cyan-400 transition-colors">
                        Dr. Marcus Vance
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        95% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Stanford University &bull; Artificial Intelligence Laboratory
                    </p>
                    <p className="text-[11px] text-slate-400">
                      California, US &bull; Verified .edu Academic Faculty
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-sm shrink-0">
                    MV
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="text-cyan-400 font-medium">Research Synergy:</span>
                    <span>NSF Grant #240182</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Overlaps with his 2026 CoRL robotics conference publication on vision-language policy fine-tuning.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['Embodied AI', 'Reinforcement Learning', 'Visual Manipulation'].map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/70 text-xs">
                  <span className="inline-flex items-center gap-1 text-cyan-400 text-[11px]">
                    <Check className="w-3 h-3" /> Recruiting Fall 2027
                  </span>
                  <Link
                    href="/search"
                    className="text-slate-300 hover:text-white font-medium inline-flex items-center gap-1 text-xs transition-colors"
                  >
                    View Faculty &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAPERS & GRANTS */}
        {activeTab === 'papers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Scholarly Attributed Publications &amp; Active Grants
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every recommendation links directly to DOI, institutional repositories, and active laboratory awards.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Peer-Reviewed Verification
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  IEEE Transactions on Sustainable Energy (2026)
                </span>
                <span className="text-xs text-slate-400">DOI: 10.1109/TSTE.2026.0491</span>
              </div>
              <h4 className="text-base font-semibold text-white">
                Decentralized Microgrid Dispatch with Deep Reinforcement Learning and Solid-State Storage
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Authors: Dr. Anna Keller, Dr. Thomas Lindholm &bull; Technical University of Munich
              </p>
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-emerald-400">Extracted Key Insights:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>Focus on non-convex optimization in low-inertia microgrids</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>$1.8M Horizon Europe Grant &ldquo;CleanGrid-Next&rdquo; active</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>Open lab software repository on GitHub with active benchmarks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>Actively seeking PhD candidates with Python/PyTorch modeling skills</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRECISION PROPOSAL */}
        {activeTab === 'proposal' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  Fact-Grounded Academic Inquiry Letter
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Anti-spam, dignity-first inquiry citing specific recent papers, lab milestones, and candidate background.
                </p>
              </div>
              <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" /> No Spam Guarantee
              </span>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 font-sans space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="border-b border-slate-800 pb-3 space-y-1 font-mono text-[11px] text-slate-400">
                <div><span className="text-slate-500">To:</span> a.keller@tum.de (Official TUM Institutional Directory)</div>
                <div><span className="text-slate-500">Subject:</span> Prospective PhD Research &bull; Synergy with Decentralized Microgrid Dispatch (IEEE 2026)</div>
              </div>

              <p>Dear Professor Keller,</p>
              <p>
                I recently studied your team&apos;s paper in <em className="text-emerald-300">IEEE Transactions on Sustainable Energy (2026)</em> addressing decentralized solid-state storage dispatch. Your formulation of non-convex constraints under transient dynamics offered a particularly compelling solution to battery degradation trade-offs.
              </p>
              <p>
                During my Master&apos;s thesis, I formulated a multi-agent reinforcement learning approach for low-inertia distribution grids, achieving a 14% reduction in peak-hour transmission stress. Given your group&apos;s current CleanGrid-Next funding, I am writing to inquire if you are considering prospective PhD candidates for Fall 2027.
              </p>
              <p>
                I have attached my academic CV and summary of publications for your review. Thank you for your time and continued contributions to the discipline.
              </p>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                <span className="text-emerald-400 font-medium">&check; Tailored to Professor&apos;s verified grant &amp; recent paper</span>
                <span>Drafted in accordance with ethical outreach standards</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: APPLICATION PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Candidate Workspace &amp; Decision Pipeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Keep track of prospective advisors, email cadences, reply tracking, and interview offers in one place.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
              >
                Open Full Workspace &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-2xl font-bold text-white">{stats.identifiedFaculty}</div>
                <div className="text-xs text-slate-400 mt-1">Identified Faculty</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">{stats.identifiedSubtext}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-2xl font-bold text-white">{stats.inquiriesSent}</div>
                <div className="text-xs text-slate-400 mt-1">Inquiries Sent</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{stats.inquiriesSubtext}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.repliesReceived}</div>
                <div className="text-xs text-slate-400 mt-1">Replies Received</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">{stats.repliesSubtext}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 bg-emerald-500/5 text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.interviewsScheduled}</div>
                <div className="text-xs text-emerald-300 mt-1">Interviews Scheduled</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">{stats.interviewsSubtext}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Console Bottom Status Bar */}
      <div className="bg-slate-900/90 px-6 py-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Registry Live (50,000+ Profiles)
          </span>
          <span className="hidden sm:inline text-slate-500">&bull;</span>
          <span className="hidden sm:inline">190+ Countries Supported</span>
        </div>
        <Link
          href="/search"
          className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors"
        >
          Search Faculty In Your Field
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
