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

    const { fullName, passwordHash, targetDegree } = verification.registration;

    // 2. Double-check if account was created in parallel
    mockDb.loadFromDisk();
    const existing = mockDb.profiles.find((p) => p.email.toLowerCase() === email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email is already registered.' },
        { status: 409 }
      );
    }

    let newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 3. Confirm/link with Supabase user ID if available
    const supabase = createClient();
    if (supabase) {
      try {
        const { data: { users } } = await (await import('@/lib/supabase/admin')).createAdminClient()?.auth?.admin?.listUsers() || { data: { users: [] } };
        const sbUser = users?.find((u: any) => u.email?.toLowerCase() === email);
        if (sbUser) {
          newUserId = sbUser.id;
        }
      } catch (err) {
        // Continue with local ID if admin API is unconfigured
      }
    }

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

    return NextResponse.json(
      {
        success: true,
        message: 'Account verified and created successfully. Please sign in.',
        user: sanitizedUser,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[VERIFY OTP API ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to complete registration verification.' },
      { status: 500 }
    );
  }
}
