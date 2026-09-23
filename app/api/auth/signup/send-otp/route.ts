import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockDb } from '@/lib/supabase/mock-db';
import { createClient } from '@/lib/supabase/server';
import { createPendingRegistration } from '@/lib/auth/otp-store';
import { sendSignupOtpEmail } from '@/lib/email/otp-email';
import { checkRateLimit } from '@/lib/security/rate-limit';

const SendOtpSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  targetDegree: z.string().optional().default('PhD'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';

    // Rate limit OTP requests per IP (max 10 in 15 minutes)
    const rl = checkRateLimit(`auth_send_otp:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many verification code requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = SendOtpSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid details provided';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { fullName, email, password, targetDegree } = parsed.data;

    // 1. Check if user already exists in database
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

    // 2. Generate a 100% unique 6-digit OTP with strict 15-minute expiry
    const { code, expiresAt } = createPendingRegistration({
      email,
      fullName,
      password,
      targetDegree,
    });

    console.log(`[SIGNUP OTP GENERATED] Email: ${email} | Code generated securely | Valid for 15 minutes`);

    // 3. Dispatch high-deliverability email to user inbox
    const emailResult = await sendSignupOtpEmail({
      email,
      fullName,
      code,
    });

    if (!emailResult.success) {
      console.warn(`[OTP EMAIL FAILED]: ${emailResult.error}`);
      return NextResponse.json(
        {
          success: false,
          error: `Could not send verification email: ${emailResult.error || 'Please check your email address and try again.'}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${email}.`,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[SEND OTP ERROR]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'An unexpected error occurred while generating code.' },
      { status: 500 }
    );
  }
}
