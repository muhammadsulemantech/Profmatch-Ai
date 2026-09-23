import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { verifyAuthSession } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    mockDb.loadFromDisk();
    const bodyPayload = await request.json();
    const professorEmail = bodyPayload.toEmail || bodyPayload.professorEmail;
    const subject = bodyPayload.subject;
    const body = bodyPayload.bodyText || bodyPayload.body;

    if (!professorEmail || !subject || !body) {
      return NextResponse.json(
        { success: false, error: 'Recipient email, subject, and body text are required.' },
        { status: 400 }
      );
    }

    // 1. Identify logged in user strictly from session
    const session = await verifyAuthSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    // 2. Fetch connected email account strictly isolated to this authenticated user
    let account = mockDb.getConnectedEmailAccount(userId);

    if (!account) {
      const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(professorEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return NextResponse.json({
        success: true,
        draftId: `draft_${Date.now()}`,
        isLocalDraft: true,
        connectedEmail: 'Workspace Drafts',
        gmailUrl: composeUrl,
        message: 'Draft prepared successfully. Click to review in Gmail.',
      });
    }

    let accessToken = account.access_token || parsedTokens?.access_token;
    const refreshToken = account.refresh_token || parsedTokens?.refresh_token;
    const nowMs = Date.now();

    // 3. Auto-refresh access token if expired or near expiry
    if ((account.token_expires_at - nowMs < 300000 || !accessToken) && refreshToken) {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (clientId && clientSecret) {
        try {
          const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            }),
          });

          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.access_token) {
            accessToken = refreshData.access_token;
            account = mockDb.saveConnectedEmailAccount({
              user_id: userId,
              email: account.email,
              access_token: refreshData.access_token,
              refresh_token: refreshToken,
              token_expires_at: nowMs + (refreshData.expires_in || 3600) * 1000,
            });
          }
        } catch (refreshErr) {
          console.error('[TOKEN REFRESH ERROR]', refreshErr);
        }
      }
    }

    // 4. Format message in RFC 2822 / MIME format
    const mimeLines = [
      `To: ${professorEmail}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body,
    ];

    const rawMime = mimeLines.join('\r\n');
    const base64UrlEncoded = Buffer.from(rawMime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 5. Call Gmail API users/me/drafts
    const draftRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          raw: base64UrlEncoded,
        },
      }),
    });

    const draftData = await draftRes.json();

    if (!draftRes.ok) {
      console.warn('[GMAIL DRAFT CREATION API ERROR, FALLING BACK TO WEB DRAFT]', draftData);
      const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(professorEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return NextResponse.json({
        success: true,
        draftId: `draft_${Date.now()}`,
        isLocalDraft: true,
        connectedEmail: account.email,
        gmailUrl: composeUrl,
        message: 'Draft prepared. Click to review in Gmail.',
      });
    }

    // Update last used timestamp
    mockDb.saveConnectedEmailAccount({
      user_id: userId,
      email: account.email,
      last_used_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      draftId: draftData.id,
      connectedEmail: account.email,
      gmailUrl: 'https://mail.google.com/mail/u/0/#drafts',
      message: 'Gmail draft created successfully. Open Gmail to review and send.',
    });
  } catch (err: any) {
    console.error('[CREATE GMAIL DRAFT ROUTE ERROR]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error creating Gmail draft.' },
      { status: 500 }
    );
  }
}
