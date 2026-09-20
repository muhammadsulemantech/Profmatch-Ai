'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Search,
  Sparkles,
  Send,
  Pause,
  Play,
  Square,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Loader2,
  Terminal,
  Building2,
  ExternalLink,
  ChevronRight,
  Flame,
  Globe,
  GraduationCap,
  Layers,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { getAllCountries } from '@/lib/geography/global-geography';
import { ACADEMIC_DOMAINS } from '@/lib/taxonomy/academic-taxonomy';

interface TerminalLog {
  id: string;
  time: string;
  type: 'INFO' | 'SEARCH' | 'AI' | 'SEND' | 'WAIT' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
}

interface ContactedProfRecord {
  id: string;
  name: string;
  university: string;
  country: string;
  email: string;
  subject: string;
  sentAt: string;
  sentVia: string;
  draftUrl?: string;
}

export default function AutoPilotPage() {
  const { user } = useAuth();
  const userId = user?.id || 'usr_student_001';

  const countries = React.useMemo(() => getAllCountries(), []);

  // Campaign Configuration State
  const [targetCountry, setTargetCountry] = useState('United States');
  const [targetDegree, setTargetDegree] = useState('PhD');
  const [academicDomain, setAcademicDomain] = useState('Computing, Artificial Intelligence & Informatics');
  const [discipline, setDiscipline] = useState('Artificial Intelligence & NLP');
  const [keywordsText, setKeywordsText] = useState('Large Language Models, AI Reasoning, Multi-Agent Systems');
  const [batchLimit, setBatchLimit] = useState<number>(10);
  const [cooldownSec, setCooldownSec] = useState<number>(60);
  const [tone, setTone] = useState<'academic' | 'concise' | 'inquisitive'>('academic');

  // Safeguard Consent State
  const [hasAuthorized, setHasAuthorized] = useState(false);

  type EngineStatus = 'IDLE' | 'SEARCHING' | 'DRAFTING' | 'SAVING_DRAFT' | 'SENDING' | 'COOLDOWN' | 'PAUSED' | 'COMPLETED';

  // Execution Engine State
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('IDLE');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [contactedHistory, setContactedHistory] = useState<ContactedProfRecord[]>([]);
  const [activeProfessor, setActiveProfessor] = useState<any | null>(null);

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Load profile defaults from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedInterests = localStorage.getItem(`profmatch_user_interests_${userId}`);
      if (savedInterests) {
        const parsed = JSON.parse(savedInterests);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setKeywordsText(parsed.join(', '));
        }
      }

      const savedProfile = localStorage.getItem(`profmatch_user_profile_${userId}`);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.targetCountry) setTargetCountry(parsed.targetCountry);
        if (parsed.targetDegree) setTargetDegree(parsed.targetDegree);
        if (parsed.desiredField) setDiscipline(parsed.desiredField);
      }
    } catch {}
  }, [userId]);

  const appendLog = useCallback((type: TerminalLog['type'], message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        time,
        type,
        message,
      },
    ]);
  }, []);

  // Sleep utility with cancellation support
  const sleep = (seconds: number) => {
    return new Promise<void>((resolve) => {
      let timeLeft = seconds;
      setRemainingCooldown(timeLeft);

      const interval = setInterval(() => {
        timeLeft -= 1;
        setRemainingCooldown(timeLeft);

        if (timeLeft <= 0 || isPausedRef.current || isCancelledRef.current) {
          clearInterval(interval);
          setRemainingCooldown(0);
          resolve();
        }
      }, 1000);
    });
  };

  // Main autonomous loop
  const runAutoPilotCampaign = async () => {
    if (!hasAuthorized) {
      alert('Please check the authorization consent checkbox before launching the autonomous engine.');
      return;
    }

    isPausedRef.current = false;
    isCancelledRef.current = false;
    setEngineStatus('SEARCHING');
    setCurrentProgress(0);
    appendLog('INFO', `🚀 AutoPilot outreach initiated: Target [${targetCountry} • ${targetDegree} • ${discipline}]`);
    appendLog('INFO', `⚡ Batch quota: ${batchLimit} emails • Anti-spam delay: ${cooldownSec}s`);

    const keywordsArray = keywordsText
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    let completedCount = 0;
    const contactedEmails: string[] = [];

    // Pre-populate already contacted emails from localStorage
    try {
      const existingSent = localStorage.getItem(`profmatch_sent_emails_${userId}`);
      if (existingSent) {
        const parsed = JSON.parse(existingSent);
        parsed.forEach((item: any) => {
          if (item.recipientEmail) contactedEmails.push(item.recipientEmail);
          if (item.to_email) contactedEmails.push(item.to_email);
        });
      }
    } catch {}

    while (completedCount < batchLimit) {
      if (isPausedRef.current) {
        appendLog('WARN', '⏸️ AutoPilot campaign paused by user. Awaiting resume...');
        break;
      }
      if (isCancelledRef.current) {
        appendLog('WARN', '🛑 AutoPilot campaign aborted by user.');
        break;
      }

      // STEP 1: Discover Next Matching Faculty Member
      setEngineStatus('SEARCHING');
      appendLog('SEARCH', `🔍 Querying faculty registry & real-time search for uncontacted professor (${completedCount + 1}/${batchLimit})...`);

      let discoveredProf: any = null;
      try {
        const discoverRes = await fetch('/api/autopilot/discover-next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetCountry,
            targetDegree,
            discipline,
            keywords: keywordsArray,
            alreadyContactedEmails: contactedEmails,
          }),
        });

        const discoverData = await discoverRes.json();
        if (!discoverRes.ok || !discoverData.success || !discoverData.professor) {
          appendLog('WARN', discoverData.message || 'No additional matching professors found for current criteria.');
          break;
        }

        discoveredProf = discoverData.professor;
        setActiveProfessor(discoveredProf);
        contactedEmails.push(discoveredProf.email);

        appendLog(
          'SUCCESS',
          `🎯 Match identified: ${discoveredProf.name} (${discoveredProf.university_name}) • Email: ${discoveredProf.email}`
        );
      } catch (err: any) {
        appendLog('ERROR', `Failed to discover faculty: ${err.message}`);
        break;
      }

      if (isPausedRef.current || isCancelledRef.current) break;

      // STEP 2: Grounded Personalization with Gemini AI
      setEngineStatus('DRAFTING');
      appendLog('AI', `🧠 Gemini AI generating grounded cold outreach referencing lab & papers...`);

      let generatedSubject = '';
      let generatedBody = '';
      try {
        const draftRes = await fetch('/api/autopilot/draft-grounded', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professor: discoveredProf,
            studentProfile: {
              targetDegree,
              researchInterests: keywordsArray,
            },
            tone,
            userId,
          }),
        });

        const draftData = await draftRes.json();
        if (!draftRes.ok || !draftData.success) {
          throw new Error(draftData.error || 'AI generation failed');
        }

        generatedSubject = draftData.subject;
        generatedBody = draftData.bodyText;
        appendLog('AI', `✍️ Generated custom subject: "${generatedSubject}" (Quality: ${draftData.qualityScore}/100)`);
      } catch (err: any) {
        appendLog('ERROR', `Personalization error: ${err.message}`);
        break;
      }

      if (isPausedRef.current || isCancelledRef.current) break;

      // STEP 3: Automated Creation in Gmail Drafts
      setEngineStatus('SAVING_DRAFT');
      appendLog('AI', `📝 Preparing personalized draft in Gmail for ${discoveredProf.name}...`);

      try {
        const draftRes = await fetch('/api/outreach/create-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: discoveredProf.email,
            subject: generatedSubject,
            bodyText: generatedBody,
            professorName: discoveredProf.name,
            universityName: discoveredProf.university_name,
            userId,
          }),
        });

        const draftData = await draftRes.json();
        if (!draftRes.ok || !draftData.success) {
          throw new Error(draftData.error || 'Failed to create Gmail draft');
        }

        completedCount += 1;
        setCurrentProgress(completedCount);

        const draftUrl = draftData.gmailUrl || 'https://mail.google.com/mail/u/0/#drafts';

        const newRecord: ContactedProfRecord = {
          id: `draft_${Date.now()}`,
          name: discoveredProf.name,
          university: discoveredProf.university_name,
          country: discoveredProf.university_country || targetCountry,
          email: discoveredProf.email,
          subject: generatedSubject,
          sentAt: new Date().toLocaleTimeString(),
          sentVia: draftData.connectedEmail || 'Gmail Drafts',
          draftUrl,
        };

        setContactedHistory((prev) => [newRecord, ...prev]);

        if (typeof window !== 'undefined') {
          const draftsKey = `profmatch_draft_emails_${userId}`;
          let existingDrafts: any[] = [];
          try {
            const raw = localStorage.getItem(draftsKey);
            if (raw) existingDrafts = JSON.parse(raw);
          } catch {}

          const draftItem = {
            id: `draft_${Date.now()}`,
            user_id: userId,
            recipientEmail: discoveredProf.email,
            professor_name: discoveredProf.name,
            subject: generatedSubject,
            bodyText: generatedBody,
            status: 'DRAFT',
            created_at: new Date().toISOString(),
            draftUrl,
          };
          localStorage.setItem(draftsKey, JSON.stringify([draftItem, ...existingDrafts]));

          // Save to Kanban
          const kanbanKey = `profmatch_kanban_cards_${userId}`;
          try {
            const rawCards = localStorage.getItem(kanbanKey);
            let cards: any[] = rawCards ? JSON.parse(rawCards) : [];
            cards.unshift({
              id: `card_${Date.now()}`,
              professorId: discoveredProf.id,
              professorName: discoveredProf.name,
              universityName: discoveredProf.university_name,
              country: discoveredProf.university_country || targetCountry,
              email: discoveredProf.email,
              stage: 'OUTREACH_DRAFT',
              notes: `AutoPilot grounded draft: "${generatedSubject}"`,
              appliedDate: new Date().toISOString().split('T')[0],
            });
            localStorage.setItem(kanbanKey, JSON.stringify(cards));
          } catch {}

          window.dispatchEvent(new Event('profmatch_messages_updated'));
        }

        appendLog('SUCCESS', `📝 Draft saved to Gmail! Ready for your review (${completedCount}/${batchLimit})`);
      } catch (err: any) {
        appendLog('ERROR', `Draft creation failed for ${discoveredProf.email}: ${err.message}`);
      }

      // STEP 4: Anti-Spam Cooldown Timer
      if (completedCount < batchLimit && !isPausedRef.current && !isCancelledRef.current) {
        setEngineStatus('COOLDOWN');
        appendLog('WAIT', `⏳ Anti-Spam protection active: Waiting ${cooldownSec}s before next contact...`);
        await sleep(cooldownSec);
      }
    }

    if (!isPausedRef.current && !isCancelledRef.current) {
      setEngineStatus('COMPLETED');
      appendLog('SUCCESS', `🎉 AutoPilot Campaign Finished! Contacted ${completedCount} professors.`);
    }
  };

  const handlePause = () => {
    isPausedRef.current = true;
    setEngineStatus('PAUSED');
    appendLog('WARN', '⏸️ AutoPilot paused. Click Resume to continue.');
  };

  const handleResume = () => {
    isPausedRef.current = false;
    isCancelledRef.current = false;
    setEngineStatus('SEARCHING');
    appendLog('INFO', '▶️ Resuming AutoPilot outreach loop...');
    runAutoPilotCampaign();
  };

  const handleAbort = () => {
    isCancelledRef.current = true;
    isPausedRef.current = false;
    setEngineStatus('IDLE');
    setRemainingCooldown(0);
    appendLog('ERROR', '🛑 AutoPilot campaign terminated.');
  };

  const isRunning = engineStatus === 'SEARCHING' || engineStatus === 'DRAFTING' || engineStatus === 'SAVING_DRAFT' || engineStatus === 'SENDING' || engineStatus === 'COOLDOWN';

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Rocket className="w-7 h-7 text-emerald-400" /> AutoPilot Bulk Outreach Engine
            </h1>
            <p className="text-xs text-slate-400">
              Autonomous AI agent for real-time faculty discovery, personalized grounded drafting, and rate-limited cold email dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Autonomous AI Agent Ready
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Setup Wizard & Safeguard Authorization (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">1. Campaign Parameters</h2>
              </div>

              <div className="space-y-4 text-xs">
                {/* Mode: Always Save to Gmail Drafts */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Mode: Save to Gmail Drafts
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Safe &amp; Reviewable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    AI discovers verified faculty and prepares personalized research drafts directly inside your Gmail Drafts folder. You can review and click Send whenever you choose.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Target Destination Country
                  </label>
                  <select
                    value={targetCountry}
                    disabled={isRunning}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="Worldwide">Worldwide (Global Universities)</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Target Degree
                    </label>
                    <select
                      value={targetDegree}
                      disabled={isRunning}
                      onChange={(e) => setTargetDegree(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="PhD">Ph.D. / Doctorate</option>
                      <option value="MS">M.S. with Thesis</option>
                      <option value="Postdoc">Postdoctoral Fellowship</option>
                      <option value="Internship">Research Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Batch Limit</label>
                    <select
                      value={batchLimit}
                      disabled={isRunning}
                      onChange={(e) => setBatchLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value={5}>5 Professors (Test Run)</option>
                      <option value={10}>10 Professors (Standard)</option>
                      <option value={20}>20 Professors (Targeted)</option>
                      <option value={35}>35 Professors (Aggressive)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Academic Discipline</label>
                  <input
                    type="text"
                    value={discipline}
                    disabled={isRunning}
                    onChange={(e) => setDiscipline(e.target.value)}
                    placeholder="e.g. Artificial Intelligence, Bioinformatics, Quantum Physics"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Research Focus Keywords <span className="text-slate-500">(Used by Gemini AI for Paper Matching)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={keywordsText}
                    disabled={isRunning}
                    onChange={(e) => setKeywordsText(e.target.value)}
                    placeholder="e.g. LLM Reasoning, Graph Neural Networks, Multi-Hop QA"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> Anti-Spam Delay
                    </label>
                    <select
                      value={cooldownSec}
                      disabled={isRunning}
                      onChange={(e) => setCooldownSec(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value={45}>45 seconds</option>
                      <option value={60}>60 seconds (Safe Recommended)</option>
                      <option value={90}>90 seconds (Ultra-Safe)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Outreach Tone</label>
                    <select
                      value={tone}
                      disabled={isRunning}
                      onChange={(e) => setTone(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="academic">Academic &amp; Formal</option>
                      <option value="concise">Direct &amp; Concise</option>
                      <option value="inquisitive">Publication-Centric</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Safeguard & Launch Card */}
            <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">2. One-Time Authorization</h2>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasAuthorized}
                    onChange={(e) => setHasAuthorized(e.target.checked)}
                    disabled={isRunning}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 shrink-0"
                  />
                  <span className="text-slate-300 leading-relaxed text-[11px]">
                    <strong className="text-white">One-Time Safeguard Consent:</strong> I authorize ProfMatch AI to
                    autonomously search verified global professors matching my research criteria, synthesize personalized
                    academic emails with Gemini AI, and prepare reviewable drafts directly in my Gmail account.
                  </span>
                </label>
              </div>

              {/* Action Trigger Buttons */}
              <div className="pt-2">
                {engineStatus === 'IDLE' || engineStatus === 'COMPLETED' ? (
                  <button
                    type="button"
                    onClick={runAutoPilotCampaign}
                    disabled={!hasAuthorized}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-950" />
                    Launch AutoPilot (Create {batchLimit} Gmail Drafts)
                  </button>
                ) : isRunning ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePause}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Pause className="w-4 h-4" /> Pause AutoPilot
                    </button>
                    <button
                      type="button"
                      onClick={handleAbort}
                      className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResume}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                    >
                      <Play className="w-4 h-4" /> Resume Campaign
                    </button>
                    <button
                      type="button"
                      onClick={handleAbort}
                      className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" /> Abort
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Real-time Live Terminal & Sent Activity Stream (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Status & Progress Bar */}
            <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {isRunning && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        isRunning ? 'bg-emerald-500' : engineStatus === 'PAUSED' ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                    />
                  </span>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    Engine Status: <span className="text-emerald-400">{engineStatus}</span>
                  </h3>
                </div>

                <span className="text-xs font-mono font-bold text-slate-300">
                  {currentProgress} / {batchLimit} Drafts Prepared
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${(currentProgress / Math.max(batchLimit, 1)) * 100}%` }}
                />
              </div>

              {/* Live Sub-Status Box */}
              {engineStatus === 'COOLDOWN' && remainingCooldown > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <Clock className="w-4 h-4 animate-spin text-amber-400" />
                    Anti-spam protection active. Holding queue...
                  </span>
                  <span className="font-mono font-bold text-sm bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/40">
                    {remainingCooldown}s remaining
                  </span>
                </div>
              )}
            </div>

            {/* Terminal Live Activity Logs */}
            <div className="glass-panel bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>autonomous_agent.log</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {logs.length} events logged
                </span>
              </div>

              <div
                ref={logsContainerRef}
                className="p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800"
              >
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic py-10 text-center">
                    AutoPilot is in standby mode. Configure campaign parameters on the left and click &quot;Launch Autonomous Campaign&quot; to begin.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                      <span
                        className={
                          log.type === 'SUCCESS'
                            ? 'text-emerald-400 font-bold'
                            : log.type === 'AI'
                            ? 'text-cyan-400'
                            : log.type === 'SEARCH'
                            ? 'text-amber-400'
                            : log.type === 'WARN'
                            ? 'text-amber-300'
                            : log.type === 'ERROR'
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Campaign Output Activity Table */}
            <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">
                    Prepared Gmail Drafts ({contactedHistory.length})
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="https://mail.google.com/mail/u/0/#drafts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Open Gmail Drafts <ExternalLink className="w-3 h-3" />
                  </a>
                  <Link
                    href="/tracker"
                    className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    Kanban <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {contactedHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No outreach drafts prepared yet in this session.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {contactedHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold border flex items-center gap-1 bg-cyan-500/15 text-cyan-400 border-cyan-500/30">
                            <FileText className="w-2.5 h-2.5" /> Draft in {item.sentVia}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.university} &bull; {item.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.draftUrl && (
                          <a
                            href={item.draftUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm shadow-emerald-500/20"
                          >
                            Open Draft <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.sentAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
