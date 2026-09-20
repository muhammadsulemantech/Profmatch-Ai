import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mockDb } from '@/lib/supabase/mock-db';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';

const LoginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Rate limit login attempts to prevent brute-force attacks
    const rl = checkRateLimit(`auth_login:${ip}`, { limit: 15, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid email or password format';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const isAdminEmail = email === 'sulemanmunir6752@gmail.com' || email === 'admin@profmatch.ai';

    mockDb.loadFromDisk();
    let matchedUser = mockDb.profiles.find((p) => p.email.toLowerCase() === email);

    // Try Supabase auth if configured
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error: sbErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (sbErr) {
          console.warn('[SUPABASE SIGNIN NOTICE]', sbErr.message);
        } else if (data.user) {
          matchedUser = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || (isAdminEmail ? 'Suleman Munir (Admin)' : email.split('@')[0]),
            avatar_url: data.user.user_metadata?.avatar_url || null,
            role: isAdminEmail ? 'ADMIN' : ((data.user.user_metadata?.role as any) || 'USER'),
            is_suspended: false,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('[SUPABASE AUTH ATTEMPT NOTICE]', err);
      }
    }

    // Support standard demo student/admin accounts if not in real Supabase
    if (!matchedUser) {
      if (email === 'student@example.com' || email === 'alex@example.com') {
        matchedUser = mockDb.profiles.find(p => p.role === 'USER') || {
          id: 'usr_student_001',
          email,
          full_name: 'Alex Vance',
          avatar_url: null,
          role: 'USER',
          is_suspended: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else if (isAdminEmail) {
        matchedUser = mockDb.profiles.find(p => p.role === 'ADMIN') || {
          id: 'usr_admin_001',
          email: 'sulemanmunir6752@gmail.com',
          full_name: 'Suleman Munir (Admin)',
          avatar_url: null,
          role: 'ADMIN',
          is_suspended: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email. Please check your credentials or sign up.' },
        { status: 401 }
      );
    }

    // Absolute Guarantee for Admin Email & Automatic Persistent DB Save
    if (isAdminEmail) {
      matchedUser.role = 'ADMIN';
    }

    // Auto-save user permanently into persistent database
    matchedUser = mockDb.autoSaveUser({
      id: matchedUser.id,
      email: matchedUser.email,
      full_name: matchedUser.full_name,
      avatar_url: matchedUser.avatar_url,
      role: matchedUser.role,
    });

    if (matchedUser.is_suspended) {
      return NextResponse.json(
        { success: false, error: 'Your account is suspended. Please contact institutional support.' },
        { status: 403 }
      );
    }

    // Set cookies
    const sessionToken = `session_${matchedUser.id}_${Date.now()}`;
    const sanitizedUser = {
      id: matchedUser.id,
      email: matchedUser.email,
      full_name: matchedUser.full_name,
      role: matchedUser.role,
    };

    // Log audit
    await logAuditEvent({
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: matchedUser.id,
      metadata: { email: matchedUser.email },
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Signed in successfully.',
      user: sanitizedUser,
    });

    const maxAge = 60 * 60 * 24 * 7; // 7 days

    response.cookies.set('profmatch_session', sessionToken, {
      path: '/',
      maxAge,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set('profmatch_role', matchedUser.role, {
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
    console.error('[LOGIN API ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Authentication service encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
