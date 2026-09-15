import { NextRequest, NextResponse } from 'next/server';
import { getSearchProvider } from '@/lib/providers/search';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { verifyAuthSession } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication Guard (Requirement #4 - Backend Enforcement)
    const session = await verifyAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must create an account or sign in to search professors.' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rl = checkRateLimit(`search:${ip}`, { limit: 60, windowMs: 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await request.json();
    const {
      query,
      country,
      region,
      state,
      city,
      academicDomain,
      discipline,
      field,
      customField,
      interdisciplinary,
      recruitingOnly,
      verifiedOnly,
      emailVerifiedOnly,
      roleTitles,
    } = body;

    const provider = getSearchProvider();
    const results = await provider.searchProfessors(query || '', {
      country: country && country !== 'Global (All Countries)' ? country : undefined,
      region: region || state,
      state: state || region,
      city,
      academicDomain,
      discipline: discipline || field || customField,
      field: field || discipline || customField,
      customField,
      interdisciplinary: interdisciplinary ?? true,
      recruitingOnly: recruitingOnly || false,
      verifiedOnly: verifiedOnly !== false,
      emailVerifiedOnly: emailVerifiedOnly || false,
      roleTitles,
    });

    return NextResponse.json({
      professors: results,
      count: results.length,
      scope: {
        country: country || 'Global',
        region: region || state || 'All Regions',
        discipline: discipline || field || customField || 'All Disciplines',
        isInterdisciplinary: interdisciplinary ?? true,
      },
    });
  } catch (err) {
    console.error('[GLOBAL SEARCH ERROR]', err);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
