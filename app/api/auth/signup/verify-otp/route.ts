import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getProfileByEmail, saveUserProfile, saveUserSubscription } from '@/lib/services/db-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPendingOtp } from '@/lib/auth/otp-store';
import { sendWelcomeEmail } from '@/lib/email/welcome-email';
import { logAuditEvent } from '@/lib/security/audit';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { apiSuccess, apiError } from '@/lib/api/response';
import type { UserProfile } from '@/types/database';

const VerifyOtpSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  otp: z.string().trim().length(6, 'Verification code must be exactly 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Strict rate limit: max 10 verify attempts per 15 minutes per IP
    const rl = checkRateLimit(`auth_verify_otp:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return apiError(
        'Too many verification attempts. Please wait 15 minutes before trying again.',
        429,
        'RATE_LIMITED',
        undefined,
        { 'Retry-After': '900' }
      );
    }

    const body = await request.json();
    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid verification request';
      return apiError(errorMsg, 400);
    }

    const { email, otp } = parsed.data;

    // 1. Verify OTP with timing-safe comparison and automatic single-use burn
    const verification = verifyPendingOtp(email, otp);

    if (!verification.valid || !verification.registration) {
      return apiError(
        verification.error || 'Wrong verification code. Please check your email and try again.',
        400,
        'INVALID_OTP',
        { isExpired: verification.isExpired || false }
      );
    }

    const { fullName, targetDegree } = verification.registration;

    // 2. Double-check if account was created in parallel
    const existing = await getProfileByEmail(email);
    if (existing) {
      return apiError('An account with this email is already registered.', 409);
    }

    let newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 3. Confirm/link with Supabase Auth: mark email_confirm true
    const adminClient = createAdminClient();
    if (adminClient) {
      try {
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const matched = users?.find(u => u.email?.toLowerCase() === email);

        if (matched) {
          newUserId = matched.id;
          await adminClient.auth.admin.updateUserById(matched.id, { email_confirm: true });
          await adminClient.auth.admin.updateUserById(matched.id, {
            user_metadata: {
              ...matched.user_metadata,
              full_name: fullName,
              target_degree: targetDegree,
            },
          });
        } else {
          const { data: createdSbUser } = await adminClient.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              target_degree: targetDegree,
            },
          });
          if (createdSbUser?.user?.id) {
            newUserId = createdSbUser.user.id;
          }
        }
      } catch (adminErr) {
        console.warn('[SUPABASE ADMIN AUTO-CONFIRM NOTICE]', adminErr);
      }
    }

    // 4. Save User Profile and Initial Free Subscription via DB service
    const newUser: UserProfile = {
      id: newUserId,
      email,
      full_name: fullName,
      avatar_url: null,
      role: 'USER',
      is_suspended: false,
      created_at: now,
      updated_at: now,
    };

    await saveUserProfile(newUser);

    await saveUserSubscription({
      user_id: newUser.id,
      plan_type: 'FREE',
      status: 'active',
    });

    // 5. Send Welcome Email
    try {
      await sendWelcomeEmail({
        email: newUser.email,
        userName: newUser.full_name || 'Researcher',
        ipAddress: ip,
      });
    } catch (emailErr) {
      console.error('[WELCOME EMAIL BACKGROUND ERROR]', emailErr);
    }

    // 6. Log audit event
    await logAuditEvent({
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'USER_SIGNUP_VERIFIED',
      resourceType: 'AUTH',
      resourceId: newUser.id,
      metadata: { targetDegree, ipAddress: ip },
      ipAddress: ip,
    });

    return apiSuccess({
      message: 'Account verified successfully. You can now log in.',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    console.error('[VERIFY OTP API ERROR]', err);
    return apiError('Verification failed due to an unexpected server error.', 500);
  }
}
