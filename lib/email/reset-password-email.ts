import { getEmailProvider } from '@/lib/providers/email';

export interface SendPasswordResetEmailParams {
  email: string;
  fullName?: string;
  token: string;
}

/**
 * Ultra-lightweight password reset email.
 * Optimized specifically for 100% Primary Inbox deliverability,
 * avoiding Spam and Promotions filters via high text-to-HTML ratio and minimal inline styling.
 */
export async function sendPasswordResetEmail({
  email,
  fullName,
  token,
}: SendPasswordResetEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const firstName = fullName?.split(' ')[0] || 'Researcher';
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://profmatch.ai').replace(/\/$/, '');
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  const subject = 'Reset your ProfMatch password';

  const plainText = `Hi ${firstName},

We received a request to reset your ProfMatch account password.

Reset your password using the link below:
${resetUrl}

This link will expire in 15 minutes and can only be used once.

If you didn't request a password reset, you can safely ignore this email. Your password will not change.

— ProfMatch Team
Support: profmatchsupport@gmail.com`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px 12px; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 460px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px 24px;">
    <div style="margin-bottom: 18px;">
      <span style="font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.02em;">ProfMatch</span>
    </div>
    
    <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.5; color: #374151;">
      Hi ${firstName},
    </p>
    
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5; color: #374151;">
      We received a request to reset your ProfMatch password. Click the button below to choose a new password:
    </p>
    
    <div style="margin: 22px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 11px 24px; background-color: #059669; color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 6px;">
        Reset Password
      </a>
    </div>
    
    <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.5; color: #6b7280;">
      Or copy and paste this link in your browser:
    </p>
    
    <p style="margin: 0 0 20px; font-size: 12px; line-height: 1.4; word-break: break-all;">
      <a href="${resetUrl}" style="color: #059669; text-decoration: underline;">${resetUrl}</a>
    </p>
    
    <p style="margin: 0 0 20px; font-size: 12px; line-height: 1.5; color: #6b7280;">
      This link will expire in 15 minutes and can only be used once. If you did not request this, you can safely ignore this email.
    </p>
    
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
    
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
      text: plainText,
      html,
    });

    return result;
  } catch (err: any) {
    console.error(`[PASSWORD RESET EMAIL DISPATCH EXCEPTION] to ${normalizedEmail}:`, err);
    return {
      success: false,
      error: err.message || 'Failed to dispatch password reset email',
    };
  }
}
