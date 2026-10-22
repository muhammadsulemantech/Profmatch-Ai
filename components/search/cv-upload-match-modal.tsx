'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileText,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  GraduationCap,
  Percent,
} from 'lucide-react';
import type { CVMatchResponse, MatchedProfessorResult } from '@/lib/services/cv-match-service';
import { trackAnalyticsEvent } from '@/components/providers/posthog-provider';

interface CVUploadMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CVUploadMatchModal({ isOpen, onClose }: CVUploadMatchModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [matchData, setMatchData] = useState<CVMatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.pdf')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a PDF document.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.toLowerCase().endsWith('.pdf')) {
      setFile(selected);
      setError(null);
    } else if (selected) {
      setError('Please upload a PDF document.');
    }
  };

  const handleStartAnalysis = async () => {
    if (!file) return;

    setIsProcessing(true);
    setStage('analyzing');
    setError(null);

    trackAnalyticsEvent('cv_match_started', {
      fileName: file.name,
      fileSize: file.size,
    });

    try {
      const formData = new FormData();
      formData.append('cv', file);

      const res = await fetch('/api/cv/match', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to process CV');
      }

      setMatchData(json.data);
      setStage('results');

      // Cache matched faculty in sessionStorage for instant loading in professor detail view
      if (typeof window !== 'undefined' && json.data?.matches) {
        try {
          json.data.matches.forEach((prof: MatchedProfessorResult) => {
            sessionStorage.setItem(`profmatch_current_prof_${prof.id}`, JSON.stringify(prof));
          });
          const searchStateStr = sessionStorage.getItem('profmatch_search_state');
          const searchState = searchStateStr ? JSON.parse(searchStateStr) : {};
          searchState.professorsList = [...(searchState.professorsList || []), ...json.data.matches];
          sessionStorage.setItem('profmatch_search_state', JSON.stringify(searchState));
        } catch (storageErr) {
          console.warn('[CV MODAL STORAGE CACHE NOTICE]', storageErr);
        }
      }

      trackAnalyticsEvent('cv_match_success', {
        candidateName: json.data?.profile?.candidateName,
        matchesCount: json.data?.matches?.length || 0,
      });
    } catch (err: any) {
      setError(err.message || 'Error parsing CV. Please try again.');
      setStage('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStage('upload');
    setMatchData(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-auto text-slate-100 space-y-6">
        {/* Header Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-t-2xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                CV &amp; Resume Instant Matchmaker
              </h2>
              <p className="text-xs text-slate-400">
                Drop your CV &bull; AI extracts your research DNA &bull; Matches top 15 funded advisors worldwide
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STAGE 1: Upload Dropzone */}
        {stage === 'upload' && (
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                  : 'border-slate-800 hover:border-emerald-500/50 bg-slate-950/60 hover:bg-slate-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                  <Upload className="w-7 h-7" />
                </div>

                {file ? (
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm flex items-center justify-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB &bull; Ready to analyze</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-semibold text-white text-sm sm:text-base">
                      Drag &amp; drop your CV / Resume (PDF) here
                    </p>
                    <p className="text-xs text-slate-400">or click to browse from your computer (Max 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                🔒 Privacy Guarantee: Your CV is processed securely and never shared with third parties.
              </span>

              <button
                type="button"
                disabled={!file || isProcessing}
                onClick={handleStartAnalysis}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Find Matching Professors
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: AI Parsing & Analysis Animation */}
        {stage === 'analyzing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-bold text-white text-base">Analyzing Your Research Profile...</h3>
              <p className="text-xs text-slate-400">
                Extracting technical skills, thesis keywords, and querying global academic repositories.
              </p>
            </div>
          </div>
        )}

        {/* STAGE 3: Results Display */}
        {stage === 'results' && matchData && (
          <div className="space-y-6">
            {/* Extracted Profile Summary Pill */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Candidate: <strong className="text-white">{matchData.profile.candidateName}</strong></span>
                <span className="text-slate-400">Target Degree: <strong className="text-emerald-400">{matchData.profile.targetDegree}</strong></span>
              </div>
              <p className="text-xs text-slate-300 italic">&ldquo;{matchData.profile.profileSummary}&rdquo;</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {matchData.profile.keyResearchTopics.map((topic, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Matching Professors List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                <span>Top Matched Faculty ({matchData.matches.length})</span>
                <span>Sorted by Research Alignment</span>
              </div>

              {matchData.matches.map((prof) => (
                <div
                  key={prof.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm hover:text-emerald-400 transition-colors">
                        {prof.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        {prof.matchScore}% Match
                      </span>
                      {prof.hasActiveGrants && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                          Active Grants
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {prof.university_name} &bull; {prof.university_country}
                    </p>
                    <p className="text-[11px] text-slate-300 line-clamp-1">
                      {prof.matchReason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Link
                      href={`/professors/${encodeURIComponent(prof.id)}`}
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          try {
                            sessionStorage.setItem(`profmatch_current_prof_${prof.id}`, JSON.stringify(prof));
                          } catch (e) {
                            console.warn('Storage set error:', e);
                          }
                        }
                        onClose();
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors text-center"
                    >
                      View &amp; Draft
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                &larr; Upload a different CV
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
