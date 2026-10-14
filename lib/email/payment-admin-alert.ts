import { getEmailProvider } from '@/lib/providers/email';

export interface PaymentAlertEmailParams {
  orderReference: string;
  userName: string;
  userEmail: string;
  planName: string;
  planTier: string;
  amount: number;
  currency: string;
  paymentMethodName: string;
  transactionId: string;
  paymentNote?: string;
  proofFileName?: string;
  proofFileUrl?: string;
}

/**
 * Sends an urgent notification email to the administrator whenever a user submits
 * payment proof for a Pro or Starter plan.
 */
export async function sendPaymentAdminAlertEmail(
  params: PaymentAlertEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://profmatch.ai';
    const adminEmail =
      process.env.ADMIN_ALERT_EMAIL ||
      process.env.ADMIN_EMAILS?.split(',')[0]?.trim() ||
      process.env.SMTP_USER ||
      'profmatchsupport@gmail.com';

    const subject = `🚨 [Payment Alert] New ${params.planName} Submission (${params.currency} ${params.amount}) — TID: ${params.transactionId}`;

    const adminReviewUrl = `${appUrl}/admin`;

    const plainText = `URGENT PAYMENT NOTIFICATION — ProfMatch AI

A student/researcher has just submitted proof of payment for an academic subscription.

ORDER DETAILS:
---------------------------------------------
Order Reference : ${params.orderReference}
Customer Name   : ${params.userName}
Customer Email  : ${params.userEmail}
Plan Chosen     : ${params.planName} (${params.planTier})
Amount Paid     : ${params.currency} ${params.amount}
Payment Channel : ${params.paymentMethodName}
Transaction ID  : ${params.transactionId}
${params.paymentNote ? `Sender / Bank   : ${params.paymentNote}\n` : ''}${params.proofFileName ? `Slip File Name  : ${params.proofFileName}\n` : ''}
ACTION REQUIRED:
Please verify this transaction in your bank account / wallet and approve the order in the Admin Dashboard:
${adminReviewUrl}

— ProfMatch Automated Billing System`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:24px 12px; background-color:#0b0f17; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f3f4f6; -webkit-font-smoothing:antialiased;">
  <div style="max-width:560px; margin:0 auto; background-color:#111827; border:1px solid #1f2937; border-radius:12px; padding:32px 24px; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="border-bottom:1px solid #1f2937; padding-bottom:18px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between;">
      <div>
        <span style="font-size:18px; font-weight:800; color:#10b981; letter-spacing:-0.02em;">ProfMatch AI</span>
        <span style="font-size:12px; color:#9ca3af; margin-left:8px; text-transform:uppercase; font-weight:600; letter-spacing:0.05em;">Billing Alert</span>
      </div>
    </div>

    <!-- Alert Badge -->
    <div style="background-color:rgba(16, 185, 129, 0.12); border:1px solid rgba(16, 185, 129, 0.3); border-radius:8px; padding:12px 16px; margin-bottom:20px;">
      <p style="margin:0; font-size:14px; font-weight:700; color:#34d399;">
        💰 New Subscription Payment Submitted
      </p>
      <p style="margin:4px 0 0 0; font-size:12px; color:#d1d5db;">
        A user has uploaded payment details and is waiting for plan activation.
      </p>
    </div>

    <!-- Order Summary Table -->
    <table style="width:100%; border-collapse:collapse; margin-bottom:24px; font-size:13px;">
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 0; color:#9ca3af; width:40%;">Order Reference:</td>
        <td style="padding:10px 0; color:#f9fafb; font-weight:700; font-family:monospace;">${params.orderReference}</td>
      </tr>
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 0; color:#9ca3af;">Customer Name:</td>
        <td style="padding:10px 0; color:#f9fafb; font-weight:600;">${params.userName}</td>
      </tr>
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 0; color:#9ca3af;">Customer Email:</td>
        <td style="padding:10px 0; color:#38bdf8; font-weight:500;">
          <a href="mailto:${params.userEmail}" style="color:#38bdf8; text-decoration:none;">${params.userEmail}</a>
        </td>
      </tr>
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 0; color:#9ca3af;">Subscription Plan:</td>
        <td style="padding:10px 0; color:#10b981; font-weight:700;">${params.planName} (${params.planTier})</td>
      </tr>
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 0; color:#9ca3af;">Amount:</td>
        <td style="padding:10px 0; color:#f9fafb; font-weight:800; font-size:15px;">${params.currency} ${params.amount}</td>
      </tr>
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 0; color:#9ca3af;">Payment Method:</td>
        <td style="padding:10px 0; color:#f9fafb;">${params.paymentMethodName}</td>
      </tr>
      <tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 0; color:#9ca3af;">Transaction ID / TID:</td>
        <td style="padding:10px 0; color:#fbbf24; font-weight:700; font-family:monospace; font-size:14px; background-color:rgba(251, 191, 36, 0.08); padding-left:8px; border-radius:4px;">
          ${params.transactionId}
        </td>
      </tr>
      ${
        params.paymentNote
          ? `<tr style="border-bottom:1px solid #1f2937;">
        <td style="padding:10px 0; color:#9ca3af;">Sender / Bank Note:</td>
        <td style="padding:10px 0; color:#e5e7eb;">${params.paymentNote}</td>
      </tr>`
          : ''
      }
      ${
        params.proofFileName
          ? `<tr>
        <td style="padding:10px 0; color:#9ca3af;">Slip / Attachment:</td>
        <td style="padding:10px 0; color:#9ca3af;">${params.proofFileName}</td>
      </tr>`
          : ''
      }
    </table>

    <!-- Call to Action Button -->
    <div style="text-align:center; margin:28px 0 20px 0;">
      <a href="${adminReviewUrl}" target="_blank" style="display:inline-block; padding:12px 28px; background-color:#10b981; color:#042f2e; text-decoration:none; font-weight:800; font-size:14px; border-radius:8px; box-shadow:0 4px 14px rgba(16, 185, 129, 0.35);">
        Open Admin Dashboard &amp; Approve Order &rarr;
      </a>
    </div>

    <!-- Footer -->
    <p style="margin:24px 0 0; padding-top:16px; border-top:1px solid #1f2937; font-size:11px; line-height:1.5; color:#6b7280; text-align:center;">
      This is an automated notification from your ProfMatch AI application instance.<br>
      To view all pending orders, go to <a href="${adminReviewUrl}" style="color:#10b981; text-decoration:none;">${adminReviewUrl}</a>.
    </p>
  </div>
</body>
</html>`;

    const provider = getEmailProvider();
    const result = await provider.sendEmail({
      to: adminEmail,
      subject,
      text: plainText,
      html: htmlBody,
    });

    return result;
  } catch (err: any) {
    console.error('[ADMIN PAYMENT ALERT EMAIL ERROR]', err);
    return {
      success: false,
      error: err.message || 'Failed to dispatch admin payment alert email',
    };
  }
}

/**
 * Sends a polite receipt acknowledgement email to the student/customer confirming
 * their payment submission has been received and is under review.
 */
export async function sendPaymentCustomerReceiptEmail(
  params: PaymentAlertEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://profmatch.ai';
    const statusUrl = `${appUrl}/checkout/status/${params.orderReference}`;
    const firstName = params.userName.split(' ')[0] || 'Researcher';

    const subject = `Payment Received: Order ${params.orderReference} (${params.planName}) — ProfMatch AI`;

    const plainText = `Hi ${firstName},

Thank you for your payment submission for ProfMatch AI!

We have received your payment details for ${params.planName}.

ORDER DETAILS:
---------------------------------------------
Order Reference : ${params.orderReference}
Plan            : ${params.planName}
Amount          : ${params.currency} ${params.amount}
Payment Channel : ${params.paymentMethodName}
Transaction ID  : ${params.transactionId}

WHAT HAPPENS NEXT?
Our verification team typically approves accounts within 1 to 2 hours during normal operating hours. 
Once approved, your plan features (expanded searches, verified faculty emails, and autonomous outreach) will unlock immediately.

You can check your live order status here:
${statusUrl}

If you have any questions or need urgent assistance, reply to this email or reach us on WhatsApp.

Best regards,
ProfMatch Billing & Support Team
profmatchsupport@gmail.com`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:24px 12px; background-color:#f9fafb; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#111827; -webkit-font-smoothing:antialiased;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:10px; padding:32px 24px;">
    
    <div style="margin-bottom:20px;">
      <span style="font-size:18px; font-weight:800; color:#10b981; letter-spacing:-0.02em;">ProfMatch AI</span>
    </div>

    <h2 style="margin:0 0 12px 0; font-size:18px; font-weight:700; color:#111827;">
      Payment Received — Verification in Progress
    </h2>

    <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#374151;">
      Hi ${firstName},
    </p>

    <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#374151;">
      Thank you for subscribing to <strong>${params.planName}</strong>! We have received your payment proof and transaction reference.
    </p>

    <!-- Details Box -->
    <div style="background-color:#f3f4f6; border-radius:8px; padding:16px 20px; margin:20px 0;">
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Order Reference:</td>
          <td style="padding:6px 0; font-weight:700; font-family:monospace; color:#111827;">${params.orderReference}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Plan:</td>
          <td style="padding:6px 0; font-weight:700; color:#10b981;">${params.planName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Amount:</td>
          <td style="padding:6px 0; font-weight:700; color:#111827;">${params.currency} ${params.amount}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Transaction ID:</td>
          <td style="padding:6px 0; font-family:monospace; color:#111827;">${params.transactionId}</td>
        </tr>
      </table>
    </div>

    <div style="background-color:#ecfdf5; border-left:4px solid #10b981; padding:12px 16px; margin-bottom:20px; border-radius:0 6px 6px 0;">
      <p style="margin:0; font-size:13px; color:#065f46; line-height:1.5;">
        ⚡ <strong>Activation Timeline:</strong> Our billing team verifies receipts within <strong>1–2 hours</strong>. As soon as your transfer is confirmed, your account limits will unlock automatically.
      </p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="${statusUrl}" target="_blank" style="display:inline-block; padding:10px 24px; background-color:#10b981; color:#ffffff; text-decoration:none; font-weight:700; font-size:13px; border-radius:6px;">
        Track Order Status
      </a>
    </div>

    <p style="margin:24px 0 0; padding-top:16px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;">
      Need quick assistance? Reply directly to this email or contact us at <a href="mailto:profmatchsupport@gmail.com" style="color:#10b981; text-decoration:none;">profmatchsupport@gmail.com</a>.
    </p>
  </div>
</body>
</html>`;

    const provider = getEmailProvider();
    const result = await provider.sendEmail({
      to: params.userEmail,
      subject,
      text: plainText,
      html: htmlBody,
    });

    return result;
  } catch (err: any) {
    console.error('[CUSTOMER PAYMENT RECEIPT EMAIL ERROR]', err);
    return {
      success: false,
      error: err.message || 'Failed to dispatch customer receipt email',
    };
  }
}
