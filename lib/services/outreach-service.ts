import { getConnectedEmailAccount } from './db-service';
import { getFreshAccessToken, refreshAccessTokenForce, buildMimeMessage } from './gmail-service';
import { getEmailProvider } from '@/lib/providers/email';
import { syncIncrementUsage } from './db-service';

export interface SendEmailParams {
  userId: string;
  senderName?: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  professorName?: string;
  universityName?: string;
}

export interface SendEmailResult {
  success: boolean;
  sentVia: 'GMAIL' | 'PROVIDER';
  senderEmail: string;
  messageId?: string;
  sentAt: string;
}

export interface CreateDraftParams {
  userId: string;
  professorEmail: string;
  professorName?: string;
  subject: string;
  body: string;
}

export interface CreateDraftResult {
  draftId: string;
  messageId?: string;
  threadId?: string;
  accountEmail: string;
}

export async function sendOutreachEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { userId, toEmail, subject, bodyText, professorName, universityName } = params;

  // 1. Check for connected user-isolated Gmail account
  const account = await getConnectedEmailAccount(userId);

  if (account && (account.access_token || account.refresh_token)) {
    let accessToken = await getFreshAccessToken(account);

    if (accessToken) {
      const rawMime = buildMimeMessage({
        from: account.email,
        to: toEmail,
        subject,
        body: bodyText,
      });

      let sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawMime }),
      });

      if (sendRes.status === 401 && account.refresh_token) {
        const refreshed = await refreshAccessTokenForce(account);
        if (refreshed) {
          accessToken = refreshed;
          sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: rawMime }),
          });
        }
      }

      if (sendRes.ok) {
        const sendData = await sendRes.json();
        syncIncrementUsage(userId, 'emails_sent_count', 1);

        return {
          success: true,
          sentVia: 'GMAIL',
          senderEmail: account.email,
          messageId: sendData.id,
          sentAt: new Date().toISOString(),
        };
      }
    }
  }

  // 2. Dispatch via configured Email Provider (Resend / SMTP)
  const provider = getEmailProvider();
  const result = await provider.sendEmail({
    to: toEmail,
    subject,
    text: bodyText,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to dispatch email via delivery provider.');
  }

  syncIncrementUsage(userId, 'emails_sent_count', 1);

  return {
    success: true,
    sentVia: 'PROVIDER',
    senderEmail: result.messageId || 'system@profmatch.ai',
    messageId: result.messageId,
    sentAt: new Date().toISOString(),
  };
}

export async function createOutreachDraft(params: CreateDraftParams): Promise<CreateDraftResult> {
  const { userId, professorEmail, subject, body } = params;

  const account = await getConnectedEmailAccount(userId);
  if (!account || (!account.access_token && !account.refresh_token)) {
    throw new Error('No active Gmail account connected. Please connect your Gmail in Connectors.');
  }

  let accessToken = await getFreshAccessToken(account);
  if (!accessToken && account.refresh_token) {
    accessToken = await refreshAccessTokenForce(account);
  }

  if (!accessToken) {
    throw new Error('Gmail session has expired. Please reconnect your Gmail account in Connectors.');
  }

  const rawMime = buildMimeMessage({
    to: professorEmail,
    subject,
    body,
  });

  let draftRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        raw: rawMime,
      },
    }),
  });

  // If 401 Unauthorized, token was revoked or expired — try immediate forced refresh & retry once
  if (draftRes.status === 401 && account.refresh_token) {
    const refreshed = await refreshAccessTokenForce(account);
    if (refreshed) {
      accessToken = refreshed;
      draftRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            raw: rawMime,
          },
        }),
      });
    }
  }

  if (!draftRes.ok) {
    const errorData = await draftRes.json().catch(() => ({}));
    if (draftRes.status === 401) {
      throw new Error(
        'Gmail session has expired or credentials were rejected by Google. Please reconnect your Gmail account in Connectors.'
      );
    }
    throw new Error(
      errorData.error?.message || `Gmail API draft creation failed with HTTP ${draftRes.status}`
    );
  }

  const draftData = await draftRes.json();

  return {
    draftId: draftData.id,
    messageId: draftData.message?.id,
    threadId: draftData.message?.threadId,
    accountEmail: account.email,
  };
}
