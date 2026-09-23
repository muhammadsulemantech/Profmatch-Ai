'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Rocket, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { getAllCountries } from '@/lib/geography/global-geography';
import {
  CampaignConfigPanel,
  EngineStatus,
} from '@/components/autopilot/campaign-config-panel';
import {
  CampaignTerminal,
  TerminalLog,
} from '@/components/autopilot/campaign-terminal';
import {
  PreparedDraftsList,
  ContactedProfRecord,
} from '@/components/autopilot/prepared-drafts-list';

export default function AutoPilotPage() {
  const { user } = useAuth();
  const userId = user?.id || 'usr_student_001';

  const countries = React.useMemo(() => getAllCountries(), []);

  // Campaign Configuration State
  const [targetCountry, setTargetCountry] = useState('United States');
  const [targetDegree, setTargetDegree] = useState('PhD');
  const [discipline, setDiscipline] = useState('Artificial Intelligence & NLP');
  const [keywordsText, setKeywordsText] = useState('Large Language Models, AI Reasoning, Multi-Agent Systems');
  const [batchLimit, setBatchLimit] = useState<number>(10);
  const [cooldownSec, setCooldownSec] = useState<number>(60);
  const [tone, setTone] = useState<'academic' | 'concise' | 'inquisitive'>('academic');

  // Safeguard Consent State
  const [hasAuthorized, setHasAuthorized] = useState(false);

  // Execution Engine State
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('IDLE');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [contactedHistory, setContactedHistory] = useState<ContactedProfRecord[]>([]);

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

    // Pre-populate already contacted and drafted emails to ensure 100% uniqueness
    try {
      const existingSent = localStorage.getItem(`profmatch_sent_emails_${userId}`);
      if (existingSent) {
        const parsed = JSON.parse(existingSent);
        parsed.forEach((item: any) => {
          if (item.recipientEmail) contactedEmails.push(item.recipientEmail);
          if (item.to_email) contactedEmails.push(item.to_email);
        });
      }

      const existingDrafts = localStorage.getItem(`profmatch_draft_emails_${userId}`);
      if (existingDrafts) {
        const parsed = JSON.parse(existingDrafts);
        parsed.forEach((item: any) => {
          if (item.recipientEmail) contactedEmails.push(item.recipientEmail);
          if (item.to_email) contactedEmails.push(item.to_email);
        });
      }

      contactedHistory.forEach((rec) => {
        if (rec.email) contactedEmails.push(rec.email);
      });
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
        const prof = discoverData.professor || (discoverData.data && discoverData.data.professor);
        if (!discoverRes.ok || !prof) {
          appendLog('WARN', discoverData.message || 'No additional matching professors found for current criteria.');
          break;
        }

        discoveredProf = prof;
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
            targetDegree,
            userProfile: {
              field: discipline,
              keywords: keywordsArray,
            },
            tone,
          }),
        });

        const draftData = await draftRes.json();
        const payload = draftData.data || draftData;
        if (!draftRes.ok || (!draftData.success && !payload.subject)) {
          throw new Error(draftData.error || 'Failed to generate email');
        }

        generatedSubject = payload.subject || draftData.subject;
        generatedBody = payload.bodyText || draftData.bodyText;
        appendLog('SUCCESS', `✨ Personalized email tailored to: "${generatedSubject}"`);
      } catch (err: any) {
        appendLog('ERROR', `Draft generation failed: ${err.message}`);
        break;
      }

      if (isPausedRef.current || isCancelledRef.current) break;

      // STEP 3: Save directly to Gmail Drafts
      setEngineStatus('SAVING_DRAFT');
      appendLog('SEND', `📤 Saving reviewable draft directly into Gmail account for ${discoveredProf.name}...`);

      try {
        const saveDraftRes = await fetch('/api/autopilot/save-gmail-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: discoveredProf.email,
            professorName: discoveredProf.name,
            universityName: discoveredProf.university_name,
            subject: generatedSubject,
            bodyText: generatedBody,
            userId,
          }),
        });

        const saveDraftData = await saveDraftRes.json();
        const savePayload = saveDraftData.data || saveDraftData;
        const draftUrl = savePayload?.draftUrl || saveDraftData.draftUrl;

        completedCount += 1;
        setCurrentProgress(completedCount);

        const newRecord: ContactedProfRecord = {
          id: `draft_${Date.now()}_${discoveredProf.id || Math.random().toString(36).substring(2, 6)}`,
          name: discoveredProf.name,
          university: discoveredProf.university_name,
          country: discoveredProf.university_country || targetCountry,
          email: discoveredProf.email,
          subject: generatedSubject,
          sentAt: new Date().toLocaleTimeString(),
          sentVia: 'Gmail Drafts',
          draftUrl,
        };

        setContactedHistory((prev) => [newRecord, ...prev]);

        // Persist draft into browser storage
        if (typeof window !== 'undefined') {
          const draftsKey = `profmatch_draft_emails_${userId}`;
          const currentDraftsStr = localStorage.getItem(draftsKey);
          let currentDrafts: any[] = [];
          if (currentDraftsStr) {
            try {
              currentDrafts = JSON.parse(currentDraftsStr);
            } catch {}
          }

          currentDrafts.unshift({
            id: newRecord.id,
            professor_name: discoveredProf.name,
            recipientEmail: discoveredProf.email,
            to_email: discoveredProf.email,
            subject: generatedSubject,
            bodyText: generatedBody,
            created_at: new Date().toISOString(),
            status: 'DRAFT',
            draftUrl,
          });

          localStorage.setItem(draftsKey, JSON.stringify(currentDrafts));

          // Also track in Kanban as outreach draft
          const kanbanKey = `profmatch_kanban_cards_${userId}`;
          try {
            const currentCards = localStorage.getItem(kanbanKey);
            const cards = currentCards ? JSON.parse(currentCards) : [];
            cards.unshift({
              id: `card_${Date.now()}`,
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

  const isRunning =
    engineStatus === 'SEARCHING' ||
    engineStatus === 'DRAFTING' ||
    engineStatus === 'SAVING_DRAFT' ||
    engineStatus === 'SENDING' ||
    engineStatus === 'COOLDOWN';

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
            <CampaignConfigPanel
              countries={countries}
              targetCountry={targetCountry}
              setTargetCountry={setTargetCountry}
              targetDegree={targetDegree}
              setTargetDegree={setTargetDegree}
              discipline={discipline}
              setDiscipline={setDiscipline}
              keywordsText={keywordsText}
              setKeywordsText={setKeywordsText}
              batchLimit={batchLimit}
              setBatchLimit={setBatchLimit}
              cooldownSec={cooldownSec}
              setCooldownSec={setCooldownSec}
              tone={tone}
              setTone={setTone}
              hasAuthorized={hasAuthorized}
              setHasAuthorized={setHasAuthorized}
              engineStatus={engineStatus}
              isRunning={isRunning}
              onLaunch={runAutoPilotCampaign}
              onPause={handlePause}
              onResume={handleResume}
              onAbort={handleAbort}
            />
          </div>

          {/* RIGHT: Real-time Live Terminal & Sent Activity Stream (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <CampaignTerminal
              engineStatus={engineStatus}
              currentProgress={currentProgress}
              batchLimit={batchLimit}
              remainingCooldown={remainingCooldown}
              isRunning={isRunning}
              logs={logs}
              logsContainerRef={logsContainerRef}
            />

            <PreparedDraftsList contactedHistory={contactedHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
