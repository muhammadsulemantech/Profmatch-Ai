import { EmailProvider, SendEmailParams, SendEmailResult } from './email-provider.interface';

export class ResendEmailProvider implements EmailProvider {
  name = 'Resend (Production Transactional Delivery)';
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail?: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail || process.env.EMAIL_FROM || 'ProfMatch AI <outreach@profmatch.ai>';
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: params.from || this.fromEmail,
          to: [params.to],
          reply_to: params.replyTo || process.env.EMAIL_REPLY_TO,
          subject: params.subject,
          text: params.text,
          html: params.html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[RESEND DISPATCH ERROR]', data);
        return {
          success: false,
          error: data.message || 'Failed to dispatch email via Resend',
        };
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (err: any) {
      console.error('[RESEND DISPATCH NETWORK ERROR]', err);
      return {
        success: false,
        error: err.message || 'Network error communicating with email provider',
      };
    }
  }
}

export class UnconfiguredEmailProvider implements EmailProvider {
  name = 'Unconfigured Email Provider';

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    return {
      success: false,
      error: 'Email delivery service is unconfigured. Please configure SMTP credentials (SMTP_USER, SMTP_PASS) or Resend API key (RESEND_API_KEY).',
    };
  }
}

export const MockEmailProvider = UnconfiguredEmailProvider;

import { SmtpEmailProvider } from './smtp-provider';
export { SmtpEmailProvider };

export function getEmailProvider(): EmailProvider {
  const providerType = process.env.EMAIL_PROVIDER?.toLowerCase();
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 1. Google / Standard SMTP has highest priority if configured
  if (
    providerType === 'smtp' ||
    (!providerType && smtpUser && smtpPass && !smtpPass.includes('your-google-app-password'))
  ) {
    if (smtpUser && smtpPass) {
      return new SmtpEmailProvider();
    }
  }

  // 2. Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (
    (providerType === 'resend' || (!providerType && resendApiKey)) &&
    resendApiKey &&
    !resendApiKey.includes('your_resend_api_key')
  ) {
    return new ResendEmailProvider(resendApiKey);
  }

  return new UnconfiguredEmailProvider();
}

export * from './email-provider.interface';
