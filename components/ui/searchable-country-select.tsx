'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, Globe, Lock, X } from 'lucide-react';
import { isCountryUnlockedForTier } from '@/lib/services/usage-service';
import { PlanTier } from '@/types/database';

export interface SearchableCountrySelectProps {
  country: string;
  onCountryChange: (val: string) => void;
  countries: Array<{ name: string; code: string; flag?: string }>;
  userTier: PlanTier;
  className?: string;
  id?: string;
}

export function SearchableCountrySelect({
  country,
  onCountryChange,
  countries,
  userTier,
  className = '',
  id,
}: SearchableCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Find currently selected country object
  const currentCountryObj = useMemo(() => {
    if (!country || country === 'Global (All Countries)') return null;
    return countries.find(c => c.name.toLowerCase() === country.toLowerCase()) || null;
  }, [country, countries]);

  // Filtered countries based on search query (case-insensitive)
  // Sorts countries starting with the query first, then countries containing the query
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return countries;

    const startsWith: typeof countries = [];
    const contains: typeof countries = [];

    for (const c of countries) {
      const nameLower = c.name.toLowerCase();
      if (nameLower.startsWith(q)) {
        startsWith.push(c);
      } else if (nameLower.includes(q)) {
        contains.push(c);
      }
    }

    return [...startsWith, ...contains];
  }, [countries, searchQuery]);

  // Whether Global option matches search
  const showGlobalOption = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return 'global (all countries) worldwide'.includes(q) || 'all'.includes(q);
  }, [searchQuery]);

  // Total selectable items count
  const totalItems = (showGlobalOption ? 1 : 0) + filteredCountries.length;

  // Handle open dropdown
  const handleOpen = (initialLetter?: string) => {
    setIsOpen(true);
    if (initialLetter) {
      setSearchQuery(initialLetter);
      setHighlightedIndex(0);
    } else {
      setSearchQuery('');
      setHighlightedIndex(0);
    }
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keydown on trigger button (type-to-search directly from trigger)
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleOpen();
      return;
    }

    // If user presses a printable alphanumeric character (e.g. 'G', 'g', 'U', etc.)
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      handleOpen(e.key);
    }
  };

  // Handle keydown inside search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < totalItems ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : totalItems - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (totalItems === 0) return;

      if (showGlobalOption && highlightedIndex === 0) {
        onCountryChange('Global (All Countries)');
        setIsOpen(false);
        return;
      }

      const countryIndex = showGlobalOption ? highlightedIndex - 1 : highlightedIndex;
      const selected = filteredCountries[countryIndex];
      if (selected) {
        onCountryChange(selected.name);
        setIsOpen(false);
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-slate-200 flex items-center justify-between gap-2 transition-all outline-none text-left group"
      >
        <span className="truncate flex items-center gap-1.5">
          {!currentCountryObj || country === 'Global (All Countries)' ? (
            <>
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-medium text-slate-200">Global (All 250 Countries)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                {userTier === 'ELITE' ? '✅' : '🔒 Elite'}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm shrink-0">{currentCountryObj.flag || '🏳️'}</span>
              <span className="font-medium text-white">{currentCountryObj.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                {isCountryUnlockedForTier(userTier, currentCountryObj.name) ? '✅' : '🔒 Pro'}
              </span>
            </>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : 'group-hover:text-slate-200'
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input Bar */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/80">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Type letter (e.g. 'G') or country..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Micro Quick Status Hint */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 px-1 font-mono">
              <span>{filteredCountries.length} countries found</span>
              <span className="text-emerald-400/80 text-[9px]">↑↓ navigate · Enter to select</span>
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-800/40 text-xs focus:outline-none"
          >
            {/* 1. Global (All Countries) Option */}
            {showGlobalOption && (
              <li
                role="option"
                aria-selected={country === 'Global (All Countries)'}
                onClick={() => {
                  onCountryChange('Global (All Countries)');
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(0)}
                className={`px-2.5 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                  highlightedIndex === 0
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : country === 'Global (All Countries)'
                    ? 'bg-slate-800/60 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Global (All 250 Countries &amp; Territories)</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-400 font-mono">
                    {userTier === 'ELITE' ? '✅ Unlocked' : '🔒 Elite'}
                  </span>
                  {country === 'Global (All Countries)' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </li>
            )}

            {/* Filtered Countries */}
            {filteredCountries.map((c, idx) => {
              const itemIndex = showGlobalOption ? idx + 1 : idx;
              const isSelected = country.toLowerCase() === c.name.toLowerCase();
              const isHighlighted = highlightedIndex === itemIndex;
              const isUnlocked = isCountryUnlockedForTier(userTier, c.name);

              return (
                <li
                  key={c.code || c.name}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onCountryChange(c.name);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(itemIndex)}
                  className={`px-2.5 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    isHighlighted
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : isSelected
                      ? 'bg-slate-800/60 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm shrink-0">{c.flag || '🏳️'}</span>
                    <span className="truncate">
                      {/* Highlight matching letter prefix */}
                      {searchQuery && c.name.toLowerCase().startsWith(searchQuery.toLowerCase()) ? (
                        <>
                          <span className="text-emerald-400 font-semibold underline underline-offset-2">
                            {c.name.slice(0, searchQuery.length)}
                          </span>
                          <span>{c.name.slice(searchQuery.length)}</span>
                        </>
                      ) : (
                        c.name
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                        isUnlocked
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-800 border-slate-700/60 text-slate-400'
                      }`}
                    >
                      {isUnlocked ? '✅' : '🔒 Pro'}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </li>
              );
            })}

            {/* Empty State */}
            {totalItems === 0 && (
              <li className="px-4 py-6 text-center text-slate-500 space-y-1">
                <p className="text-xs">No countries matching &quot;{searchQuery}&quot;</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Reset filter to view all
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
export default SearchableCountrySelect;
