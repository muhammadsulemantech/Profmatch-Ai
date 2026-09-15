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

  const subject = 'Welcome to ProfMatch AI — Let’s Find Your Perfect Research Match 🎓';

  const bodyText = `Hi ${userName},

Welcome to ProfMatch AI! 🎉

Your account has been successfully created.

ProfMatch AI helps students find the right professors, understand their research, discover potential research matches, and prepare better outreach.

With your account, you can explore professors and universities, review research interests, find relevant opportunities, and create personalized outreach drafts.

We’re excited to have you with us.

Start exploring your research matches and take the next step toward your academic journey.

Best regards,
The ProfMatch AI Team

P.S. Always review your outreach before sending and make sure the information is accurate and relevant to your academic goals.`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 28px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 32px; }
    .greeting { font-size: 17px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
    p { margin: 0 0 16px 0; font-size: 14px; color: #334155; }
    .highlight-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 4px; margin: 20px 0; }
    .highlight-box p { margin: 0; color: #065f46; font-size: 13px; font-weight: 500; }
    .button-container { margin: 24px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: #022c22; font-weight: 600; text-decoration: none; border-radius: 8px; font-size: 14px; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .ps { font-size: 12px; color: #64748b; font-style: italic; margin-top: 20px; border-top: 1px dashed #cbd5e1; pt: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ProfMatch AI 🎓</h1>
      <p>Verified Academic Faculty Discovery &amp; Outreach</p>
    </div>
    <div class="content">
      <div class="greeting">Hi ${userName},</div>
      <p>Welcome to ProfMatch AI! 🎉</p>
      <p>Your account has been successfully created.</p>
      <div class="highlight-box">
        <p>ProfMatch AI helps students find the right professors, understand their research, discover potential research matches, and prepare better outreach.</p>
      </div>
      <p>With your account, you can explore professors and universities, review research interests, find relevant opportunities, and create personalized outreach drafts.</p>
      <p>We’re excited to have you with us.</p>
      <p>Start exploring your research matches and take the next step toward your academic journey.</p>
      <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Access Your Workspace &rarr;</a>
      </div>
      <p>Best regards,<br><strong>The ProfMatch AI Team</strong></p>
      <div class="ps">
        P.S. Always review your outreach before sending and make sure the information is accurate and relevant to your academic goals.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ProfMatch AI &bull; Grounded in official institutional registries and peer-reviewed literature.
    </div>
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
