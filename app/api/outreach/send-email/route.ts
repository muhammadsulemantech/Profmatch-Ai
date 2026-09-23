import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sendOutreachEmail } from '@/lib/services/outreach-service';
import { verifyAuthSession } from '@/lib/auth/server-auth';
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

    const result = await sendOutreachEmail({
      userId: session.user.id,
      senderName: session.user.full_name || undefined,
      toEmail,
      subject,
      bodyText,
      professorName,
      universityName,
    });

    return apiSuccess({
      sentVia: result.sentVia,
      senderEmail: result.senderEmail,
      messageId: result.messageId,
      sentAt: result.sentAt,
      message: 'Email dispatched successfully.',
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to dispatch email', 500);
  }
}
