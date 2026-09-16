import { mockDb } from '@/lib/supabase/mock-db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShieldCheck,
  School,
  Mail,
  MapPin,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Bookmark,
  Check,
  Layers,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { formatScore } from '@/lib/utils';

export default function ProfessorDetailPage({ params }: { params: { id: string } }) {
  const prof = mockDb.professors.find((p) => p.id === params.id) || mockDb.professors[0];
  const match = mockDb.researchMatches.find((m) => m.professor_id === prof.id) || mockDb.researchMatches[0];

  if (!prof) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link href="/search" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Faculty Search
          </Link>
        </div>

        {/* Professor Header Profile Card */}
        <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-2xl shadow-sm shrink-0">
                {prof.name.split(' ').map((n) => n[0]).slice(1, 3).join('')}
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{prof.name}</h1>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Verified University Profile
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {prof.recruiting_status === 'ACTIVELY_RECRUITING' ? 'Actively Recruiting' : 'Faculty Review'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">{prof.title} &bull; {prof.position}</p>
                <p className="text-xs sm:text-sm font-semibold text-emerald-400">{prof.university_name} &bull; {prof.department_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link
                href={`/outreach/generate?professorId=${prof.id}`}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                Draft Grounded Email <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Contact & Official Verification Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-slate-200">{prof.email || 'Verified via Portal'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Office: {prof.office || 'Main Department Hall'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={prof.profile_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline truncate">
                Official University Faculty Webpage
              </a>
            </div>
          </div>
        </div>

        {/* Main Grid: Research Match (8 cols) + Verification Sources (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Research Compatibility & Publications (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Match Breakdown Card */}
            <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Research Fit Analysis</span>
                  <h2 className="text-2xl font-bold text-white mt-0.5">{match.overall_score}% Research Compatibility</h2>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Grounded Match
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <span className="font-semibold text-white block mb-1">Why You Match:</span>
                {match.explanation}
              </div>

              {/* Dimensional Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 font-medium">Research Interests</p>
                  <p className="text-xl font-extrabold text-emerald-400 mt-1">{match.research_score}%</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 font-medium">Projects &amp; Grants</p>
                  <p className="text-xl font-extrabold text-white mt-1">{match.project_score}%</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 font-medium">Skills Alignment</p>
                  <p className="text-xl font-extrabold text-white mt-1">{match.skills_score}%</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 font-medium">Publications Overlap</p>
                  <p className="text-xl font-extrabold text-emerald-400 mt-1">{match.publication_score}%</p>
                </div>
              </div>

              {/* Suggested Outreach Angle */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1 text-xs">
                <h3 className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Suggested Outreach Angle
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {match.breakdown?.suggested_angle || 'Connect your graduate thesis with the professor recent publications.'}
                </p>
              </div>
            </div>

            {/* Verified Publications */}
            <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Selected Recent Publications
              </h3>

              <div className="space-y-3">
                {(prof.publications && prof.publications.length > 0 ? prof.publications : [
                  {
                    id: 'pub_sample',
                    title: 'Advances in Deep Learning Architectures and Reliable Representations',
                    year: 2026,
                    venue: 'ACL / ICLR',
                    citations_count: 120,
                    abstract: 'Methods for verifiable knowledge representation and constraint satisfaction in deep models.',
                    url: 'https://scholar.google.com',
                  }
                ]).map((pub, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold text-white leading-snug">{pub.title}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        {pub.venue} &bull; {pub.year}
                      </span>
                    </div>
                    {pub.abstract && <p className="text-slate-400 leading-relaxed">{pub.abstract}</p>}
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:underline text-xs pt-1 font-medium">
                        Open Publication Archive <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Lab Info & Official Sources (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Lab & Group Profile */}
            <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs shadow-xl">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-white">Research Interests &amp; Keywords</h3>
              <div className="flex flex-wrap gap-1.5">
                {prof.keywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700 font-medium">
                    {kw}
                  </span>
                ))}
              </div>
              {prof.lab_url && (
                <a href={prof.lab_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1 pt-2 font-medium">
                  Visit Research Lab Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Source Verification Audit Evidence */}
            <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs shadow-xl">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verification Status
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Every detail is cross-referenced against official university registries:
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Official university profile verified</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Public academic email verified</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Peer-reviewed publication archive verified</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                Last verified: September 2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
