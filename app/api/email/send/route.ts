import { NextRequest, NextResponse } from 'next/server';
import { EmailSendSchema } from '@/lib/security/input-validation';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';
import { getEmailProvider } from '@/lib/providers/email';
import { verifyAuthSession, isAdminEmail } from '@/lib/auth/server-auth';
import { checkAndIncrementQuotaAsync } from '@/lib/services/quota-service';
import { getUserPlanTier } from '@/lib/services/db-service';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth Guard (Requirement #4)
    const session = await verifyAuthSession(request);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be signed in to send academic emails.' },
        { status: 401 }
      );
    }

    // 2. User + IP Rate Limiting
    const ip = getClientIp(request);
    const rl = checkRateLimit(`email_send:${session.user.id}:${ip}`, { limit: 20, windowMs: 24 * 60 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Daily email sending limit reached. Please try again tomorrow.' },
        { status: 429, headers: { 'X-RateLimit-Limit': String(rl.limit), 'X-RateLimit-Remaining': '0' } }
      );
    }

    // 3. Enforce subscription plan draft/outreach quota
    const tier = (session.user as any)?.tier || await getUserPlanTier(session.user.id);
    const effectiveTier = (session.user.role === 'ADMIN' || isAdminEmail(session.user.email)) && tier === 'FREE' ? 'PRO' : tier;
    const quotaCheck = await checkAndIncrementQuotaAsync(session.user.id, 'draft', {
      tier: effectiveTier,
      increment: true,
    });
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.message || 'Outreach quota reached for your current subscription plan.',
          code: quotaCheck.error || 'QUOTA_EXCEEDED',
        },
        { status: 403 }
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
      userId: session.user.id,
      userEmail: session.user.email,
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

    // Authoritatively persist sent email and increment usage
    try {
      const { saveUserSyncedData } = await import('@/lib/services/db-service');
      await saveUserSyncedData(session.user.id, {
        newSentEmail: {
          id: result.messageId || `msg_${Date.now()}`,
          recipientEmail,
          to_email: recipientEmail,
          subject,
          bodyText,
          provider: provider.name,
          sent_at: new Date().toISOString(),
        },
      });
    } catch (persistErr) {
      console.warn('[EMAIL PERSIST SYNC NOTICE]', persistErr);
    }

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
