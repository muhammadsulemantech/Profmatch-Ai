import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProfileByEmail, saveUserProfile } from '@/lib/services/db-service';
import { verifyPasswordResetToken } from '@/lib/auth/password-reset-store';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';
import { apiSuccess, apiError } from '@/lib/api/response';

const ResetPasswordSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  token: z.string().trim().min(20, 'Invalid reset token format'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

/**
 * GET: Verifies if the reset token is still valid (without burning it).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      return apiError('Missing email or reset token.', 400);
    }

    const verification = await verifyPasswordResetToken(email, token, false);
    if (!verification.valid) {
      return apiError(verification.error || 'Password reset link is invalid or expired.', 400, 'TOKEN_INVALID', {
        isExpired: verification.isExpired || false,
      });
    }

    return apiSuccess({ valid: true, email });
  } catch (err: any) {
    console.error('[RESET PASSWORD TOKEN VERIFY EXCEPTION]', err);
    return apiError('Failed to verify reset token.', 500);
  }
}

/**
 * POST: Resets the user's password in Supabase Auth.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate limiting: Max 10 reset attempts per 15 minutes per IP
    const rl = checkRateLimit(`auth_reset_password:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return apiError(
        'Too many password reset attempts. Please wait 15 minutes before trying again.',
        429,
        'RATE_LIMITED',
        undefined,
        { 'Retry-After': '900' }
      );
    }

    const body = await request.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid password reset parameters';
      return apiError(errorMsg, 400);
    }

    const { email, token, newPassword } = parsed.data;

    // 1. Verify token and burn it upon success
    const verification = await verifyPasswordResetToken(email, token, true);
    if (!verification.valid) {
      return apiError(verification.error || 'Password reset token is invalid or expired.', 400, 'TOKEN_INVALID', {
        isExpired: verification.isExpired || false,
      });
    }

    // 2. Locate user in Supabase Auth and update their password
    const adminClient = createAdminClient();
    let updatedInSupabase = false;

    if (adminClient) {
      try {
        const { data } = await adminClient.auth.admin.listUsers();
        const sbUser = data?.users?.find((u) => u.email?.toLowerCase() === email);

        if (sbUser) {
          const profile = await getProfileByEmail(email);
          const existingAvatar = profile?.avatar_url || sbUser.user_metadata?.avatar_url || null;
          const existingFullName = profile?.full_name || sbUser.user_metadata?.full_name || null;

          const { error: updateErr } = await adminClient.auth.admin.updateUserById(sbUser.id, {
            password: newPassword,
            email_confirm: true,
            user_metadata: {
              ...(sbUser.user_metadata || {}),
              full_name: existingFullName || sbUser.user_metadata?.full_name,
              avatar_url: existingAvatar,
              reset_password_token: null,
              reset_password_expires_at: null,
              last_password_reset_at: Date.now(),
            },
          });

          if (updateErr) {
            console.error('[SUPABASE PASSWORD UPDATE ERROR]', updateErr);
            return apiError('Failed to update password in auth service.', 500);
          }

          if (profile) {
            await saveUserProfile({
              id: sbUser.id,
              email: sbUser.email || email,
              full_name: existingFullName || profile.full_name,
              avatar_url: existingAvatar || profile.avatar_url,
              role: profile.role || 'USER',
            });
          }

          updatedInSupabase = true;
        } else {
          // If profile exists locally but not in Supabase Auth, create with new password
          const profile = await getProfileByEmail(email);
          if (profile) {
            await adminClient.auth.admin.createUser({
              email,
              password: newPassword,
              email_confirm: true,
              user_metadata: {
                full_name: profile.full_name,
                avatar_url: profile.avatar_url || null,
              },
            });
            updatedInSupabase = true;
          }
        }
      } catch (adminErr) {
        console.error('[SUPABASE ADMIN PASSWORD RESET EXCEPTION]', adminErr);
      }
    }

    // 3. Log security audit event
    await logAuditEvent({
      action: 'PASSWORD_RESET_SUCCESSFUL',
      resourceType: 'AUTH',
      metadata: { email, updatedInSupabase, ipAddress: ip },
      ipAddress: ip,
    });

    return apiSuccess({
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('[RESET PASSWORD API EXCEPTION]', err);
    return apiError('Unable to reset password. Please try again.', 500);
  }
}
