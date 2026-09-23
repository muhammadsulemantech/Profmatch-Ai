import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { getSearchProvider } from '@/lib/providers/search';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { checkAndIncrementQuota } from '@/lib/services/quota-service';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      targetCountry = 'United States',
      targetDegree = 'PhD',
      discipline = '',
      keywords = [],
      alreadyContactedEmails = [],
    } = body;

    const quotaCheck = checkAndIncrementQuota(session.user.id, 'autopilot', { country: targetCountry, increment: false });
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.error,
          message: quotaCheck.message,
          tier: quotaCheck.tier,
        },
        { status: 403 }
      );
    }

    const contactedSet = new Set(
      alreadyContactedEmails.map((e: string) => e?.toLowerCase().trim())
    );

    mockDb.loadFromDisk();

    // 1. First search in our verified faculty registry
    const normalizedCountry = targetCountry.toLowerCase().trim();
    const normalizedDiscipline = (discipline || '').toLowerCase().trim();
    const lowerKeywords = (keywords || []).map((k: string) => k.toLowerCase().trim());

    const availableProfs = mockDb.professors.filter(p => {
      if (!p.email || contactedSet.has(p.email.toLowerCase().trim())) {
        return false;
      }

      // Match Country (if specified and not global)
      const profCountry = (p.university_country || '').toLowerCase();
      const countryMatches =
        normalizedCountry === 'worldwide' ||
        normalizedCountry === 'all' ||
        normalizedCountry === '' ||
        profCountry.includes(normalizedCountry) ||
        normalizedCountry.includes(profCountry);

      // Match Discipline or Keywords
      const profDisc = (p.primary_discipline || '').toLowerCase();
      const profInterests = (p.research_interests || []).map(i => i.toLowerCase()).join(' ');

      const disciplineMatches =
        !normalizedDiscipline ||
        profDisc.includes(normalizedDiscipline) ||
        normalizedDiscipline.includes(profDisc);

      const keywordMatches =
        lowerKeywords.length === 0 ||
        lowerKeywords.some((kw: string) => profDisc.includes(kw) || profInterests.includes(kw));

      return countryMatches && (disciplineMatches || keywordMatches);
    });

    if (availableProfs.length > 0) {
      // Pick the best match
      const selected = availableProfs[0];
      return NextResponse.json({
        success: true,
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
          recruiting_notes: selected.recruiting_notes || `Accepting prospective ${targetDegree} researchers for upcoming intake.`,
        },
      });
    }

    // 2. If no unmatched professors in local DB, use real-time Tavily Search API
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
        return NextResponse.json({
          success: true,
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
        });
      }
    } catch (searchErr) {
      console.warn('Real-time web search fallback notice:', searchErr);
    }

    // 3. Fallback to any remaining uncontacted professor in DB
    const anyUncontacted = mockDb.professors.find(
      p => p.email && !contactedSet.has(p.email.toLowerCase().trim())
    );

    if (anyUncontacted) {
      return NextResponse.json({
        success: true,
        source: 'FALLBACK_VERIFIED_REGISTRY',
        professor: anyUncontacted,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'All eligible professors matching your criteria have already been contacted in this cycle.',
    });
  } catch (error: any) {
    console.error('Error in discover-next route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to discover faculty' },
      { status: 500 }
    );
  }
}
