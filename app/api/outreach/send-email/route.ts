import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { getEmailProvider } from '@/lib/providers/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toEmail, subject, bodyText, professorName, universityName, userId = 'usr_student_001' } = body;

    if (!toEmail || !subject || !bodyText) {
      return NextResponse.json(
        { error: 'Missing required fields: toEmail, subject, and bodyText' },
        { status: 400 }
      );
    }

    mockDb.loadFromDisk();

    // 1. Check for Connected Gmail Account
    let account = mockDb.connectedEmailAccounts.find(
      acc => acc.user_id === userId && acc.status === 'ACTIVE'
    );

    // Fallback: Check cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const gmailTokensCookie = cookieHeader.match(/profmatch_gmail_tokens=([^;]+)/);
    const gmailAccountCookie = cookieHeader.match(/profmatch_gmail_account=([^;]+)/);

    let cookieTokens: any = null;
    let cookieAccount: any = null;

    if (gmailTokensCookie) {
      try {
        cookieTokens = JSON.parse(decodeURIComponent(gmailTokensCookie[1]));
      } catch {}
    }
    if (gmailAccountCookie) {
      try {
        cookieAccount = JSON.parse(decodeURIComponent(gmailAccountCookie[1]));
      } catch {}
    }

    if (!account && cookieTokens && cookieTokens.access_token) {
      account = {
        id: `acc_${Date.now()}`,
        user_id: cookieTokens.user_id || userId,
        provider: 'gmail',
        email: cookieTokens.email || cookieAccount?.email || 'user@gmail.com',
        google_account_id: 'cookie_recovered',
        access_token: cookieTokens.access_token,
        refresh_token: cookieTokens.refresh_token || '',
        token_expires_at: cookieTokens.token_expires_at || Date.now() + 3600000,
        scopes: ['https://www.googleapis.com/auth/gmail.compose', 'https://www.googleapis.com/auth/gmail.send'],
        status: 'ACTIVE',
        connected_at: new Date().toISOString(),
      };
      mockDb.saveConnectedEmailAccount(account);
    }

    // 2. If Gmail Connected: Send via Gmail API
    if (account) {
      let accessToken = account.access_token;
      let newTokensCookie: string | null = null;

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
            account.access_token = accessToken;
            account.token_expires_at = Date.now() + (newTokens.expires_in || 3600) * 1000;
            mockDb.saveConnectedEmailAccount(account);

            newTokensCookie = encodeURIComponent(JSON.stringify({
              user_id: account.user_id,
              email: account.email,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              token_expires_at: account.token_expires_at,
            }));
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
        const response = NextResponse.json({
          success: true,
          sentVia: 'GMAIL',
          senderEmail: account.email,
          messageId: sendData.id,
          sentAt: new Date().toISOString(),
        });

        if (newTokensCookie) {
          response.cookies.set('profmatch_gmail_tokens', newTokensCookie, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 31536000,
          });
        }

        return response;
      }

      console.warn('[GMAIL SEND API WARNING, FALLING BACK TO EMAIL PROVIDER]', sendData);
    }

    // 3. Fallback: Dispatch via Email Provider (Resend / SMTP)
    const provider = getEmailProvider();
    const result = await provider.sendEmail({
      to: toEmail,
      subject,
      text: bodyText,
    });

    return NextResponse.json({
      success: true,
      sentVia: provider.name.toUpperCase(),
      messageId: result.messageId || `msg_${Date.now()}`,
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in outreach send-email route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
