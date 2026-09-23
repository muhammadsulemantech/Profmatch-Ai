import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveUserProfile } from '@/lib/services/db-service';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';
import { isAdminEmail } from '@/lib/auth/server-auth';

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

    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Authentication service is not configured.' },
        { status: 503 }
      );
    }

    // Authenticate strictly with Supabase Auth
    const { data, error: sbErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sbErr || !data.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = data.user;
    const isAdmin = isAdminEmail(user.email) || user.user_metadata?.role === 'ADMIN';

    const sanitizedUser = {
      id: user.id,
      email: user.email || email,
      full_name: user.user_metadata?.full_name || (isAdmin ? 'Administrator' : email.split('@')[0]),
      avatar_url: user.user_metadata?.avatar_url || null,
      role: isAdmin ? 'ADMIN' : ((user.user_metadata?.role as any) || 'USER'),
    };

    // Keep persistent profile synced
    await saveUserProfile({
      id: sanitizedUser.id,
      email: sanitizedUser.email,
      full_name: sanitizedUser.full_name,
      avatar_url: sanitizedUser.avatar_url,
      role: sanitizedUser.role as any,
    });

    // Log security audit event
    await logAuditEvent({
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: sanitizedUser.id,
      metadata: { email: sanitizedUser.email, role: sanitizedUser.role },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully.',
      user: sanitizedUser,
    });
  } catch (err: any) {
    console.error('[LOGIN API ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Authentication service encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
