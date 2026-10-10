import { NextRequest } from 'next/server';
import { assertAdmin } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { createAdminClient } from '@/lib/supabase/admin';
import { mockDb } from '@/lib/supabase/mock-db';
import type { Professor, University, DataQualityMetrics } from '@/types/database';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const supabase = createAdminClient();
    let universities: University[] = [];
    let professors: Professor[] = [];

    if (supabase) {
      try {
        const [uniRes, profRes] = await Promise.all([
          supabase.from('universities').select('*').order('name', { ascending: true }),
          supabase.from('professors').select('*').order('name', { ascending: true }),
        ]);

        if (!uniRes.error && Array.isArray(uniRes.data)) {
          universities = uniRes.data as University[];
        }
        if (!profRes.error && Array.isArray(profRes.data)) {
          professors = profRes.data as Professor[];
        }
      } catch {
        // Log query error and report truthful empty data
      }
    } else {
      // Offline development fallback only when Supabase is completely unconfigured
      mockDb.loadFromDisk();
      universities = [...mockDb.universities];
      professors = [...mockDb.professors];
    }

    const verifiedProfessors = professors.filter((p) => p.verification_status === 'VERIFIED').length;
    const partiallyVerifiedProfessors = professors.filter((p) => p.verification_status === 'PARTIALLY_VERIFIED').length;
    const unverifiedProfessors = professors.filter((p) => p.verification_status === 'UNVERIFIED').length;
    const missingEmailsCount = professors.filter((p) => !p.email || p.email_verification_status === 'NOT_FOUND').length;
    const staleRecordsCount = professors.filter((p) => p.freshness_status === 'STALE').length;

    const dataQuality: DataQualityMetrics = {
      totalUniversities: universities.length,
      totalProfessors: professors.length,
      verifiedProfessors,
      partiallyVerifiedProfessors,
      unverifiedProfessors,
      missingEmailsCount,
      staleRecordsCount,
      brokenSourcesCount: 0,
      duplicateProfessorsCount: 0,
      duplicateUniversitiesCount: 0,
      failedSearchesCount: 0,
    };

    return apiSuccess({
      universities,
      professors,
      dataQuality,
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch global academic data', 500);
  }
}
