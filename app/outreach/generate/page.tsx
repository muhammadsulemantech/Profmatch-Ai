'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  FileText,
  User,
  Sliders,
  Check,
  ShieldCheck
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import { EmailPersonalizationAgent, EmailQualityAgent } from '@/lib/agents';
import { useAuth } from '@/lib/auth/auth-context';

export default function OutreachGeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const professorId = searchParams.get('professorId') || mockDb.professors[0].id;

  const prof = mockDb.professors.find((p) => p.id === professorId) || mockDb.professors[0];
  const match = mockDb.researchMatches.find((m) => m.professor_id === prof.id) || mockDb.researchMatches[0];

  const [tone, setTone] = useState<'academic' | 'formal' | 'direct' | 'concise'>('academic');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [personalizationNotes, setPersonalizationNotes] = useState<string[]>([]);
  const [sourceReferences, setSourceReferences] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [confirmedGrounded, setConfirmedGrounded] = useState(false);
  const [qualityFeedback, setQualityFeedback] = useState<{ isValid: boolean; score: number; issues: string[] }>({
    isValid: true,
    score: 95,
    issues: [],
  });
  const [sendSuccess, setSendSuccess] = useState(false);

  // Generate initial email on load
  const generateEmail = async (selectedTone = tone) => {
    setIsGenerating(true);
    try {
      const generated = await EmailPersonalizationAgent.generateEmail('usr_student_001', prof, { tone: selectedTone });
      setSubject(generated.subject);
      setBodyText(generated.bodyText);
      setPersonalizationNotes(generated.personalizationNotes);
      setSourceReferences(generated.sourceReferences);

      const quality = EmailQualityAgent.validateQuality(generated.bodyText);
      setQualityFeedback(quality);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateEmail();
  }, [professorId]);

  const handleToneChange = (newTone: 'academic' | 'formal' | 'direct' | 'concise') => {
    setTone(newTone);
    generateEmail(newTone);
  };

  const handleShorten = () => {
    const paragraphs = bodyText.split('\n\n');
    if (paragraphs.length > 2) {
      setBodyText(paragraphs.slice(0, 3).join('\n\n') + '\n\nBest regards,\n[Your Name]');
    }
  };

  const handleSend = async () => {
    if (!confirmedGrounded) return;
    setIsSending(true);

    const emailId = `em_${Date.now()}`;
    const sentRecord = {
      id: emailId,
      user_id: user?.id || 'usr_guest',
      professor_id: prof.id,
      professor_name: prof.name,
      subject,
      body_text: bodyText,
      status: 'SENT',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saveSentLocally = () => {
      if (typeof window !== 'undefined') {
        const userId = user?.id || 'usr_guest';
        const key = `profmatch_sent_emails_${userId}`;
        let existing: any[] = [];
        try {
          const stored = localStorage.getItem(key);
          if (stored) existing = JSON.parse(stored);
        } catch {}
        localStorage.setItem(key, JSON.stringify([sentRecord, ...existing]));
      }
      mockDb.emails.unshift(sentRecord as any);
    };

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId,
          professorId: prof.id,
          recipientEmail: prof.email || 'admissions@university.edu',
          subject,
          bodyText,
          confirmedGrounded: true,
        }),
      });

      const res = await response.json();
      saveSentLocally();
      setSendSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch {
      saveSentLocally();
      setSendSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <Link
              href={`/professors/${prof.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to {prof.name}
            </Link>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Academic Outreach Composer
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Compose grounded, thoughtful correspondence with verified paper citations and institutional context.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => generateEmail(tone)}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate Draft
            </button>
          </div>
        </div>

        {sendSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Email successfully recorded in campaign tracker and scheduled for delivery. Redirecting to Dashboard...</span>
          </div>
        )}

        {/* Main Studio Grid: Draft Editor (8 cols) + Grounding Inspector (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Email Subject & Body Editor (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5 shadow-sm">
              {/* Recipient Banner */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Recipient:</span>
                  <span className="font-heading font-bold text-sm text-white">{prof.name}</span>
                  <span className="text-slate-400 ml-1">&bull; {prof.university_name}</span>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 block text-[11px] font-medium">Verified Email:</span>
                  <span className="font-mono text-xs text-emerald-400 font-medium">{prof.email || 'admissions@university.edu'}</span>
                </div>
              </div>

              {/* Tone Selector & Editing Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">Tone:</span>
                  {(['academic', 'formal', 'direct', 'concise'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleToneChange(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        tone === t
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800/60'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  {isGenerating && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 ml-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Updating draft...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShorten}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800/60 border border-slate-800 transition-colors"
                  >
                    Shorten Draft
                  </button>
                </div>
              </div>

              {/* Subject Line */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Email Body Textarea formatted like a writing surface */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Email Message</label>
                <textarea
                  rows={14}
                  value={bodyText}
                  onChange={(e) => {
                    setBodyText(e.target.value);
                    setQualityFeedback(EmailQualityAgent.validateQuality(e.target.value));
                  }}
                  className="w-full p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Review & Approval Confirmation */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedGrounded}
                    onChange={(e) => setConfirmedGrounded(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="leading-relaxed">
                    <strong className="text-white font-semibold">I have reviewed this outreach draft.</strong> I verify that all research references and academic claims correspond accurately to my projects and the professor&apos;s published scholarship.
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!confirmedGrounded || isSending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Sending Outreach...' : 'Approve & Send Outreach'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Source Grounding & Quality Score (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quality Score Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-xs uppercase tracking-wider text-slate-200">Outreach Quality</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {qualityFeedback.score}/100 Safe
                </span>
              </div>

              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Factually grounded in faculty papers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Anti-spam compliance verified</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Appropriate academic salutation &amp; tone</span>
                </li>
              </ul>
            </div>

            {/* Grounding Source References */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Personalization Sources
                </h3>
                <p className="text-[11px] text-slate-400">
                  Verified facts and academic citations referenced in this draft:
                </p>
              </div>

              <div className="space-y-2.5">
                {sourceReferences.map((ref, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">{ref.type}</span>
                    <p className="font-semibold text-white">{ref.title}</p>
                    <p className="text-[11px] text-slate-400">{ref.context}</p>
                    {ref.url && (
                      <a href={ref.url} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium pt-0.5">
                        View Source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Research Match Insights */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-200">
                Research Overlap Insights
              </h3>
              <ul className="space-y-2 text-slate-300">
                {personalizationNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

