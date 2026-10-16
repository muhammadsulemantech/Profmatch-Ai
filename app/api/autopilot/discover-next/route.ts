import { NextRequest } from 'next/server';
import { z } from 'zod';
import { discoverNextProfessor } from '@/lib/services/professor-service';
import { verifyAuthSession, isAdminEmail } from '@/lib/auth/server-auth';
import { checkAndIncrementQuotaAsync } from '@/lib/services/quota-service';
import { getUserPlanTier } from '@/lib/services/db-service';
import { apiSuccess, apiError } from '@/lib/api/response';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';

const DiscoverNextSchema = z.object({
  targetCountry: z.string().optional().default('United States'),
  targetDegree: z.string().optional().default('PhD'),
  discipline: z.string().optional().default(''),
  keywords: z.array(z.string()).optional().default([]),
  alreadyContactedEmails: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return apiError('Unauthorized: Authentication required.', 401);
    }

    // Rate limiting to prevent external academic provider API hammering
    const rl = checkRateLimit(`autopilot_discover:${session.user.id}`, { limit: 30, windowMs: 60 * 1000 });
    if (!rl.success) {
      return apiError('AutoPilot discovery request limit exceeded. Please slow down and wait a moment.', 429);
    }

    const body = await request.json();
    const parsed = DiscoverNextSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid discovery payload', 400);
    }

    const {
      targetCountry,
      targetDegree,
      discipline,
      keywords,
      alreadyContactedEmails,
    } = parsed.data;

    // Resolve authoritative tier from PostgreSQL/session
    const tier = (session.user as any)?.tier || await getUserPlanTier(session.user.id);
    const effectiveTier = (session.user.role === 'ADMIN' || isAdminEmail(session.user.email)) && tier === 'FREE' ? 'PRO' : tier;

    const quotaCheck = await checkAndIncrementQuotaAsync(session.user.id, 'autopilot', {
      country: targetCountry,
      increment: false,
      tier: effectiveTier,
    });

    if (!quotaCheck.allowed) {
      return apiError(quotaCheck.error || 'Quota exceeded', 403, 'QUOTA_EXCEEDED', {
        message: quotaCheck.message,
        tier: quotaCheck.tier,
      });
    }

    const result = await discoverNextProfessor({
      targetCountry,
      targetDegree,
      discipline,
      keywords,
      alreadyContactedEmails,
    });

    if (!result) {
      return apiSuccess({
        found: false,
        message: 'All eligible professors matching your criteria have already been contacted in this cycle.',
        professor: null,
      });
    }

    return apiSuccess({
      found: true,
      source: result.source,
      professor: result.professor,
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to discover faculty', 500);
  }
}
