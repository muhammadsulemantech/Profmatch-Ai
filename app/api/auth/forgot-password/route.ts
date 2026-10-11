import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getProfileByEmail } from '@/lib/services/db-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPasswordResetToken } from '@/lib/auth/password-reset-store';
import { sendPasswordResetEmail } from '@/lib/email/reset-password-email';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';
import { apiSuccess, apiError } from '@/lib/api/response';

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';

    // Rate limiting: Max 5 password reset requests per 15 minutes per IP
    const rl = checkRateLimit(`auth_forgot_password:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return apiError(
        'Too many password reset requests. Please wait 15 minutes before trying again.',
        429,
        'RATE_LIMITED',
        undefined,
        { 'Retry-After': '900' }
      );
    }

    const body = await request.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Please provide a valid email address';
      return apiError(errorMsg, 400);
    }

    const { email } = parsed.data;

    // Check if user exists in database profiles or Supabase Auth
    let userFullName: string | undefined = undefined;
    let userExists = false;

    const profile = await getProfileByEmail(email);
    if (profile) {
      userExists = true;
      userFullName = profile.full_name || undefined;
    } else {
      // Check Supabase Auth directly via Admin Client
      const adminClient = createAdminClient();
      if (adminClient) {
        try {
          const { data } = await adminClient.auth.admin.listUsers();
          const sbUser = data?.users?.find((u) => u.email?.toLowerCase() === email);
          if (sbUser) {
            userExists = true;
            userFullName = sbUser.user_metadata?.full_name || undefined;
          }
        } catch (sbErr) {
          console.warn('[FORGOT PASSWORD SUPABASE LOOKUP NOTICE]', sbErr);
        }
      }
    }

    // If account exists, issue secure token and dispatch email
    if (userExists) {
      const { token } = createPasswordResetToken(email);

      const emailResult = await sendPasswordResetEmail({
        email,
        fullName: userFullName,
        token,
      });

      if (!emailResult.success) {
        console.error('[FORGOT PASSWORD EMAIL FAILED]', emailResult.error);
        return apiError('Could not send password recovery email. Please try again shortly.', 502);
      }

      await logAuditEvent({
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'AUTH',
        metadata: { email, ipAddress: ip },
        ipAddress: ip,
      });
    }

    // Always return safe confirmation message to prevent user enumeration attacks
    return apiSuccess({
      message: `If an account is associated with ${email}, a secure password reset link has been dispatched. Please check your inbox.`,
    });
  } catch (err: any) {
    console.error('[FORGOT PASSWORD API EXCEPTION]', err);
    return apiError('Unable to process password reset request at this time.', 500);
  }
}
