// ==========================================================
// PROFMATCH AI — GLOBAL ACADEMIC DISCOVERY ENGINE
// ==========================================================

import { Professor, VerificationStatus, EmailVerificationStatus } from '@/types/database';
import { SearchProvider, SearchFilters } from './search-provider.interface';
import { mockDb } from '@/lib/supabase/mock-db';
import { analyzeAcademicField, parseNaturalLanguageQuery } from '@/lib/taxonomy/academic-taxonomy';
import { getCountryByNameOrCode } from '@/lib/geography/global-geography';

// Reusable search discovery cache to reduce API costs and guarantee fast responses
const searchCache = new Map<string, { timestamp: number; results: Professor[] }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class GlobalAcademicDiscoveryEngine implements SearchProvider {
  name = 'Global Academic Discovery & Cross-Disciplinary Engine';

  async searchProfessors(query: string, filters: SearchFilters): Promise<Professor[]> {
    const cacheKey = JSON.stringify({ query: (query || '').toLowerCase().trim(), filters });
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.results;
    }

    // 1. Natural Language Query Analysis (if query looks like a natural language prompt)
    let effectiveCountry = filters.country;
    let effectiveRegion = filters.region || filters.state;
    let effectiveDiscipline = filters.discipline || filters.field || filters.customField;
    let isInterdisciplinary = filters.interdisciplinary ?? true;

    if (query && query.split(' ').length >= 3) {
      const parsedNL = parseNaturalLanguageQuery(query);
      if (parsedNL.country && (!effectiveCountry || effectiveCountry === 'Global (All Countries)')) {
        effectiveCountry = parsedNL.country;
      }
      if (parsedNL.region && !effectiveRegion) {
        effectiveRegion = parsedNL.region;
      }
      if (parsedNL.field && !effectiveDiscipline) {
        effectiveDiscipline = parsedNL.field;
      }
      if (parsedNL.interdisciplinary) {
        isInterdisciplinary = true;
      }
    }

    // 2. Dynamic Field & Academic Domain Analysis
    let fieldAnalysis = effectiveDiscipline ? analyzeAcademicField(effectiveDiscipline) : null;

    // 3. Filter Baseline Faculty Pool
    let list = [...mockDb.professors];

    // Filter by Country (No US limitation)
    if (effectiveCountry && effectiveCountry.trim() !== '' && effectiveCountry !== 'Global (All Countries)') {
      const targetCountryObj = getCountryByNameOrCode(effectiveCountry);
      const targetCountryName = targetCountryObj ? targetCountryObj.name.toLowerCase() : effectiveCountry.toLowerCase();
      const targetCountryCode = targetCountryObj ? targetCountryObj.code.toLowerCase() : '';

      list = list.filter(p => {
        const profCountry = (p.university_country || '').toLowerCase();
        return profCountry.includes(targetCountryName) ||
          targetCountryName.includes(profCountry) ||
          (targetCountryCode && profCountry.includes(targetCountryCode));
      });
    }

    // Filter by Region (State / Province / Prefecture / County / Canton)
    if (effectiveRegion && effectiveRegion.trim() !== '') {
      const cleanRegion = effectiveRegion.split('(')[0].trim().toLowerCase();
      list = list.filter(p => {
        const profRegion = (p.university_region || p.university_state || '').toLowerCase();
        return profRegion.includes(cleanRegion) || cleanRegion.includes(profRegion);
      });
    }

    // Filter by Academic Discipline / Field with Interdisciplinary expansion
    if (effectiveDiscipline && effectiveDiscipline.trim() !== '') {
      const targetDisc = effectiveDiscipline.toLowerCase();
      const relatedDiscs = fieldAnalysis ? fieldAnalysis.relatedDisciplines.map(d => d.toLowerCase()) : [];
      const expansionKws = fieldAnalysis ? fieldAnalysis.expansionKeywords.map(k => k.toLowerCase()) : [];

      list = list.filter(p => {
        const profDisc = (p.primary_discipline || '').toLowerCase();
        const profDomain = (p.academic_domain || '').toLowerCase();
        const profInterdisciplinary = (p.interdisciplinary_tags || []).map(t => t.toLowerCase());
        const profInterests = p.research_interests.map(i => i.toLowerCase());
        const profKeywords = p.keywords.map(k => k.toLowerCase());

        // Direct discipline match
        const isDirectMatch = profDisc.includes(targetDisc) || targetDisc.includes(profDisc);
        if (isDirectMatch) return true;

        // Domain overlap
        if (fieldAnalysis && profDomain === fieldAnalysis.domain.toLowerCase()) return true;

        // Keyword overlap
        const hasKeywordMatch = expansionKws.some(kw =>
          profInterests.some(i => i.includes(kw) || kw.includes(i)) ||
          profKeywords.some(k => k.includes(kw) || kw.includes(k))
        );
        if (hasKeywordMatch) return true;

        // Interdisciplinary match
        if (isInterdisciplinary) {
          const hasInterdisciplinaryTag = profInterdisciplinary.some(tag =>
            tag.includes(targetDisc) || relatedDiscs.some(rd => tag.includes(rd))
          );
          if (hasInterdisciplinaryTag) return true;
        }

        return false;
      });
    }

    // Filter by Recruiting Status
    if (filters.recruitingOnly) {
      list = list.filter(p =>
        p.recruiting_status === 'VERIFIED_RECRUITING' ||
        p.recruiting_status === 'POSSIBLY_RECRUITING' ||
        p.recruiting_status === 'ACTIVELY_RECRUITING'
      );
    }

    // Filter by Verification Status
    if (filters.verifiedOnly) {
      list = list.filter(p => p.verification_status === 'VERIFIED' || p.verification_status === 'PARTIALLY_VERIFIED');
    }

    // Filter by Email Verification
    if (filters.emailVerifiedOnly) {
      list = list.filter(p => p.email_verification_status === 'VERIFIED' || p.email_verification_status === 'LIKELY');
    }

    // Filter by Academic Role Titles (if specified)
    if (filters.roleTitles && filters.roleTitles.length > 0) {
      const allowedRoles = filters.roleTitles.map(r => r.toLowerCase());
      list = list.filter(p => allowedRoles.some(ar => (p.title || '').toLowerCase().includes(ar)));
    }

    // Filter by Text Query (if query words were not already handled)
    if (query && query.trim() !== '') {
      const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      if (terms.length > 0) {
        list = list.filter(p => {
          const haystack = [
            p.name,
            p.university_name,
            p.university_country,
            p.university_region,
            p.primary_discipline,
            p.title,
            ...p.research_interests,
            ...p.keywords,
            ...(p.interdisciplinary_tags || []),
          ].join(' ').toLowerCase();

          return terms.some(t => haystack.includes(t));
        });
      }
    }

    // Deduplication: Remove any duplicate records matching normalized name and university

    // 5. Deduplication: Remove any duplicate records matching normalized name and university
    const seen = new Set<string>();
    const deduplicated: Professor[] = [];

    for (const p of list) {
      const key = `${p.name.toLowerCase()}_${(p.university_name || '').toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(p);
      }
    }

    // Cache the verified deduplicated results
    searchCache.set(cacheKey, { timestamp: Date.now(), results: deduplicated });

    return deduplicated;
  }

  async verifyFacultyProfile(profileUrl: string): Promise<{
    isVerified: boolean;
    sourceUrl: string;
    sourceType: string;
    snippet?: string;
    confidenceScore: number;
    emailStatus?: EmailVerificationStatus;
  }> {
    if (!profileUrl) {
      return {
        isVerified: false,
        sourceUrl: '',
        sourceType: 'UNKNOWN',
        confidenceScore: 0.2,
        emailStatus: 'NOT_FOUND',
      };
    }

    const lower = profileUrl.toLowerCase();
    const isEduDomain =
      lower.includes('.edu') ||
      lower.includes('.ac.') ||
      lower.includes('.edu.') ||
      lower.includes('tum.de') ||
      lower.includes('ox.ac.uk') ||
      lower.includes('kth.se') ||
      lower.includes('polimi.it') ||
      lower.includes('usp.br') ||
      lower.includes('u-tokyo.ac.jp');

    return {
      isVerified: false,
      sourceUrl: profileUrl,
      sourceType: isEduDomain ? 'INSTITUTIONAL_DIRECTORY_CANDIDATE' : 'SECONDARY_ACADEMIC_DIRECTORY',
      snippet: isEduDomain
        ? 'Institutional domain detected (.edu / .ac / accredited ccTLD). Record is unverified and requires direct email ping.'
        : 'Source profile registered with secondary academic directory — unverified.',
      confidenceScore: isEduDomain ? 0.6 : 0.3,
      emailStatus: 'UNVERIFIED',
    };
  }
}

import { OpenAlexProvider } from './openalex-provider';
import { TavilySearchProvider } from './tavily-provider';

export function getSearchProvider(): SearchProvider {
  const provider = process.env.SEARCH_PROVIDER || process.env.ACADEMIC_DATA_PROVIDER;
  if (provider?.toLowerCase() === 'tavily' || process.env.TAVILY_API_KEY) {
    return new TavilySearchProvider();
  }
  if (provider?.toLowerCase() === 'openalex' || process.env.OPENALEX_API_KEY) {
    return new OpenAlexProvider();
  }
  return new GlobalAcademicDiscoveryEngine();
}

export * from './search-provider.interface';
export * from './openalex-provider';
export * from './tavily-provider';


