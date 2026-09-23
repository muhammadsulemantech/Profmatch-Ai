import { NextRequest, NextResponse } from 'next/server';
import { EmailSendSchema } from '@/lib/security/input-validation';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';
import { getEmailProvider } from '@/lib/providers/email';
import { verifyAuthSession } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth Guard (Requirement #4)
    const session = await verifyAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be signed in to send academic emails.' },
        { status: 401 }
      );
    }

    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rl = checkRateLimit(`email_send:${ip}`, { limit: 20, windowMs: 24 * 60 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Daily email sending limit reached. Please try again tomorrow.' },
        { status: 429, headers: { 'X-RateLimit-Limit': String(rl.limit), 'X-RateLimit-Remaining': '0' } }
      );
    }

    const body = await request.json();
    const parsed = EmailSendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { emailId, recipientEmail, subject, bodyText } = parsed.data;

    // Send via provider
    const provider = getEmailProvider();
    const result = await provider.sendEmail({
      to: recipientEmail,
      subject,
      text: bodyText,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to dispatch email. Email service may be unconfigured.',
        },
        { status: 503 }
      );
    }

    // Log audit
    await logAuditEvent({
      action: 'EMAIL_SENT',
      resourceType: 'EMAIL',
      resourceId: emailId,
      metadata: {
        to: recipientEmail,
        subject,
        provider: provider.name,
        messageId: result.messageId,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      provider: provider.name,
    });
  } catch (err) {
    console.error('[EMAIL SEND ERROR]', err);
    return NextResponse.json({ error: 'Failed to dispatch email.' }, { status: 500 });
  }
}
