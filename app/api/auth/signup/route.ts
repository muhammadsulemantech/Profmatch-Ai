import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockDb } from '@/lib/supabase/mock-db';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email/welcome-email';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';
import { UserProfile, StudentProfile } from '@/types/database';

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

    // 2. Try Supabase registration if configured
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
          // If already registered in Supabase
          if (sbErr.message.includes('already registered')) {
            return NextResponse.json(
              {
                success: false,
                error: 'An account with this email address already exists in our system.',
              },
              { status: 409 }
            );
          }
          console.warn('[SUPABASE SIGNUP FALLBACK]', sbErr.message);
        } else if (data.user) {
          newUser.id = data.user.id;
        }
      } catch (err) {
        console.warn('[SUPABASE CONNECTION NOTICE]', err);
      }
    }

    // 3. Save profile to database store
    mockDb.profiles.push(newUser);

    // Create student profile record
    const newStudentProfile: StudentProfile = {
      id: `std_${newUserId}`,
      user_id: newUser.id,
      country: 'Global',
      target_degree: targetDegree,
      target_country: 'Global',
      target_state: null,
      target_intake: 'Fall 2027',
      funding_preference: 'Fully Funded',
      desired_field: 'Academic Research',
      bio: null,
      created_at: now,
      updated_at: now,
    };
    mockDb.studentProfiles.push(newStudentProfile);

    // Create default FREE subscription record
    mockDb.subscriptions.push({
      id: `sub_${newUserId}`,
      user_id: newUser.id,
      plan_type: 'FREE',
      status: 'active',
      current_period_start: now,
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      cancel_at_period_end: false,
      created_at: now,
      updated_at: now,
    });

    // Save to disk immediately so user appears in admin dashboard and persistent DB
    mockDb.persist();

    // 4. Send the required Welcome Email immediately upon account creation
    try {
      await sendWelcomeEmail({
        email: newUser.email,
        userName: newUser.full_name || 'Researcher',
        ipAddress: ip,
      });
    } catch (emailErr) {
      console.error('[WELCOME EMAIL BACKGROUND ERROR]', emailErr);
      // Do not block signup if email provider encounters temporary network issue
    }

    // Log audit
    await logAuditEvent({
      action: 'USER_REGISTERED',
      resourceType: 'USER',
      resourceId: newUser.id,
      metadata: { email: newUser.email, fullName: newUser.full_name },
      ipAddress: ip,
    });

    // 5. Create secure session cookies
    const sessionToken = `session_${newUser.id}_${Date.now()}`;
    const sanitizedUser = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      target_degree: targetDegree,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      user: sanitizedUser,
    }, { status: 201 });

    const maxAge = 60 * 60 * 24 * 7; // 7 days

    response.cookies.set('profmatch_session', sessionToken, {
      path: '/',
      maxAge,
      sameSite: 'lax',
      httpOnly: false, // Accessible by client context to re-hydrate state
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set('profmatch_role', newUser.role, {
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
    console.error('[SIGNUP API ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Registration service encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
