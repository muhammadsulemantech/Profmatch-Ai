'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Search,
  Filter,
  School,
  ExternalLink,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  Bookmark,
  Check,
  Globe,
  BookOpen,
  Layers,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import { formatScore } from '@/lib/utils';
import { getAllCountries, getRegionsForCountry, getCountryByNameOrCode } from '@/lib/geography/global-geography';
import { ACADEMIC_DOMAINS, parseNaturalLanguageQuery } from '@/lib/taxonomy/academic-taxonomy';
import { Professor } from '@/types/database';

const DISCOVERY_STAGES = [
  'Discovering accredited universities in target region...',
  'Resolving academic units, faculties & departments...',
  'Discovering faculty appointments & research chairs...',
  'Cross-referencing official university directory profiles...',
  'Verifying public institutional emails (.edu / .ac)...',
  'Attributing peer-reviewed scholarly publications...',
  'Calculating research alignment & interdisciplinary fit...',
];

export default function SearchPage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();

  const [naturalQuery, setNaturalQuery] = useState('');
  const [country, setCountry] = useState('Global (All Countries)');
  const [region, setRegion] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All Disciplines');
  const [customField, setCustomField] = useState('');
  const [interdisciplinary, setInterdisciplinary] = useState(true);
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [emailVerifiedOnly, setEmailVerifiedOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedProfIds, setSavedProfIds] = useState<string[]>([]);
  const [professorsList, setProfessorsList] = useState<Professor[]>(mockDb.professors);
  const [isRestored, setIsRestored] = useState(false);

  // Restore saved search filters & results from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = sessionStorage.getItem('profmatch_search_state');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.naturalQuery !== undefined) setNaturalQuery(parsed.naturalQuery);
          if (parsed.country !== undefined) setCountry(parsed.country);
          if (parsed.region !== undefined) setRegion(parsed.region);
          if (parsed.selectedDomain !== undefined) setSelectedDomain(parsed.selectedDomain);
          if (parsed.selectedDiscipline !== undefined) setSelectedDiscipline(parsed.selectedDiscipline);
          if (parsed.customField !== undefined) setCustomField(parsed.customField);
          if (parsed.interdisciplinary !== undefined) setInterdisciplinary(parsed.interdisciplinary);
          if (parsed.recruitingOnly !== undefined) setRecruitingOnly(parsed.recruitingOnly);
          if (parsed.verifiedOnly !== undefined) setVerifiedOnly(parsed.verifiedOnly);
          if (parsed.emailVerifiedOnly !== undefined) setEmailVerifiedOnly(parsed.emailVerifiedOnly);
          if (parsed.savedOnly !== undefined) setSavedOnly(parsed.savedOnly);
          if (parsed.professorsList && Array.isArray(parsed.professorsList) && parsed.professorsList.length > 0) {
            setProfessorsList(parsed.professorsList);
          }
        }
      } catch (e) {
        console.error('Failed to restore search state:', e);
      } finally {
        setIsRestored(true);
      }
    }
  }, []);

  // Save current search state to sessionStorage whenever filters or results change
  useEffect(() => {
    if (typeof window !== 'undefined' && isRestored) {
      try {
        sessionStorage.setItem(
          'profmatch_search_state',
          JSON.stringify({
            naturalQuery,
            country,
            region,
            selectedDomain,
            selectedDiscipline,
            customField,
            interdisciplinary,
            recruitingOnly,
            verifiedOnly,
            emailVerifiedOnly,
            savedOnly,
            professorsList,
          })
        );
      } catch (e) {
        console.error('Failed to persist search state:', e);
      }
    }
  }, [
    naturalQuery,
    country,
    region,
    selectedDomain,
    selectedDiscipline,
    customField,
    interdisciplinary,
    recruitingOnly,
    verifiedOnly,
    emailVerifiedOnly,
    savedOnly,
    professorsList,
    isRestored,
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = user ? `profmatch_saved_profs_${user.id}` : 'profmatch_saved_profs_guest';
      try {
        const stored = localStorage.getItem(key);
        if (stored) setSavedProfIds(JSON.parse(stored));
      } catch {}
    }
  }, [user]);

  const toggleSave = (id: string) => {
    requireAuth('save faculty to shortlist', () => {
      const updated = savedProfIds.includes(id)
        ? savedProfIds.filter(pId => pId !== id)
        : [...savedProfIds, id];
      setSavedProfIds(updated);
      if (typeof window !== 'undefined') {
        const key = user ? `profmatch_saved_profs_${user.id}` : 'profmatch_saved_profs_guest';
        localStorage.setItem(key, JSON.stringify(updated));
      }
    });
  };

  // Filtered List based on savedOnly and search criteria
  const displayedProfessors = useMemo(() => {
    if (savedOnly) {
      return professorsList.filter(p => savedProfIds.includes(p.id));
    }
    return professorsList;
  }, [professorsList, savedOnly, savedProfIds]);
  
  // Progress & loading states
  const [isSearching, setIsSearching] = useState(false);
  const [discoveryStageIndex, setDiscoveryStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const countries = useMemo(() => getAllCountries(), []);
  const selectedCountryObj = useMemo(() => (country !== 'Global (All Countries)' ? getCountryByNameOrCode(country) : null), [country]);
  const availableRegions = useMemo(() => (selectedCountryObj ? getRegionsForCountry(selectedCountryObj.name) : []), [selectedCountryObj]);

  const availableDisciplines = useMemo(() => {
    if (selectedDomain === 'All Domains') {
      return Array.from(new Set(ACADEMIC_DOMAINS.flatMap(d => d.disciplines))).sort();
    }
    const found = ACADEMIC_DOMAINS.find(d => d.name === selectedDomain);
    return found ? found.disciplines : [];
  }, [selectedDomain]);

  // Protected Natural Language Prompt Parsing
  const handleNaturalLanguageParse = () => {
    if (!naturalQuery.trim()) return;

    requireAuth('search accredited faculty registries', async () => {
      setIsSearching(true);
      setProgressPercent(10);
      setDiscoveryStageIndex(0);

      const parsed = parseNaturalLanguageQuery(naturalQuery);

      if (parsed.country) setCountry(parsed.country);
      if (parsed.region) setRegion(parsed.region);
      if (parsed.field) {
        setSelectedDiscipline(parsed.field);
        if (parsed.domain) setSelectedDomain(parsed.domain);
      }
      if (parsed.recruitingOnly) setRecruitingOnly(true);
      if (parsed.interdisciplinary) setInterdisciplinary(true);

      for (let i = 1; i < DISCOVERY_STAGES.length; i++) {
        await new Promise(r => setTimeout(r, 120));
        setDiscoveryStageIndex(i);
        setProgressPercent(Math.round((i / (DISCOVERY_STAGES.length - 1)) * 100));
      }

      await runSearchPayload({
        query: naturalQuery,
        country: parsed.country || (country !== 'Global (All Countries)' ? country : undefined),
        region: parsed.region || (region !== '' ? region : undefined),
        discipline: parsed.field || (selectedDiscipline !== 'All Disciplines' ? selectedDiscipline : undefined),
        customField: customField || undefined,
        interdisciplinary: parsed.interdisciplinary || interdisciplinary,
        recruitingOnly: parsed.recruitingOnly || recruitingOnly,
        verifiedOnly,
        emailVerifiedOnly,
      });

      setIsSearching(false);
    });
  };

  // Direct search execution
  const executeSearch = (overrides?: any) => {
    requireAuth('query European and global faculty registries', async () => {
      await runSearchPayload(overrides);
    });
  };

  const runSearchPayload = async (overrides?: any) => {
    setIsSearching(true);
    setProgressPercent(20);
    setDiscoveryStageIndex(1);

    try {
      const payload = {
        query: naturalQuery || undefined,
        country: country !== 'Global (All Countries)' ? country : undefined,
        region: region || undefined,
        academicDomain: selectedDomain !== 'All Domains' ? selectedDomain : undefined,
        discipline: selectedDiscipline !== 'All Disciplines' ? selectedDiscipline : undefined,
        customField: customField || undefined,
        interdisciplinary,
        recruitingOnly,
        verifiedOnly,
        emailVerifiedOnly,
        ...overrides,
      };

      const timer = setTimeout(() => {
        setDiscoveryStageIndex(4);
        setProgressPercent(65);
      }, 150);

      const res = await fetch('/api/professors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearTimeout(timer);
      setDiscoveryStageIndex(6);
      setProgressPercent(100);

      if (res.ok) {
        const data = await res.json();
        setProfessorsList(data.professors || []);
      }
    } catch (err) {
      console.error('Search request failed', err);
    } finally {
      setTimeout(() => setIsSearching(false), 200);
    }
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setRegion('');
  };

  const handleResetFilters = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('profmatch_search_state');
      } catch {}
    }
    setCountry('Global (All Countries)');
    setRegion('');
    setSelectedDomain('All Domains');
    setSelectedDiscipline('All Disciplines');
    setCustomField('');
    setRecruitingOnly(false);
    setVerifiedOnly(true);
    setEmailVerifiedOnly(false);
    setInterdisciplinary(true);
    setSavedOnly(false);
    setNaturalQuery('');
    setProfessorsList(mockDb.professors);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#080B11] text-slate-100 min-h-screen selection:bg-emerald-500/25 selection:text-emerald-300">
      {/* Editorial Search Header */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <Globe className="w-3.5 h-3.5" /> Universal Faculty Directory &bull; 190+ Countries
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Professor Discovery &amp; Research Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Discover relevant faculty across accredited universities, understand their published research, and find verified institutional emails.
          </p>
        </div>

        {/* Search Bar (Requirement #14) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-200">Search by research topic, country, or scholar name</span>
            <span className="text-[11px] hidden sm:inline text-slate-500">
              Example: &ldquo;Find professors working on sustainable transportation in Germany&rdquo;
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={naturalQuery}
                onChange={e => setNaturalQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNaturalLanguageParse()}
                placeholder="Find professors working on sustainable transportation in Germany..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={handleNaturalLanguageParse}
              disabled={isSearching}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  AI Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Discovery Pipeline Progress Bar */}
        {isSearching && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-emerald-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                {DISCOVERY_STAGES[discoveryStageIndex]}
              </span>
              <span className="font-mono text-xs text-slate-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Layout: Filters Sidebar (4 cols) + Results (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filter Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" /> Filters
              </h2>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-white underline transition-colors"
              >
                Reset All
              </button>
            </div>

            {/* 1. Country Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">
                Country / Territory
              </label>
              <select
                value={country}
                onChange={e => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Global (All Countries)">Global (All 190+ Countries)</option>
                {countries.map(c => (
                  <option key={c.code} value={c.name}>
                    {c.name} ({c.continent})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Region / Province Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">
                {selectedCountryObj ? selectedCountryObj.regionLabel : 'State / Province / Region'}
              </label>
              {availableRegions.length > 0 ? (
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All {selectedCountryObj?.regionLabel || 'Regions'}</option>
                  {availableRegions.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  placeholder="e.g. Bavaria, Ontario, Tokyo"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>

            {/* 3. Academic Domain Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">Academic Domain</label>
              <select
                value={selectedDomain}
                onChange={e => {
                  setSelectedDomain(e.target.value);
                  setSelectedDiscipline('All Disciplines');
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="All Domains">All Academic Domains</option>
                {ACADEMIC_DOMAINS.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Discipline Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">Primary Field / Discipline</label>
              <select
                value={selectedDiscipline}
                onChange={e => setSelectedDiscipline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="All Disciplines">All Disciplines</option>
                {availableDisciplines.map(disc => (
                  <option key={disc} value={disc}>
                    {disc}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Custom / Novel Field Input */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">Research Area / Keyword</label>
              <input
                type="text"
                value={customField}
                onChange={e => setCustomField(e.target.value)}
                placeholder="e.g. Energy Storage, Neural Interfaces"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* 6. Verification & Filter Toggles */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={e => setSavedOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1 font-medium text-emerald-400">
                  <Bookmark className="w-3.5 h-3.5 fill-emerald-500/20" /> Saved Faculty Only ({savedProfIds.length})
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={interdisciplinary}
                  onChange={e => setInterdisciplinary(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Interdisciplinary &amp; Cross-Department</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={recruitingOnly}
                  onChange={e => setRecruitingOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Actively Recruiting Only</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={e => setVerifiedOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Official University Profiles Only</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={emailVerifiedOnly}
                  onChange={e => setEmailVerifiedOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Public Academic Email Verified</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => executeSearch()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" /> Apply Filters
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span>
              Showing <strong className="text-white font-semibold">{displayedProfessors.length}</strong> {savedOnly ? 'saved' : 'verified'} faculty records
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Cross-verified with official registries
            </span>
          </div>

          {displayedProfessors.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                {savedOnly ? <Bookmark className="w-6 h-6 text-emerald-400" /> : <Globe className="w-6 h-6" />}
              </div>
              <p className="text-sm font-semibold text-white">
                {savedOnly ? 'No faculty saved yet' : 'No faculty matching this exact filter combination'}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {savedOnly
                  ? 'Click the bookmark icon (🔖) on any professor card to save them to your faculty list.'
                  : 'Try widening your field scope or selecting "Global (All Countries)" to discover related scholars.'}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-xl border border-slate-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            displayedProfessors.map(prof => {
              const match = mockDb.researchMatches.find(m => m.professor_id === prof.id);
              const isSaved = savedProfIds.includes(prof.id);

              return (
                <div
                  key={prof.id}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
                >
                  {/* Top Profile Details & Match */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Refined Academic Initials Crest */}
                      <div className="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-heading font-bold text-emerald-400 text-sm shrink-0">
                        {prof.name.split(' ').filter(p => !p.includes('.')).map(n => n[0]).slice(0, 2).join('')}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => requireAuth(`view profile for ${prof.name}`, () => router.push(`/professors/${prof.id}`))}
                            className="font-heading text-lg font-bold text-white hover:text-emerald-400 transition-colors text-left"
                          >
                            {prof.name}
                          </button>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {prof.title}
                          </span>
                          <span className="badge-verified">
                            <Check className="w-3 h-3 text-emerald-400" />
                            {prof.verification_status === 'VERIFIED' ? 'Verified University Profile' : 'Partially Verified'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400">
                          {prof.department_name || prof.academic_unit_name || 'Academic Unit'}
                        </p>
                        <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5" />
                          <span>{prof.university_name}</span>
                          <span className="text-slate-400 font-normal">
                            &bull; {prof.university_region ? `${prof.university_region}, ` : ''}{prof.university_country}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Restrained Match Score (Section 19) */}
                    <div className="flex items-center sm:items-end sm:flex-col gap-2 shrink-0">
                      {match && (
                        <div className="bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg text-right">
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
                        onClick={() => toggleSave(prof.id)}
                        className={`p-2 rounded-lg border transition-colors ${
                          isSaved ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
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
                      <span key={i} className="px-2.5 py-0.5 rounded text-xs bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                        {interest}
                      </span>
                    ))}
                    {(prof.interdisciplinary_tags || []).map((tag, i) => (
                      <span key={`tag-${i}`} className="px-2.5 py-0.5 rounded text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium">
                        &bull; {tag}
                      </span>
                    ))}
                  </div>

                  {/* Why this match box (Requirement #15) */}
                  {match && (
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                      <span className="font-semibold text-emerald-400 block">Why this match:</span>
                      <p className="text-slate-300 leading-relaxed">
                        {match.explanation || `Research alignment in ${prof.primary_discipline} with shared methodology in recent publications.`}
                      </p>
                    </div>
                  )}

                  {/* Card Actions & Email Verification */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                    <div className="flex flex-wrap items-center gap-3 text-slate-400">
                      <a href={prof.profile_url} target="_blank" rel="noreferrer" className="hover:text-emerald-400 flex items-center gap-1 underline">
                        Official Faculty Webpage <ExternalLink className="w-3 h-3" />
                      </a>
                      
                      {prof.email ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="font-mono text-xs">{prof.email}</span>
                          <span className="text-[11px] text-slate-400">(Public Email Available)</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Email via Faculty Portal
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => requireAuth(`view profile for ${prof.name}`, () => router.push(`/professors/${prof.id}`))}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 text-xs font-medium transition-colors"
                      >
                        View Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => requireAuth(`draft outreach proposal for ${prof.name}`, () => router.push(`/outreach/generate?professorId=${prof.id}`))}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        Draft Email <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

