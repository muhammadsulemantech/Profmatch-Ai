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
 * Ensures an active access token for a connected Gmail account, refreshing it if within 60s of expiration or if access token is empty.
 */
export async function getFreshAccessToken(
  account: ConnectedEmailAccount
): Promise<string | null> {
  const now = Date.now();
  let accessToken = account.access_token;
  const isExpiringSoon = !account.token_expires_at || now >= (account.token_expires_at - 60000);

  if ((isExpiringSoon || !accessToken) && account.refresh_token) {
    const refreshed = await refreshAccessTokenForce(account);
    if (refreshed) {
      return refreshed;
    }
  }

  return accessToken || null;
}

/**
 * Forcefully requests a fresh access token from Google OAuth endpoint using the stored refresh_token.
 */
export async function refreshAccessTokenForce(
  account: ConnectedEmailAccount
): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  if (!account.refresh_token || !clientId || !clientSecret) {
    return null;
  }

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
      const newAccessToken = refreshData.access_token;
      const newExpiry = Date.now() + (refreshData.expires_in || 3600) * 1000;
      await saveConnectedEmailAccount({
        user_id: account.user_id,
        email: account.email,
        access_token: newAccessToken,
        refresh_token: account.refresh_token,
        token_expires_at: newExpiry,
      });
      return newAccessToken;
    } else {
      console.error('[GMAIL TOKEN FORCE REFRESH FAILED]', refreshData?.error || refreshData);
    }
  } catch (refreshErr) {
    console.error('[GMAIL TOKEN FORCE REFRESH ERROR]', refreshErr);
  }

  return null;
}
