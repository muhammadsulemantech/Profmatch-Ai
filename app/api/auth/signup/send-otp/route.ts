import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getProfileByEmail } from '@/lib/services/db-service';
import { createPendingRegistration } from '@/lib/auth/otp-store';
import { sendSignupOtpEmail } from '@/lib/email/otp-email';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { apiSuccess, apiError } from '@/lib/api/response';

const SendOtpSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  targetDegree: z.string().optional().default('PhD'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Strict rate limit: max 5 requests per 10 minutes per IP
    const rl = checkRateLimit(`auth_send_otp:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rl.success) {
      return apiError(
        'Too many verification code requests. Please wait a few minutes before trying again.',
        429,
        'RATE_LIMITED',
        undefined,
        { 'Retry-After': '600' }
      );
    }

    const body = await request.json();
    const parsed = SendOtpSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid details provided';
      return apiError(errorMsg, 400);
    }

    const { fullName, email, password, targetDegree } = parsed.data;

    // 1. Check if user already exists in database
    const existing = await getProfileByEmail(email);
    if (existing) {
      return apiError('An account with this email address already exists. Please sign in instead.', 409);
    }

    // 2. Generate a 100% unique 6-digit OTP with strict 15-minute expiry
    const { code, expiresAt } = createPendingRegistration({
      email,
      fullName,
      password,
      targetDegree,
    });

    // 3. Send email with verification code via Google SMTP
    const emailResult = await sendSignupOtpEmail({
      email,
      fullName,
      code,
    });

    if (!emailResult.success) {
      return apiError(`Could not dispatch verification email: ${emailResult.error || 'Please try again.'}`, 502);
    }

    return apiSuccess({
      message: `A 6-digit verification code has been dispatched to ${email}.`,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[SEND OTP API ERROR]', err);
    return apiError('Failed to generate verification code.', 500);
  }
}
