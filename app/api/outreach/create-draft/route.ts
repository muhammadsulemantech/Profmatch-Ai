import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';

export async function POST(request: NextRequest) {
  try {
    mockDb.loadFromDisk();
    const bodyPayload = await request.json();
    const { professorEmail, subject, body, professorName } = bodyPayload;

    if (!professorEmail || !subject || !body) {
      return NextResponse.json(
        { success: false, error: 'professorEmail, subject, and body are required.' },
        { status: 400 }
      );
    }

    // 1. Identify logged in user
    let userId = 'usr_student_001';
    const userCookie = request.cookies.get('profmatch_user')?.value;
    if (userCookie) {
      try {
        const parsed = JSON.parse(userCookie);
        if (parsed && parsed.id) userId = parsed.id;
      } catch {
        // fallback
      }
    }

    // 2. Fetch connected email account
    const account = mockDb.getConnectedEmailAccount(userId);
    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_CONNECTED_GMAIL',
          message: 'No active Gmail account connected. Please connect your Gmail in Settings.',
        },
        { status: 400 }
      );
    }

    let accessToken = account.access_token;
    const nowMs = Date.now();

    // 3. Auto-refresh access token if expired or near expiry
    if (account.token_expires_at - nowMs < 300000 && account.refresh_token) {
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
              refresh_token: account.refresh_token,
              grant_type: 'refresh_token',
            }),
          });

          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.access_token) {
            accessToken = refreshData.access_token;
            mockDb.saveConnectedEmailAccount({
              user_id: userId,
              email: account.email,
              access_token: refreshData.access_token,
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
      console.error('[GMAIL DRAFT CREATION API ERROR]', draftData);
      return NextResponse.json(
        {
          success: false,
          error: draftData.error?.message || 'Failed to create Gmail draft.',
          code: draftData.error?.code,
        },
        { status: draftRes.status || 500 }
      );
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
