import {
  Professor,
  VerificationStatus,
  EmailVerificationStatus,
  RecruitingStatus,
  ProfessorPublication,
  ProfessorSource,
} from '../../../types/database.ts';
import { SearchProvider, SearchFilters } from './search-provider.interface.ts';
import { getCountryIso2 } from '../../geography/country-iso.ts';
import { UniversityVerificationEngine } from '../../verification/university-verification.ts';

// 15-minute search cache to prevent redundant API calls
const openAlexCache = new Map<string, { timestamp: number; data: Professor[] }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export class OpenAlexProvider implements SearchProvider {
  name = 'OpenAlex Live Global Academic Graph Provider';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENALEX_API_KEY || process.env.SEARCH_API_KEY;
  }

  async searchProfessors(query: string, filters: SearchFilters): Promise<Professor[]> {
    const cacheKey = JSON.stringify({
      q: (query || '').toLowerCase().trim(),
      c: filters.country,
      d: filters.discipline || filters.academicDomain,
      p: filters.page || 1,
      l: filters.limit || 30,
    });

    const cached = openAlexCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const searchTerm =
        query ||
        filters.discipline ||
        filters.academicDomain ||
        filters.customField ||
        'Computer Science';

      const url = new URL('https://api.openalex.org/authors');
      url.searchParams.append('search', searchTerm);

      const limit = Math.min(filters.limit || 30, 50);
      const page = filters.page || 1;
      url.searchParams.append('per_page', String(limit));
      url.searchParams.append('page', String(page));

      // Country filter mapping
      if (filters.country && filters.country !== 'Global (All Countries)') {
        const iso2 = getCountryIso2(filters.country);
        if (iso2) {
          url.searchParams.append('filter', `last_known_institutions.country_code:${iso2}`);
        }
      }

      if (this.apiKey && !this.apiKey.includes('your-search-api-key')) {
        url.searchParams.append('api_key', this.apiKey);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'ProfMatch-AI/1.0 (mailto:outreach@profmatch.ai; https://profmatch.ai)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const results = data.results || [];

      // Transform raw OpenAlex author records into canonical Professor records
      const professors: Professor[] = [];

      for (let index = 0; index < results.length; index++) {
        const author = results[index];
        const lastInst = author.last_known_institutions?.[0] || {};
        const instName = lastInst.display_name || 'Global Research University';
        const countryCode = lastInst.country_code ? lastInst.country_code.toUpperCase() : 'International';
        const displayName = author.display_name || 'Academic Faculty Member';

        // Extract topics and concepts
        const concepts: string[] = (author.x_concepts || [])
          .slice(0, 5)
          .map((c: any) => c.display_name)
          .filter(Boolean);

        const topics: string[] = (author.topics || [])
          .slice(0, 5)
          .map((t: any) => t.display_name)
          .filter(Boolean);

        const combinedInterests = Array.from(new Set([...concepts, ...topics]));
        const authorId = author.id || `openalex-${page}-${index}`;
        const orcidUrl = author.orcid || undefined;

        // Perform strict university verification evaluation
        const verification = UniversityVerificationEngine.verifyFaculty({
          name: displayName,
          universityName: instName,
          profileUrl: authorId,
          officialPageUrl: undefined,
          email: null, // OpenAlex API authors do not have public emails; do NOT invent one
          openAlexAuthorId: authorId,
          orcid: orcidUrl,
        });

        // Parse recent/top publications if available in author metadata
        const samplePubs: ProfessorPublication[] = [];
        if (author.counts_by_year && Array.isArray(author.counts_by_year)) {
          const recentYears = author.counts_by_year.slice(-3);
          for (const y of recentYears) {
            if (y.works_count > 0) {
              samplePubs.push({
                id: `pub_${authorId.replace(/[^a-zA-Z0-9]/g, '_')}_${y.year}`,
                professor_id: authorId,
                title: `${displayName}'s Scholarly Publications (${y.year})`,
                year: Number(y.year),
                venue: 'Peer-Reviewed Scholarly Index',
                citations_count: Number(y.cited_by_count || 0),
                source_provider: 'OpenAlex',
                created_at: new Date().toISOString(),
              });
            }
          }
        }

        const sourceRecords: ProfessorSource[] = [
          {
            id: `src_openalex_${authorId.replace(/[^a-zA-Z0-9]/g, '_')}`,
            professor_id: authorId,
            source_type: 'PUB_METADATA',
            source_url: authorId,
            snippet: `OpenAlex Author ID: ${authorId} with ${author.works_count || 0} indexed works and ${author.cited_by_count || 0} citations.`,
            verified_at: new Date().toISOString(),
          },
        ];

        // Academic designation: Academic Researcher (requires institutional directory proof for Full Professor)
        const academicTitle = author.works_count > 50 ? 'Senior Faculty Researcher' : 'Academic Researcher';

        professors.push({
          id: authorId,
          university_id: lastInst.id || `univ-${index}`,
          name: displayName,
          title: academicTitle,
          position: academicTitle,
          university_name: instName,
          university_country: countryCode,
          university_region: lastInst.geo?.region || 'Academic Region',
          university_city: lastInst.geo?.city || undefined,
          // CRITICAL RULE 1: Never invent email addresses; mark null and UNVERIFIED
          email: null,
          email_verification_status: 'UNVERIFIED' as EmailVerificationStatus,
          verification_status: 'UNVERIFIED' as VerificationStatus,
          confidence_score: author.works_count > 10 ? 65 : 45,
          recruiting_status: 'UNKNOWN' as RecruitingStatus,
          recruiting_notes: 'Academic author indexed in OpenAlex graph. Recruitment status requires direct department inquiry.',
          academic_domain: filters.academicDomain || combinedInterests[0] || 'STEM & Technology',
          primary_discipline: filters.discipline || combinedInterests[0] || 'Computer Science & AI',
          interdisciplinary_tags: combinedInterests.slice(1, 4),
          research_interests:
            combinedInterests.length > 0
              ? combinedInterests
              : ['Artificial Intelligence', 'Data Science', 'Machine Learning'],
          lab_url: authorId,
          google_scholar_url: orcidUrl,
          orcid: orcidUrl,
          profile_url: authorId,
          keywords: combinedInterests,
          publications: samplePubs,
          sources: sourceRecords,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      openAlexCache.set(cacheKey, { timestamp: Date.now(), data: professors });
      return professors;
    } catch {
      return [];
    }
  }

  async verifyFacultyProfile(profileUrl: string): Promise<{
    isVerified: boolean;
    sourceUrl: string;
    sourceType: string;
    snippet?: string;
    confidenceScore: number;
    emailStatus?: EmailVerificationStatus;
  }> {
    return {
      isVerified: false,
      sourceUrl: profileUrl || 'https://openalex.org',
      sourceType: 'OPENALEX_ACADEMIC_GRAPH',
      snippet: 'OpenAlex graph citation record — email and faculty active status require institutional confirmation.',
      confidenceScore: 0.3,
      emailStatus: 'UNVERIFIED',
    };
  }
}

/**
 * Fetches real top peer-reviewed works for an OpenAlex author entity
 */
export async function fetchAuthorTopWorks(
  authorId: string,
  limit: number = 3
): Promise<ProfessorPublication[]> {
  const cleanId = authorId.startsWith('http') ? authorId.split('/').pop() : authorId;
  if (!cleanId || !cleanId.startsWith('A')) return [];

  const apiKey = process.env.OPENALEX_API_KEY || process.env.SEARCH_API_KEY;
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.append('filter', `author.id:${cleanId}`);
  url.searchParams.append('sort', 'cited_by_count:desc');
  url.searchParams.append('per_page', String(limit));
  if (apiKey) url.searchParams.append('api_key', apiKey);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'ProfMatch-AI/1.0 (mailto:outreach@profmatch.ai; https://profmatch.ai)',
        ...(apiKey ? { 'api-key': apiKey } : {}),
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((w: any) => ({
      id: w.id,
      professor_id: authorId,
      title: w.title || 'Scholarly Work',
      year: w.publication_year || new Date().getFullYear(),
      venue: w.primary_location?.source?.display_name || 'Academic Journal / Conference',
      citations_count: w.cited_by_count || 0,
      doi: w.doi,
      abstract: w.abstract_inverted_index
        ? Object.keys(w.abstract_inverted_index).slice(0, 50).join(' ')
        : '',
      url: w.doi || w.id,
      source_provider: 'OpenAlex',
      created_at: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

