import { mockDb } from '@/lib/supabase/mock-db';
import { getSearchProvider } from '@/lib/providers/search';
import type { Professor, ResearchMatch } from '@/types/database';

export async function getProfessorById(id: string): Promise<Professor | null> {
  mockDb.loadFromDisk();
  return mockDb.professors.find((p) => p.id === id) || null;
}

export async function getAllProfessors(): Promise<Professor[]> {
  mockDb.loadFromDisk();
  return mockDb.professors;
}

export async function saveResearchMatch(match: ResearchMatch): Promise<void> {
  mockDb.loadFromDisk();
  const existingIdx = mockDb.researchMatches.findIndex((m) => m.professor_id === match.professor_id);
  if (existingIdx >= 0) {
    mockDb.researchMatches[existingIdx] = match;
  } else {
    mockDb.researchMatches.push(match);
  }
  mockDb.persist();
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
  mockDb.loadFromDisk();

  // 1. Search in local verified faculty registry
  const normalizedCountry = targetCountry.toLowerCase().trim();
  const normalizedDiscipline = (discipline || '').toLowerCase().trim();
  const lowerKeywords = (keywords || []).map((k) => k.toLowerCase().trim());

  const availableProfs = mockDb.professors.filter((p) => {
    if (!p.email || contactedSet.has(p.email.toLowerCase().trim())) {
      return false;
    }

    const profCountry = (p.university_country || '').toLowerCase();
    const countryMatches =
      normalizedCountry === 'worldwide' ||
      normalizedCountry === 'all' ||
      normalizedCountry === '' ||
      profCountry.includes(normalizedCountry) ||
      normalizedCountry.includes(profCountry);

    const profDisc = (p.primary_discipline || '').toLowerCase();
    const profInterests = (p.research_interests || []).map((i) => i.toLowerCase()).join(' ');

    const disciplineMatches =
      !normalizedDiscipline ||
      profDisc.includes(normalizedDiscipline) ||
      normalizedDiscipline.includes(profDisc);

    const keywordMatches =
      lowerKeywords.length === 0 ||
      lowerKeywords.some((kw) => profDisc.includes(kw) || profInterests.includes(kw));

    return countryMatches && (disciplineMatches || keywordMatches);
  });

  if (availableProfs.length > 0) {
    const selected = availableProfs[0];
    return {
      source: 'VERIFIED_FACULTY_REGISTRY',
      professor: {
        id: selected.id,
        name: selected.name,
        title: selected.title || 'Professor',
        email: selected.email,
        university_name: selected.university_name,
        university_country: selected.university_country,
        primary_discipline: selected.primary_discipline,
        department_name: selected.department_name,
        research_interests: selected.research_interests,
        publications: selected.publications || [],
        recruiting_notes:
          selected.recruiting_notes ||
          `Accepting prospective ${targetDegree} researchers for upcoming intake.`,
      },
    };
  }

  // 2. Real-time Search Provider
  const searchProvider = getSearchProvider();
  const query = `professor faculty email ${discipline || keywords[0] || 'Computer Science'} ${targetCountry} university lab prospective students`;

  try {
    const liveResults = await searchProvider.searchProfessors(query, {
      discipline: discipline || keywords[0] || 'Research',
      country: targetCountry !== 'worldwide' ? targetCountry : undefined,
      limit: 5,
    });

    const uncontactedLive = (liveResults || []).filter(
      (p: any) => p.email && !contactedSet.has(p.email.toLowerCase().trim())
    );

    if (uncontactedLive.length > 0) {
      const selected = uncontactedLive[0];
      return {
        source: 'LIVE_ACADEMIC_SEARCH',
        professor: {
          id: selected.id || `live_prof_${Date.now()}`,
          name: selected.name,
          title: selected.title || 'Faculty Researcher',
          email: selected.email,
          university_name: selected.university_name || 'Global Academic Institution',
          university_country: selected.university_country || targetCountry,
          primary_discipline: selected.primary_discipline || discipline,
          department_name: selected.department_name || 'Department of Research',
          research_interests: selected.research_interests || keywords,
          publications: selected.publications || [],
          recruiting_notes: `Actively supervising graduate researchers.`,
        },
      };
    }
  } catch (searchErr) {
    console.warn('Real-time web search fallback notice:', searchErr);
  }

  // 3. Any remaining uncontacted professor
  const anyUncontacted = mockDb.professors.find(
    (p) => p.email && !contactedSet.has(p.email.toLowerCase().trim())
  );

  if (anyUncontacted) {
    return {
      source: 'FALLBACK_VERIFIED_REGISTRY',
      professor: anyUncontacted,
    };
  }

  return null;
}
