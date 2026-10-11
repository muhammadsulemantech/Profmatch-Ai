import nodemailer from 'nodemailer';
import { EmailProvider, SendEmailParams, SendEmailResult } from './email-provider.interface';

export class SmtpEmailProvider implements EmailProvider {
  name = 'Google SMTP (Official Direct Inbox Delivery)';
  private transporter: any = null;
  private defaultFrom: string;
  private defaultReplyTo: string;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE !== 'false' && (process.env.SMTP_SECURE === 'true' || port === 465);
    const user = (process.env.SMTP_USER || 'profmatchsupport@gmail.com').trim();
    const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();

    this.defaultFrom = (process.env.EMAIL_FROM || `ProfMatch <${user}>`).replace(/^["']|["']$/g, '').trim();
    this.defaultReplyTo = (process.env.EMAIL_REPLY_TO || user).replace(/^["']|["']$/g, '').trim();

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
    }
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter is not configured. Missing SMTP_USER or SMTP_PASS.');
      }

      const fromAddress = (params.from || this.defaultFrom).replace(/^["']|["']$/g, '').trim();
      const replyToAddress = (params.replyTo || this.defaultReplyTo).replace(/^["']|["']$/g, '').trim();

      const info = await this.transporter.sendMail({
        from: fromAddress,
        to: params.to,
        replyTo: replyToAddress,
        subject: params.subject,
        text: params.text,
        html: params.html || params.text,
        headers: {
          'X-Auto-Response-Suppress': 'All',
        },
      });

      console.log(`[SMTP EMAIL SENT] MessageId: ${info.messageId} to ${params.to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error('[SMTP EMAIL DISPATCH ERROR]:', err);
      return {
        success: false,
        error: err.message || 'Failed to dispatch email via SMTP',
      };
    }
  }
}
