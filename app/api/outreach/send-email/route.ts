import { NextRequest, NextResponse } from 'next/server';
import { getConnectedEmailAccount, saveConnectedEmailAccount } from '@/lib/services/db-service';
import { getEmailProvider } from '@/lib/providers/email';
import { verifyAuthSession } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate sender strictly from session
    const session = await verifyAuthSession(request);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { toEmail, subject, bodyText, professorName, universityName } = body;

    if (!toEmail || !subject || !bodyText) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: toEmail, subject, and bodyText' },
        { status: 400 }
      );
    }

    // 2. Fetch Connected Gmail Account strictly isolated to this authenticated user
    let account = await getConnectedEmailAccount(userId);

    // 3. If Gmail Connected: Send via Gmail API using decrypted server-stored tokens
    if (account && account.access_token) {
      let accessToken = account.access_token;

      // Auto-refresh token if expired
      if (Date.now() >= account.token_expires_at - 60000 && account.refresh_token) {
        try {
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
              client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
              refresh_token: account.refresh_token,
              grant_type: 'refresh_token',
            }),
          });
          const newTokens = await tokenRes.json();
          if (newTokens.access_token) {
            accessToken = newTokens.access_token;
            await saveConnectedEmailAccount({
              user_id: userId,
              email: account.email,
              access_token: accessToken,
              token_expires_at: Date.now() + (newTokens.expires_in || 3600) * 1000,
            });
          }
        } catch (refreshErr) {
          console.error('[GMAIL TOKEN REFRESH ERROR IN DISPATCH]', refreshErr);
        }
      }

      // Build MIME message
      const mimeLines = [
        `From: ${account.email}`,
        `To: ${toEmail}`,
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        bodyText,
      ];

      const rawMime = mimeLines.join('\r\n');
      const base64UrlEncoded = Buffer.from(rawMime)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: base64UrlEncoded,
        }),
      });

      const sendData = await sendRes.json();

      if (sendRes.ok) {
        return NextResponse.json({
          success: true,
          sentVia: 'GMAIL',
          senderEmail: account.email,
          messageId: sendData.id,
          sentAt: new Date().toISOString(),
        });
      }

      console.warn('[GMAIL SEND API WARNING, FALLING BACK TO EMAIL PROVIDER]', sendData);
    }

    // 4. Fallback: Dispatch via Email Provider (Resend / SMTP)
    const provider = getEmailProvider();
    const result = await provider.sendEmail({
      to: toEmail,
      subject,
      text: bodyText,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to dispatch email. No configured email delivery provider is available.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      sentVia: provider.name.toUpperCase(),
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in outreach send-email route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
