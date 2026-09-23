'use client';

import React from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

interface ResearchFocusSectionProps {
  interests: string[];
  newInterest: string;
  setNewInterest: (v: string) => void;
  matchingSuggestions: string[];
  isSuggestionOpen: boolean;
  setIsSuggestionOpen: (v: boolean) => void;
  handleAddInterest: (val?: string) => void;
  handleRemoveInterest: (item: string) => void;
  keywordContainerRef: React.RefObject<HTMLDivElement>;
  thesisTitle: string;
  setThesisTitle: (v: string) => void;
  thesisAbstract: string;
  setThesisAbstract: (v: string) => void;
}

export function ResearchFocusSection({
  interests,
  newInterest,
  setNewInterest,
  matchingSuggestions,
  isSuggestionOpen,
  setIsSuggestionOpen,
  handleAddInterest,
  handleRemoveInterest,
  keywordContainerRef,
  thesisTitle,
  setThesisTitle,
  thesisAbstract,
  setThesisAbstract,
}: ResearchFocusSectionProps) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <BookOpen className="w-5 h-5 text-cyan-400" />
        <h2 className="text-base font-bold text-white">Research Focus &amp; Scholarly Keywords</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Research Keywords / Specific Topics</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {interests.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(item)}
                  className="text-slate-400 hover:text-rose-400 transition-colors"
                  title="Remove keyword"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div ref={keywordContainerRef} className="relative flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => {
                  setNewInterest(e.target.value);
                  setIsSuggestionOpen(true);
                }}
                onFocus={() => setIsSuggestionOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  } else if (e.key === 'Escape') {
                    setIsSuggestionOpen(false);
                  }
                }}
                placeholder="e.g. Sustainable Cities, CRISPR Assays, Applied Econometrics"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />

              {/* Autocomplete Suggestion Dropdown */}
              {isSuggestionOpen && matchingSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-800">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950 flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
                    <span>Suggested Research Keywords</span>
                    <span className="text-emerald-400 font-bold">{matchingSuggestions.length} Available</span>
                  </div>
                  {matchingSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddInterest(item);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors flex items-center justify-between"
                    >
                      <span>{item}</span>
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              id="btn-add-keyword"
              onClick={(e) => {
                e.preventDefault();
                handleAddInterest();
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                newInterest.trim()
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Keyword
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thesis / Capstone / Major Project Title</label>
          <input
            type="text"
            value={thesisTitle}
            onChange={(e) => setThesisTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thesis Abstract &amp; Analytical Methodology</label>
          <textarea
            rows={3}
            value={thesisAbstract}
            onChange={(e) => setThesisAbstract(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
