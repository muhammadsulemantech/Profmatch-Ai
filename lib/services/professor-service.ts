import { createAdminClient } from '@/lib/supabase/admin';
import { mockDb } from '@/lib/supabase/mock-db';
import { getSearchProvider } from '@/lib/providers/search';
import type { Professor, ResearchMatch, ProfessorPublication, ProfessorSource } from '@/types/database';

/**
 * Upsert a single professor record into Supabase PostgreSQL
 */
export async function upsertProfessor(prof: Partial<Professor> & { id: string; name: string }): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Keep in-memory cache synchronized
  mockDb.loadFromDisk();
  const existingIdx = mockDb.professors.findIndex((p) => p.id === prof.id || (prof.orcid && p.orcid === prof.orcid));
  if (existingIdx >= 0) {
    mockDb.professors[existingIdx] = { ...mockDb.professors[existingIdx], ...prof } as Professor;
  } else {
    mockDb.professors.push(prof as Professor);
  }
  mockDb.persist();

  if (!supabase) return;

  try {
    const openalexId = prof.id.startsWith('http') || prof.id.startsWith('openalex-') ? prof.id : undefined;

    const row = {
      id: prof.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? prof.id : undefined,
      openalex_id: openalexId,
      orcid: prof.orcid || null,
      name: prof.name,
      title: prof.title || 'Academic Researcher',
      real_title: prof.real_title || prof.title || 'Academic Researcher',
      position: prof.position || prof.title || 'Academic Researcher',
      email: prof.email || null,
      email_verification_status: prof.email_verification_status || 'UNVERIFIED',
      profile_url: prof.profile_url || prof.id,
      lab_url: prof.lab_url || null,
      google_scholar_url: prof.google_scholar_url || null,
      research_interests: prof.research_interests || [],
      interdisciplinary_tags: prof.interdisciplinary_tags || [],
      keywords: prof.keywords || [],
      recruiting_status: prof.recruiting_status || 'UNKNOWN',
      recruiting_notes: prof.recruiting_notes || null,
      confidence_score: prof.confidence_score ? Number(prof.confidence_score) : 0.5,
      verification_status: prof.verification_status || 'UNVERIFIED',
      last_verified_at: prof.last_verified_at || null,
      last_synced_at: now,
      updated_at: now,
    };

    // Upsert using openalex_id if available, otherwise insert
    if (openalexId) {
      await supabase.from('professors').upsert(row, { onConflict: 'openalex_id' });
    } else {
      await supabase.from('professors').insert(row);
    }
  } catch (err) {
    console.warn('[PROFESSOR DB UPSERT NOTICE]', err);
  }
}

/**
 * Batch upsert discovered professors for high-throughput search queries
 */
export async function upsertProfessorsBatch(professors: Professor[]): Promise<void> {
  for (const prof of professors) {
    await upsertProfessor(prof);
  }
}

/**
 * Retrieves a professor by canonical database ID, OpenAlex ID, or local cache
 */
export async function getProfessorById(id: string): Promise<Professor | null> {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      let query = supabase.from('professors').select('*, professor_publications(*), professor_sources(*)');

      const isUuid = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.or(`openalex_id.eq.${id},profile_url.eq.${id}`);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          university_id: data.university_id || 'univ-unknown',
          university_name: data.university_name || 'Academic Institution',
          university_country: data.university_country || 'International',
          name: data.name,
          title: data.title || 'Academic Researcher',
          real_title: data.real_title || data.title,
          position: data.position || data.title,
          email: data.email,
          email_verification_status: data.email_verification_status,
          profile_url: data.profile_url,
          lab_url: data.lab_url,
          google_scholar_url: data.google_scholar_url,
          orcid: data.orcid,
          research_interests: Array.isArray(data.research_interests) ? data.research_interests : [],
          interdisciplinary_tags: Array.isArray(data.interdisciplinary_tags) ? data.interdisciplinary_tags : [],
          keywords: Array.isArray(data.keywords) ? data.keywords : [],
          recruiting_status: data.recruiting_status || 'UNKNOWN',
          recruiting_notes: data.recruiting_notes,
          confidence_score: Number(data.confidence_score || 0.5),
          verification_status: data.verification_status || 'UNVERIFIED',
          last_verified_at: data.last_verified_at,
          publications: data.professor_publications || [],
          sources: data.professor_sources || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('[PROFESSOR DB FETCH NOTICE]', e);
    }
  }

  // Fallback to in-memory/local store
  mockDb.loadFromDisk();
  return (
    mockDb.professors.find(
      (p) => p.id === id || p.id.includes(id) || id.includes(p.id) || (p.orcid && id.includes(p.orcid))
    ) || null
  );
}

export async function getAllProfessors(): Promise<Professor[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('professors').select('*').limit(100);
      if (!error && data && data.length > 0) {
        return data as Professor[];
      }
    } catch {}
  }
  mockDb.loadFromDisk();
  return mockDb.professors;
}

export async function saveResearchMatch(match: ResearchMatch): Promise<void> {
  const supabase = createAdminClient();

  // Save to in-memory/mock store
  mockDb.loadFromDisk();
  const existingIdx = mockDb.researchMatches.findIndex((m) => m.professor_id === match.professor_id && m.user_id === match.user_id);
  if (existingIdx >= 0) {
    mockDb.researchMatches[existingIdx] = match;
  } else {
    mockDb.researchMatches.push(match);
  }
  mockDb.persist();

  if (!supabase) return;

  try {
    // Only attempt UUID insert in PostgreSQL if professor_id is a valid UUID
    const isProfUuid = match.professor_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    if (isProfUuid) {
      await supabase.from('research_matches').upsert({
        user_id: match.user_id,
        professor_id: match.professor_id,
        overall_score: match.overall_score,
        research_score: match.research_score,
        project_score: match.project_score,
        skills_score: match.skills_score,
        publication_score: match.publication_score,
        explanation: match.explanation,
        breakdown: match.breakdown,
        generated_at: match.generated_at,
      }, { onConflict: 'user_id,professor_id' });
    }
  } catch (err) {
    console.warn('[RESEARCH MATCH DB SAVE NOTICE]', err);
  }
}

export interface DiscoverNextOptions {
  targetCountry?: string;
  targetDegree?: string;
  discipline?: string;
  keywords?: string[];
  alreadyContactedEmails?: string[];
}

export async function discoverNextProfessor(
  options: DiscoverNextOptions
): Promise<{ professor: Partial<Professor>; source: string } | null> {
  const {
    targetCountry = 'United States',
    targetDegree = 'PhD',
    discipline = '',
    keywords = [],
    alreadyContactedEmails = [],
  } = options;

  const contactedSet = new Set(alreadyContactedEmails.map((e) => e?.toLowerCase().trim()));

  // 1. Live Academic Search via active provider (OpenAlex)
  const searchProvider = getSearchProvider();
  const query = `${discipline || keywords[0] || 'Computer Science'} ${targetCountry !== 'worldwide' ? targetCountry : ''}`.trim();

  try {
    const liveResults = await searchProvider.searchProfessors(query, {
      discipline: discipline || keywords[0] || 'Computer Science',
      country: targetCountry !== 'worldwide' ? targetCountry : undefined,
      limit: 10,
    });

    const uncontactedLive = (liveResults || []).filter(
      (p: any) => p.email && !contactedSet.has(p.email.toLowerCase().trim())
    );

    if (uncontactedLive.length > 0) {
      const selected = uncontactedLive[0];
      return {
        source: 'OPENALEX_LIVE_DISCOVERY',
        professor: {
          id: selected.id || `live_prof_${Date.now()}`,
          name: selected.name,
          title: selected.title || 'Faculty Researcher',
          email: selected.email,
          university_name: selected.university_name || 'Academic Institution',
          university_country: selected.university_country || targetCountry,
          primary_discipline: selected.primary_discipline || discipline,
          department_name: selected.department_name || 'Academic Department',
          research_interests: selected.research_interests || keywords,
          publications: selected.publications || [],
          recruiting_notes: `Candidate researcher identified via OpenAlex graph for prospective ${targetDegree} program.`,
        },
      };
    }
  } catch (searchErr) {
    console.warn('[DISCOVER NEXT REALTIME NOTICE]', searchErr);
  }

  // 2. Search local database / cache for uncontacted faculty
  mockDb.loadFromDisk();
  const availableProfs = mockDb.professors.filter((p) => {
    if (!p.email || contactedSet.has(p.email.toLowerCase().trim())) {
      return false;
    }
    const profCountry = (p.university_country || '').toLowerCase();
    const countryMatches =
      targetCountry === 'worldwide' ||
      targetCountry === 'all' ||
      profCountry.includes(targetCountry.toLowerCase()) ||
      targetCountry.toLowerCase().includes(profCountry);

    return countryMatches;
  });

  if (availableProfs.length > 0) {
    const selected = availableProfs[0];
    return {
      source: 'CANONICAL_DATABASE_REGISTRY',
      professor: selected,
    };
  }

  return null;
}

/**
 * Universal faculty discovery by query / keywords across OpenAlex and local cache
 */
export async function discoverFacultyByKeywords(
  query: string,
  options?: { limit?: number; countries?: string[] }
): Promise<Professor[]> {
  const searchProvider = getSearchProvider();
  try {
    const results = await searchProvider.searchProfessors(query, {
      country: options?.countries?.[0],
      limit: options?.limit || 10,
    });
    if (results && results.length > 0) {
      return results as Professor[];
    }
  } catch (err) {
    console.warn('[FACULTY DISCOVERY WARNING]', err);
  }

  mockDb.loadFromDisk();
  const lowerQ = query.toLowerCase();
  return mockDb.professors
    .filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQ) ||
        (p.primary_discipline && p.primary_discipline.toLowerCase().includes(lowerQ)) ||
        (p.keywords && p.keywords.some((k) => k.toLowerCase().includes(lowerQ)))
    )
    .slice(0, options?.limit || 10);
}
