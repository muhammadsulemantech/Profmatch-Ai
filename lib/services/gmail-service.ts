import { ConnectedEmailAccount } from '@/types/database';
import { saveConnectedEmailAccount } from './db-service';

export interface MimeMessageOptions {
  to: string;
  from?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}

/**
 * Builds a RFC 2822 compliant MIME message and encodes it in URL-safe base64
 * for the Gmail API.
 */
export function buildMimeMessage(options: MimeMessageOptions): string {
  const { to, from, subject, body, inReplyTo, references } = options;

  const mimeLines: string[] = [];
  if (from) {
    mimeLines.push(`From: ${from}`);
  }
  mimeLines.push(`To: ${to}`);
  mimeLines.push(`Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`);
  mimeLines.push('Content-Type: text/plain; charset=utf-8');
  mimeLines.push('MIME-Version: 1.0');

  if (inReplyTo) {
    mimeLines.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references) {
    mimeLines.push(`References: ${references}`);
  }

  mimeLines.push('');
  mimeLines.push(body);

  const rawMime = mimeLines.join('\r\n');
  return Buffer.from(rawMime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Ensures an active access token for a connected Gmail account, refreshing it if within 60s of expiration.
 */
export async function getFreshAccessToken(
  account: ConnectedEmailAccount
): Promise<string | null> {
  const now = Date.now();
  let accessToken = account.access_token;

  if (now >= account.token_expires_at - 60000 && account.refresh_token) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    if (clientId && clientSecret) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: account.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.access_token) {
          accessToken = refreshData.access_token;
          await saveConnectedEmailAccount({
            user_id: account.user_id,
            email: account.email,
            access_token: accessToken,
            refresh_token: account.refresh_token,
            token_expires_at: now + (refreshData.expires_in || 3600) * 1000,
          });
        }
      } catch (refreshErr) {
        console.error('[GMAIL TOKEN REFRESH ERROR]', refreshErr);
      }
    }
  }

  return accessToken || null;
}
