import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createOutreachDraft } from '@/lib/services/outreach-service';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';
import { getConnectedEmailAccount, saveUserSyncedData } from '@/lib/services/db-service';

const SaveGmailDraftSchema = z.object({
  recipientEmail: z.string().trim().email('Valid professor email address is required'),
  professorName: z.string().optional(),
  universityName: z.string().optional(),
  subject: z.string().trim().min(1, 'Subject is required'),
  bodyText: z.string().trim().min(1, 'Body text is required'),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return apiError('Unauthorized: Authentication required.', 401);
    }

    const rl = checkRateLimit(`autopilot_save_draft:${session.user.id}`, RATE_LIMIT_PRESETS.AI_COMPUTE);
    if (!rl.success) {
      return apiError('Draft saving rate limit reached. Please wait a moment.', 429);
    }

    const body = await request.json();
    const parsed = SaveGmailDraftSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid draft payload', 400);
    }

    const {
      recipientEmail,
      professorName,
      universityName,
      subject,
      bodyText,
    } = parsed.data;

    const account = await getConnectedEmailAccount(session.user.id);
    const hasTokens = Boolean(account?.access_token || account?.refresh_token);

    if (account && hasTokens) {
      try {
        const result = await createOutreachDraft({
          userId: session.user.id,
          professorEmail: recipientEmail,
          professorName,
          subject,
          body: bodyText,
        });

        return apiSuccess({
          draftId: result.draftId,
          messageId: result.messageId,
          threadId: result.threadId,
          accountEmail: result.accountEmail,
          draftUrl: 'https://mail.google.com/mail/u/0/#drafts',
          savedToGmail: true,
          message: 'Draft created successfully in your connected Gmail account.',
        });
      } catch (gmailErr: any) {
        console.warn('[AUTOPILOT GMAIL DRAFT WARNING]', gmailErr.message);

        const localDraftId = `draft_ap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        try {
          await saveUserSyncedData(session.user.id, {
            kanbanCards: [
              {
                id: localDraftId,
                professor_name: professorName || 'Professor',
                professor_email: recipientEmail,
                university_name: universityName || 'University',
                subject,
                body: bodyText,
                status: 'DRAFT',
                created_at: new Date().toISOString(),
              },
            ],
          });
        } catch {}

        return apiSuccess({
          draftId: localDraftId,
          draftUrl: null,
          savedToGmail: false,
          error: gmailErr.message,
          message: `Gmail draft failed (${gmailErr.message}). Saved to local workspace only.`,
        });
      }
    }

    // Fallback: Store draft in synced activity if Gmail is not connected or token expired
    const localDraftId = `draft_ap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      await saveUserSyncedData(session.user.id, {
        kanbanCards: [
          {
            id: localDraftId,
            professor_name: professorName || 'Professor',
            professor_email: recipientEmail,
            university_name: universityName || 'University',
            subject,
            body: bodyText,
            status: 'DRAFT',
            created_at: new Date().toISOString(),
          },
        ],
      });
    } catch {}

    return apiSuccess({
      draftId: localDraftId,
      draftUrl: null,
      savedToGmail: false,
      message: 'Draft prepared and saved in ProfMatch. Connect your Gmail in Connectors to sync live into Gmail.',
    });
  } catch (error: any) {
    console.error('[AUTOPILOT SAVE DRAFT ERROR]', error);
    return apiError(error.message || 'Failed to save outreach draft', 500);
  }
}
