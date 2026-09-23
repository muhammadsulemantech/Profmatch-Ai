import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getProfileByEmail } from '@/lib/services/db-service';
import { createClient } from '@/lib/supabase/server';
import { createPendingRegistration } from '@/lib/auth/otp-store';
import { sendSignupOtpEmail } from '@/lib/email/otp-email';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { apiSuccess, apiError } from '@/lib/api/response';

const SignupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  targetDegree: z.string().optional().default('PhD'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';

    // Rate limit signup attempts to prevent abuse
    const rl = checkRateLimit(`auth_signup:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return apiError(
        'Too many signup attempts. Please wait 15 minutes before trying again.',
        429,
        'RATE_LIMITED',
        undefined,
        { 'Retry-After': '900' }
      );
    }

    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid registration details';
      return apiError(errorMsg, 400);
    }

    const { fullName, email, password, targetDegree } = parsed.data;

    // 1. Check if user already exists
    const existing = await getProfileByEmail(email);
    if (existing) {
      return apiError('An account with this email address already exists. Please sign in instead.', 409);
    }

    // 2. Register user in Supabase Auth if configured
    const supabase = createClient();
    if (supabase) {
      try {
        const { error: sbErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              target_degree: targetDegree,
            },
          },
        });
        if (sbErr && sbErr.message.toLowerCase().includes('already registered')) {
          return apiError('An account with this email address already exists. Please sign in instead.', 409);
        }
      } catch (sbErr) {
        console.warn('[SUPABASE SIGNUP ATTEMPT NOTICE]', sbErr);
      }
    }

    // 3. Generate 6-digit OTP with strict 15-minute expiration (storing hashed password)
    const { code, expiresAt } = createPendingRegistration({
      email,
      fullName,
      password,
      targetDegree,
    });

    // 4. Send high-deliverability email via Google SMTP
    const emailResult = await sendSignupOtpEmail({
      email,
      fullName,
      code,
    });

    if (!emailResult.success) {
      return apiError(`Could not dispatch verification email: ${emailResult.error || 'Please try again.'}`, 502);
    }

    return apiSuccess({
      otpRequired: true,
      message: `A 6-digit verification code has been dispatched to ${email}.`,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[SIGNUP API ERROR]', err);
    return apiError('Registration service encountered an unexpected error.', 500);
  }
}
