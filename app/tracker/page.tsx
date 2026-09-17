'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { mockDb } from '@/lib/supabase/mock-db';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  ExternalLink,
  Mail,
  CheckCircle2,
  Clock,
  MessageSquare,
  Video,
  Award,
  Trash2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Building2,
  GraduationCap
} from 'lucide-react';
import { Professor } from '@/types/database';

export interface ApplicationTrackerCard {
  id: string;
  professorId: string;
  professorName: string;
  title: string;
  universityName: string;
  country: string;
  email: string;
  stage: 'SAVED' | 'OUTREACH_SENT' | 'REPLIED' | 'INTERVIEW' | 'ACCEPTED';
  notes?: string;
  appliedDate?: string;
  nextFollowUpDate?: string;
}

const STAGES: { key: ApplicationTrackerCard['stage']; title: string; color: string; bg: string; border: string; icon: any }[] = [
  { key: 'SAVED', title: 'Saved Faculty', color: 'text-slate-300', bg: 'bg-slate-900/80', border: 'border-slate-800', icon: BookmarkIcon },
  { key: 'OUTREACH_SENT', title: 'Outreach Sent', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: Mail },
  { key: 'REPLIED', title: 'Professor Replied', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: MessageSquare },
  { key: 'INTERVIEW', title: 'Interview Scheduled', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Video },
  { key: 'ACCEPTED', title: 'Offer Accepted', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Award },
];

function BookmarkIcon(props: any) {
  return <Layers {...props} />;
}

export default function ApplicationTrackerPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<ApplicationTrackerCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [editingCard, setEditingCard] = useState<ApplicationTrackerCard | null>(null);

  // Initial demo data + localStorage sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userKey = user ? user.id : 'guest';
    const storageKey = `profmatch_kanban_cards_${userKey}`;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCards(JSON.parse(stored));
        return;
      }
    } catch {}

    // Default sample tracker cards mapped to mockDb professors
    const initialCards: ApplicationTrackerCard[] = [
      {
        id: 'card_1',
        professorId: 'prof_1',
        professorName: 'Dr. Greg Durrett',
        title: 'Associate Professor',
        universityName: 'University of Texas at Austin',
        country: 'United States',
        email: 'gdurrett@cs.utexas.edu',
        stage: 'REPLIED',
        notes: 'Prof. Durrett replied asking for my full undergraduate transcript and research SOP sample.',
        appliedDate: '2026-09-10',
        nextFollowUpDate: '2026-09-18',
      },
      {
        id: 'card_2',
        professorId: 'prof_us_2',
        professorName: 'Dr. Stuart Russell',
        title: 'Professor & Director (CHAI)',
        universityName: 'University of California, Berkeley',
        country: 'United States',
        email: 'russell@cs.berkeley.edu',
        stage: 'OUTREACH_SENT',
        notes: 'Grounded outreach sent highlighting LLM alignment and value learning.',
        appliedDate: '2026-09-14',
        nextFollowUpDate: '2026-09-21',
      },
      {
        id: 'card_3',
        professorId: 'prof_de_1',
        professorName: 'Dr. Michael Sterner',
        title: 'Professor for Energy Systems',
        universityName: 'Technical University of Munich (TUM)',
        country: 'Germany',
        email: 'michael.sterner@tum.de',
        stage: 'INTERVIEW',
        notes: 'Zoom interview scheduled for Sep 25 at 2:00 PM CET to discuss Horizon Europe PhD grant.',
        appliedDate: '2026-09-02',
        nextFollowUpDate: '2026-09-25',
      },
      {
        id: 'card_4',
        professorId: 'prof_uk_1',
        professorName: 'Dr. Colin Mayer',
        title: 'Emeritus Professor',
        universityName: 'University of Oxford',
        country: 'United Kingdom',
        email: 'colin.mayer@sbs.ox.ac.uk',
        stage: 'SAVED',
        notes: 'Targeting DPhil supervision in corporate governance and purpose-driven enterprise.',
        appliedDate: '2026-09-16',
      },
      {
        id: 'card_5',
        professorId: 'prof_pk_1',
        professorName: 'Dr. Bushra Mirza',
        title: 'Professor of Biotechnology',
        universityName: 'Quaid-i-Azam University',
        country: 'Pakistan',
        email: 'bmirza@qau.edu.pk',
        stage: 'ACCEPTED',
        notes: 'Formal RA appointment and lab workspace allocated for Fall 2026 research team!',
        appliedDate: '2026-08-20',
      },
    ];

    setCards(initialCards);
    localStorage.setItem(storageKey, JSON.stringify(initialCards));
  }, [user]);

  const saveCards = (newCards: ApplicationTrackerCard[]) => {
    setCards(newCards);
    if (typeof window !== 'undefined') {
      const userKey = user ? user.id : 'guest';
      localStorage.setItem(`profmatch_kanban_cards_${userKey}`, JSON.stringify(newCards));
    }
  };

  const handleMoveStage = (cardId: string, newStage: ApplicationTrackerCard['stage']) => {
    const updated = cards.map(c => (c.id === cardId ? { ...c, stage: newStage } : c));
    saveCards(updated);
  };

  const handleDeleteCard = (cardId: string) => {
    if (!confirm('Are you sure you want to remove this faculty application from your tracker?')) return;
    const updated = cards.filter(c => c.id !== cardId);
    saveCards(updated);
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    const updated = cards.map(c => (c.id === editingCard.id ? editingCard : c));
    saveCards(updated);
    setEditingCard(null);
  };

  // Filter cards by search & stage
  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      if (stageFilter !== 'ALL' && c.stage !== stageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.professorName.toLowerCase().includes(q) ||
          c.universityName.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [cards, stageFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" /> Candidate Portal Tracker
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              MS &amp; PhD Application Kanban Console
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Manage your global faculty outreach, track professor replies, schedule lab interviews, and organize your graduate admission status across 190+ countries.
            </p>
          </div>

          <Link
            href="/search"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" /> Discover &amp; Save Faculty
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by professor, university, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStageFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                stageFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              All Stages ({cards.length})
            </button>
            {STAGES.map(st => {
              const count = cards.filter(c => c.stage === st.key).length;
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStageFilter(st.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    stageFilter === st.key
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                  }`}
                >
                  {st.title} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Kanban Board Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {STAGES.map(stage => {
            const Icon = stage.icon;
            const stageCards = filteredCards.filter(c => c.stage === stage.key);

            return (
              <div
                key={stage.key}
                className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 space-y-3 min-h-[500px] flex flex-col"
              >
                {/* Column Header */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${stage.bg} ${stage.border}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${stage.color}`} />
                    <h2 className={`text-xs font-bold ${stage.color}`}>{stage.title}</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-white border border-slate-800">
                    {stageCards.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                  {stageCards.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center py-8 text-slate-500 text-xs">
                      No applications in {stage.title}
                    </div>
                  ) : (
                    stageCards.map(card => (
                      <div
                        key={card.id}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 shadow-lg hover:border-slate-700 transition-all space-y-3 group"
                      >
                        <div>
                          <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {card.professorName}
                          </h3>
                          <p className="text-[11px] text-slate-400 truncate">{card.title}</p>
                          <p className="text-[11px] font-semibold text-emerald-400 truncate mt-0.5">
                            {card.universityName} &bull; {card.country}
                          </p>
                        </div>

                        {card.notes && (
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 font-light leading-snug">
                            {card.notes}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <div className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{card.appliedDate || 'Sep 2026'}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingCard(card)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-semibold"
                            >
                              Notes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete Card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Stage Selector Dropdown */}
                        <div className="pt-2">
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Move Stage:</label>
                          <select
                            value={card.stage}
                            onChange={e => handleMoveStage(card.id, e.target.value as ApplicationTrackerCard['stage'])}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            {STAGES.map(s => (
                              <option key={s.key} value={s.key}>
                                {s.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quick Outreach Link */}
                        <Link
                          href={`/outreach/generate?professorId=${card.professorId}`}
                          className="w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <Mail className="w-3 h-3" /> Outreach Email
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Notes Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Edit Notes for {editingCard.professorName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Application Notes / Next Steps</label>
                <textarea
                  rows={4}
                  value={editingCard.notes || ''}
                  onChange={e => setEditingCard({ ...editingCard, notes: e.target.value })}
                  placeholder="Record professor response details, thesis feedback, or interview date..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20"
                >
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
