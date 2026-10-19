'use client';

import React, { useState, useEffect } from 'react';
import { Users, User, BookOpen, ExternalLink, Mail, Sparkles, ChevronRight } from 'lucide-react';
import type { LabTeamReport, LabMember } from '@/lib/services/lab-team-service';

interface LabTeamSectionProps {
  profName: string;
  openAlexId?: string;
  onOpenOutreachModal?: () => void;
}

export default function LabTeamSection({ profName, openAlexId, onOpenOutreachModal }: LabTeamSectionProps) {
  const [report, setReport] = useState<LabTeamReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchLab() {
      try {
        const res = await fetch(
          `/api/professors/lab-team?name=${encodeURIComponent(profName)}&authorId=${encodeURIComponent(
            openAlexId || ''
          )}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && isMounted) {
            setReport(json.data);
          }
        }
      } catch (err) {
        // Fall back gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLab();

    return () => {
      isMounted = false;
    };
  }, [profName, openAlexId]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
        <div className="h-4 w-48 bg-slate-800 rounded" />
        <div className="h-16 w-full bg-slate-850 rounded-xl" />
      </div>
    );
  }

  if (!report || report.members.length === 0) return null;

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Lab Team &amp; Active Co-Authors</h3>
            <p className="text-xs text-slate-400">
              Senior PhD candidates &amp; Postdoctoral researchers currently working in {report.labName || 'this research group'}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 self-start sm:self-auto">
          {report.members.length} Discovered Members
        </span>
      </div>

      <div className="space-y-3">
        {report.members.map((member, i) => (
          <div
            key={member.id || i}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-teal-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
                {member.name.charAt(0)}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm">{member.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      member.role === 'Postdoctoral Fellow'
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Joint Paper ({member.paperYear}):</span>
                  <span className="text-slate-300 italic">&ldquo;{member.recentJointPaper}&rdquo;</span>
                </p>
                <p className="text-[11px] text-teal-400/90 font-medium pt-0.5">
                  💡 Tip: {member.referralAngle}
                </p>
              </div>
            </div>

            {onOpenOutreachModal && (
              <button
                type="button"
                onClick={onOpenOutreachModal}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1 transition-colors shrink-0 self-start md:self-center"
              >
                <span>Draft Lab Outreach</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
