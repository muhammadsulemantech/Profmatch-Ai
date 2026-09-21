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

  const subject = `ProfMatch AI: Your Verification Code is ${code}`;

  const plainText = `Hi ${firstName},

Your verification code for ProfMatch AI is:

${code}

This code will expire in 15 minutes.

Please enter this 6-digit code on the signup page to confirm your email address and activate your researcher account.

If you did not request this verification code, you can safely disregard this email.

Best regards,
The ProfMatch AI Team
https://profmatch.ai
Support: profmatchsupport@gmail.com`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 36px 12px;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #0f172a;
      padding: 24px 32px;
      text-align: left;
    }
    .header h1 {
      margin: 0;
      font-size: 19px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .header p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #10b981;
      font-weight: 500;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin: 0 0 20px;
    }
    .code-box {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .otp-digits {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #0f172a;
      display: inline-block;
      padding: 4px 12px;
    }
    .expiry-notice {
      display: inline-block;
      margin-top: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #059669;
      background: #ecfdf5;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
    }
    .info-footer {
      font-size: 12px;
      line-height: 1.5;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      margin-top: 24px;
    }
    .footer {
      background: #f8fafc;
      padding: 16px 32px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>ProfMatch AI</h1>
        <p>Academic Outreach &amp; Faculty Matching</p>
      </div>
      <div class="content">
        <div class="greeting">Hi ${firstName},</div>
        <p class="text">
          Thank you for starting your registration on ProfMatch AI. Please use the verification code below to verify your email address and activate your account.
        </p>

        <div class="code-box">
          <div class="code-label">Verification Code</div>
          <div class="otp-digits">${code}</div>
          <div>
            <span class="expiry-notice">&bull; Valid for 15 minutes</span>
          </div>
        </div>

        <p class="text">
          Enter this code on the signup screen to finish creating your account.
        </p>

        <div class="info-footer">
          If you did not request this verification, please ignore this email. No account will be activated without this verification code.
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ProfMatch AI &bull; Faculty Discovery &amp; Research Outreach
      </div>
    </div>
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
