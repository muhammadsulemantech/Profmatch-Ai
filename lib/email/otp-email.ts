import { getEmailProvider } from '@/lib/providers/email';

export interface SendOtpEmailParams {
  email: string;
  fullName: string;
  code: string;
}

/**
 * Sends a high-deliverability 6-digit verification code email.
 * Specially formatted to pass Spam filters and land directly in the user's Primary Inbox.
 */
export async function sendSignupOtpEmail({
  email,
  fullName,
  code,
}: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const firstName = fullName.split(' ')[0] || 'Researcher';

  const subject = `${code} is your ProfMatch verification code`;

  const plainText = `Hi ${firstName},

Your ProfMatch verification code is:

${code}

This code will expire in 15 minutes.

If you did not request this verification code, you can safely ignore this email.

— ProfMatch Team
Support: profmatchsupport@gmail.com`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 24px;">
    <div style="margin-bottom: 20px;">
      <span style="font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.02em;">ProfMatch</span>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #374151;">
      Hi ${firstName},
    </p>
    
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5; color: #374151;">
      Use the verification code below to confirm your email address and activate your account:
    </p>
    
    <div style="margin: 24px 0; padding: 18px 20px; background-color: #f3f4f6; border-radius: 6px; text-align: center;">
      <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827;">${code}</span>
    </div>
    
    <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.5; color: #6b7280;">
      This code will expire in 15 minutes. If you did not request this verification, you can safely ignore this email.
    </p>
    
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
      text: plainText,
      html,
    });

    return result;
  } catch (err: any) {
    console.error(`[OTP EMAIL DISPATCH EXCEPTION] to ${normalizedEmail}:`, err);
    return {
      success: false,
      error: err.message || 'Failed to dispatch OTP verification email',
    };
  }
}
