import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockDb } from '@/lib/supabase/mock-db';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email/welcome-email';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';
import { UserProfile } from '@/types/database';
import { verifyPendingOtp } from '@/lib/auth/otp-store';

const VerifyOtpSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  code: z.string().trim().min(4).max(10),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';

    // Rate limit OTP verification attempts (max 20 in 15 minutes)
    const rl = checkRateLimit(`auth_verify_otp:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Please enter the 6-digit verification code.' },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;

    // 1. Validate the code from OTP Store (checks matching code, 15-min expiry, attempt limits)
    const verification = verifyPendingOtp(email, code);

    if (!verification.valid || !verification.registration) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || 'Wrong verification code. Please check your email and try again.',
          isExpired: verification.isExpired || false,
        },
        { status: 400 }
      );
    }

    const { fullName, password, targetDegree } = verification.registration;

    // 2. Double-check if account was created in parallel
    mockDb.loadFromDisk();
    const existing = mockDb.profiles.find((p) => p.email.toLowerCase() === email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email is already registered.' },
        { status: 409 }
      );
    }

    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

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

    // 3. Register in Supabase if configured
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error: sbErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              target_degree: targetDegree,
            },
          },
        });

        if (sbErr) {
          console.warn('[SUPABASE SIGNUP NOTICE]', sbErr.message);
        } else if (data.user) {
          newUser.id = data.user.id;
        }
      } catch (err) {
        console.warn('[SUPABASE CONNECTION NOTICE]', err);
      }
    }

    // 4. Save to persistent database store & create student profile + subscription
    const savedUser = mockDb.autoSaveUser({
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      target_degree: targetDegree,
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
      action: 'USER_VERIFIED_SIGNUP',
      resourceType: 'USER',
      resourceId: newUser.id,
      metadata: { email: newUser.email, fullName: newUser.full_name },
      ipAddress: ip,
    });

    // 7. Establish authenticated session cookies
    const sessionToken = `session_${savedUser.id}_${Date.now()}`;
    const sanitizedUser = {
      id: savedUser.id,
      email: savedUser.email,
      full_name: savedUser.full_name,
      role: savedUser.role,
      target_degree: targetDegree,
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account verified and created successfully.',
        user: sanitizedUser,
      },
      { status: 201 }
    );

    const maxAge = 60 * 60 * 24 * 7; // 7 days

    response.cookies.set('profmatch_session', sessionToken, {
      path: '/',
      maxAge,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set('profmatch_role', savedUser.role, {
      path: '/',
      maxAge,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set('profmatch_user', encodeURIComponent(JSON.stringify(sanitizedUser)), {
      path: '/',
      maxAge,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    console.error('[VERIFY OTP API ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to complete registration verification.' },
      { status: 500 }
    );
  }
}
