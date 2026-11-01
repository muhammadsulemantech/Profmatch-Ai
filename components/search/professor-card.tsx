'use client';

import React from 'react';
import { School, ExternalLink, Mail, ArrowRight, Bookmark, Check } from 'lucide-react';
import { Professor } from '@/types/database';
import { formatScore } from '@/lib/utils';

export interface ProfessorCardProps {
  prof: Professor;
  match?: any;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onViewProfile: (prof: Professor) => void;
  onDraftEmail: (prof: Professor) => void;
}

export function ProfessorCard({
  prof,
  match,
  isSaved,
  onToggleSave,
  onViewProfile,
  onDraftEmail,
}: ProfessorCardProps) {
  const crestInitials = prof.name
    .split(' ')
    .filter(p => !p.includes('.'))
    .map(n => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
      {/* Top Profile Details & Match */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Refined Academic Initials Crest */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-heading font-bold text-emerald-400 text-sm shrink-0">
            {crestInitials}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onViewProfile(prof)}
                className="font-heading text-base sm:text-lg font-bold text-white hover:text-emerald-400 transition-colors text-left break-words"
              >
                {prof.name}
              </button>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 break-words">
                {prof.title}
              </span>
              {prof.verification_status === 'VERIFIED' ? (
                <span className="badge-verified shrink-0">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  Verified University Profile
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  Unverified Web Record
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 break-words">
              {prof.department_name || prof.academic_unit_name || 'Academic Unit'}
            </p>
            <p className="text-xs font-medium text-emerald-400 flex flex-wrap items-center gap-1.5 break-words">
              <School className="w-3.5 h-3.5 shrink-0" />
              <span>{prof.university_name}</span>
              <span className="text-slate-400 font-normal">
                &bull; {prof.university_region ? `${prof.university_region}, ` : ''}{prof.university_country}
              </span>
            </p>
          </div>
        </div>

        {/* Restrained Match Score */}
        <div className="flex items-center sm:items-end sm:flex-col justify-between sm:justify-start gap-2 shrink-0">
          {match && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg text-left sm:text-right">
              <span className="font-heading text-lg font-bold text-emerald-400 block leading-none">
                {formatScore(match.overall_score)}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500">
                Research Match
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onToggleSave(prof.id)}
            className={`p-2 rounded-lg border transition-colors ${
              isSaved
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Save Professor"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Research Interests Tags */}
      <div className="flex flex-wrap gap-1.5">
        {prof.research_interests.map((interest, i) => (
          <span
            key={i}
            className="px-2.5 py-0.5 rounded text-xs bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium break-words"
          >
            {interest}
          </span>
        ))}
        {(prof.interdisciplinary_tags || []).map((tag, i) => (
          <span
            key={`tag-${i}`}
            className="px-2.5 py-0.5 rounded text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium break-words"
          >
            &bull; {tag}
          </span>
        ))}
      </div>

      {/* Why this match box */}
      {match && (
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
          <span className="font-semibold text-emerald-400 block">Why this match:</span>
          <p className="text-slate-300 leading-relaxed break-words">
            {match.explanation ||
              `Research alignment in ${prof.primary_discipline} with shared methodology in recent publications.`}
          </p>
        </div>
      )}

      {/* Card Actions & Email Verification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-400 min-w-0 flex-1">
          <a
            href={prof.profile_url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-emerald-400 flex items-center gap-1 underline break-all"
          >
            Official Faculty Webpage <ExternalLink className="w-3 h-3 shrink-0" />
          </a>

          {prof.email ? (
            <span className="flex flex-wrap items-center gap-1.5 text-xs text-emerald-400 font-medium min-w-0">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono text-xs break-all">{prof.email}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded border font-medium shrink-0 ${
                  prof.email_verification_status === 'VERIFIED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {prof.email_verification_status === 'VERIFIED' ? 'Verified Email' : 'Unverified Candidate'}
              </span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">Email via Faculty Portal</span>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={() => onViewProfile(prof)}
            className="flex-1 sm:flex-initial text-center px-3.5 py-2 sm:py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            View Profile
          </button>
          <button
            type="button"
            onClick={() => onDraftEmail(prof)}
            className="flex-1 sm:flex-initial text-center justify-center px-4 py-2 sm:py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            Draft Email <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
