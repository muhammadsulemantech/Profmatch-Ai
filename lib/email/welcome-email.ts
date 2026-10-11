import { getEmailProvider } from '@/lib/providers/email';
import { logAuditEvent } from '@/lib/security/audit';

// In-memory set to prevent duplicate welcome emails within the runtime session
const sentWelcomeEmails = new Set<string>();

export interface WelcomeEmailParams {
  email: string;
  userName: string;
  ipAddress?: string;
}

/**
 * Sends the official welcome email to newly registered researchers.
 * Ensures the email is only dispatched once upon signup.
 */
export async function sendWelcomeEmail({
  email,
  userName,
  ipAddress = 'anonymous',
}: WelcomeEmailParams): Promise<{ success: boolean; messageId?: string; alreadySent?: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Deduplication check: Do not send repeatedly
  if (sentWelcomeEmails.has(normalizedEmail)) {
    console.log(`[WELCOME EMAIL] Skipped: Welcome email already delivered to ${normalizedEmail}`);
    return { success: true, alreadySent: true };
  }

  const subject = 'Welcome to ProfMatch';

  const bodyText = `Hi ${userName},

Welcome to ProfMatch!

Your researcher account has been successfully created.

With ProfMatch, you can explore faculty across top global universities, review verified research interests, find faculty matching your background, and draft personalized outreach emails.

Log in to your workspace:
${process.env.NEXT_PUBLIC_APP_URL || 'https://profmatch.ai'}/dashboard

Best regards,
The ProfMatch Team
Support: profmatchsupport@gmail.com`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 24px;">
    <div style="margin-bottom: 20px;">
      <span style="font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.02em;">ProfMatch</span>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #374151;">
      Hi ${userName},
    </p>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #374151;">
      Welcome to ProfMatch! Your researcher account has been successfully created.
    </p>
    
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #4b5563;">
      ProfMatch helps you discover professors, analyze academic research profiles, and draft personalized outreach to advance your research and graduate admissions journey.
    </p>
    
    <div style="margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://profmatch.ai'}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
        Go to Dashboard &rarr;
      </a>
    </div>
    
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
    
    <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #9ca3af;">
      ProfMatch &bull; Faculty Discovery &amp; Academic Outreach
    </p>
  </div>
</body>
</html>`;

  try {
    const provider = getEmailProvider();
    const result = await provider.sendEmail({
      to: normalizedEmail,
      subject,
      text: bodyText,
      html: htmlBody,
    });

    if (result.success) {
      sentWelcomeEmails.add(normalizedEmail);

      // Log audit trail
      try {
        await logAuditEvent({
          action: 'WELCOME_EMAIL_SENT',
          resourceType: 'EMAIL',
          resourceId: result.messageId || 'msg_welcome',
          metadata: {
            recipientEmail: normalizedEmail,
            userName,
            provider: provider.name,
            messageId: result.messageId,
          },
          ipAddress,
        });
      } catch {
        // Continue even if audit fails
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } else {
      console.warn(`[WELCOME EMAIL WARNING] Failed to deliver welcome email to ${normalizedEmail}: ${result.error}`);
      return {
        success: false,
      };
    }
  } catch (err) {
    console.error(`[WELCOME EMAIL DISPATCH ERROR] for ${normalizedEmail}:`, err);
    return {
      success: false,
    };
  }
}
