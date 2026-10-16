import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createOutreachDraft } from '@/lib/services/outreach-service';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';

const CreateDraftSchema = z
  .object({
    professorEmail: z.string().trim().email('Valid professor email address is required').optional(),
    toEmail: z.string().trim().email('Valid professor email address is required').optional(),
    professorName: z.string().optional(),
    subject: z.string().trim().min(1, 'Subject is required'),
    body: z.string().trim().min(1, 'Body is required').optional(),
    bodyText: z.string().trim().min(1, 'Body is required').optional(),
  })
  .refine((data) => Boolean(data.professorEmail || data.toEmail), {
    message: 'Valid professor email address is required',
    path: ['professorEmail'],
  })
  .refine((data) => Boolean(data.body || data.bodyText), {
    message: 'Body is required',
    path: ['body'],
  });

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate sender strictly from session
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return apiError('Unauthorized: Authentication required.', 401);
    }

    // Rate limiting to prevent draft flooding / Gmail API quota abuse
    const rl = checkRateLimit(`draft_create:${session.user.id}`, RATE_LIMIT_PRESETS.AI_COMPUTE);
    if (!rl.success) {
      return apiError('Draft creation rate limit exceeded. Please wait a minute before creating more drafts.', 429);
    }

    const requestBody = await request.json();
    const parsed = CreateDraftSchema.safeParse(requestBody);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid draft creation payload', 400);
    }

    const professorEmail = (parsed.data.professorEmail || parsed.data.toEmail)!;
    const professorName = parsed.data.professorName || '';
    const subject = parsed.data.subject;
    const body = (parsed.data.body || parsed.data.bodyText)!;

    const result = await createOutreachDraft({
      userId: session.user.id,
      professorEmail,
      professorName,
      subject,
      body,
    });

    return apiSuccess({
      draftId: result.draftId,
      messageId: result.messageId,
      threadId: result.threadId,
      accountEmail: result.accountEmail,
      message: 'Draft created successfully in your connected Gmail account.',
    });
  } catch (error: any) {
    if (error.message?.includes('No active Gmail') || error.message?.includes('connect your Gmail')) {
      return apiError(error.message, 400); // status: 400 when no Gmail connected
    }
    if (error.message?.includes('Gmail API') || error.message?.includes('failed with HTTP')) {
      return apiError(error.message, 502); // status: 502 when Gmail API draft fails
    }
    return apiError(error.message || 'Failed to create Gmail draft', 500);
  }
}
