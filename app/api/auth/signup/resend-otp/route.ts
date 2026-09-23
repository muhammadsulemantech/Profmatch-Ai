import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPendingRegistration, refreshPendingRegistration } from '@/lib/auth/otp-store';
import { sendSignupOtpEmail } from '@/lib/email/otp-email';
import { checkRateLimit } from '@/lib/security/rate-limit';

const ResendOtpSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';

    // Rate limit resend attempts (max 5 in 10 minutes)
    const rl = checkRateLimit(`auth_resend_otp:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Please wait a minute before requesting another verification code.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = ResendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address provided.' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const existing = getPendingRegistration(email);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration session expired. Please fill out the signup form again.',
          isExpired: true,
        },
        { status: 404 }
      );
    }

    // Generate a fresh unique OTP and reset the 15-minute expiration clock
    const refreshed = refreshPendingRegistration(email);
    if (!refreshed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration session expired. Please fill out the signup form again.',
          isExpired: true,
        },
        { status: 404 }
      );
    }
    const { code, expiresAt } = refreshed;

    console.log(`[SIGNUP OTP RESENT] Email: ${email} | New code generated securely | Valid for 15 minutes`);

    const emailResult = await sendSignupOtpEmail({
      email: existing.email,
      fullName: existing.fullName,
      code,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to deliver email: ${emailResult.error || 'Please try again in a few moments.'}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A fresh 6-digit verification code has been dispatched to ${email}.`,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[RESEND OTP ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification code.' },
      { status: 500 }
    );
  }
}
