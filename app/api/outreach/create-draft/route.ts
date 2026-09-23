import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createOutreachDraft } from '@/lib/services/outreach-service';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';

const CreateDraftSchema = z.object({
  professorEmail: z.string().trim().email('Valid professor email address is required'),
  professorName: z.string().optional(),
  subject: z.string().trim().min(1, 'Subject is required'),
  body: z.string().trim().min(1, 'Body is required'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate sender strictly from session
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return apiError('Unauthorized: Authentication required.', 401);
    }

    const requestBody = await request.json();
    const parsed = CreateDraftSchema.safeParse(requestBody);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid draft creation payload', 400);
    }

    const { professorEmail, professorName, subject, body } = parsed.data;

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
    const status = error.message?.includes('No active Gmail') ? 400 : 500;
    return apiError(error.message || 'Failed to create Gmail draft', status);
  }
}
