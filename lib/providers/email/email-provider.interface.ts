export interface SendEmailParams {
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
