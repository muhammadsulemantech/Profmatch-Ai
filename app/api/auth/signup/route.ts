import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockDb } from '@/lib/supabase/mock-db';
import { createPendingRegistration } from '@/lib/auth/otp-store';
import { sendSignupOtpEmail } from '@/lib/email/otp-email';
import { checkRateLimit } from '@/lib/security/rate-limit';

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
      return NextResponse.json(
        { success: false, error: 'Too many signup attempts. Please wait 15 minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid registration details';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { fullName, email, password, targetDegree } = parsed.data;

    // 1. Check if user already exists
    mockDb.loadFromDisk();
    const existingInMock = mockDb.profiles.find(
      (p) => p.email.toLowerCase() === email
    );

    if (existingInMock) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.',
        },
        { status: 409 }
      );
    }

    // 2. Generate 6-digit OTP with strict 15-minute expiration
    const { code, expiresAt } = createPendingRegistration({
      email,
      fullName,
      password,
      targetDegree,
    });

    console.log(`[SIGNUP ROUTE OTP] Dispatched code ${code} to ${email}`);

    // 3. Send high-deliverability email via Google SMTP
    const emailResult = await sendSignupOtpEmail({
      email,
      fullName,
      code,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not dispatch verification email: ${emailResult.error || 'Please try again.'}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      otpRequired: true,
      message: `A 6-digit verification code has been dispatched to ${email}.`,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[SIGNUP API ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Registration service encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
