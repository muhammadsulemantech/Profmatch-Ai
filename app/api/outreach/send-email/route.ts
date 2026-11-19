import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendOutreachEmail } from '@/lib/services/outreach-service';
import { verifyAuthSession, isAdminEmail } from '@/lib/auth/server-auth';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { checkAndIncrementQuotaAsync } from '@/lib/services/quota-service';
import { getUserPlanTier } from '@/lib/services/db-service';
import { apiSuccess, apiError } from '@/lib/api/response';

const SendEmailSchema = z.object({
  toEmail: z.string().trim().email('Valid recipient email address is required'),
  subject: z.string().trim().min(1, 'Subject is required'),
  bodyText: z.string().trim().min(1, 'Body text is required'),
  professorName: z.string().optional(),
  universityName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate sender strictly from session
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return apiError('Unauthorized: Authentication required.', 401);
    }

    const body = await request.json();
    const parsed = SendEmailSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid email dispatch payload', 400);
    }

    const { toEmail, subject, bodyText, professorName, universityName } = parsed.data;

    // 2. Duplicate dispatch guard: prevent accidental double-click / rapid retry blasting
    const dedup = checkRateLimit(
      `email_dedup:${session.user.id}:${toEmail.toLowerCase().trim()}`,
      { limit: 1, windowMs: 15 * 1000 }
    );
    if (!dedup.success) {
      return apiError(
        'Duplicate send prevented. Please wait 15 seconds before emailing this professor again.',
        429,
        'DUPLICATE_SEND_PREVENTED'
      );
    }

    // 3. Daily user send rate limit & subscription plan quota check
    const dailyRl = checkRateLimit(`outreach_daily:${session.user.id}`, { limit: 50, windowMs: 24 * 60 * 60 * 1000 });
    if (!dailyRl.success) {
      return apiError('Daily outreach sending limit reached. Please resume tomorrow.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const tier = (session.user as any)?.tier || await getUserPlanTier(session.user.id);
    const effectiveTier = (session.user.role === 'ADMIN' || isAdminEmail(session.user.email)) && tier === 'FREE' ? 'PRO' : tier;
    const quotaCheck = await checkAndIncrementQuotaAsync(session.user.id, 'draft', {
      tier: effectiveTier,
      increment: true,
    });
    if (!quotaCheck.allowed) {
      return apiError(
        quotaCheck.message || 'Outreach quota reached for your current subscription plan.',
        403,
        quotaCheck.error || 'QUOTA_EXCEEDED'
      );
    }

    const result = await sendOutreachEmail({
      userId: session.user.id,
      senderName: session.user.full_name || undefined,
      toEmail,
      subject,
      bodyText,
      professorName,
      universityName,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to dispatch email via delivery provider' },
        { status: 503 }
      );
    }

    return apiSuccess({
      sentVia: result.sentVia,
      senderEmail: result.senderEmail,
      messageId: result.messageId,
      sentAt: result.sentAt,
      message: 'Email dispatched successfully.',
    });
  } catch (error: any) {
    const status = error.message?.includes('unconfigured') || error.message?.includes('provider') ? 503 : 500;
    return apiError(error.message || 'Failed to dispatch email', status);
  }
}
