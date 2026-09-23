import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSafeRedirect } from '@/lib/security/url-validation';
import { saveUserProfile, saveUserSubscription } from '@/lib/services/db-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/dashboard';
  const safeNext = validateSafeRedirect(next, '/dashboard');

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';

  const supabase = createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=Auth service not configured`);
  }

  // 1. If auth code is present (OAuth or PKCE confirmation)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      await saveUserProfile({
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || '',
        role: 'USER',
      });
      await saveUserSubscription({
        user_id: data.user.id,
        plan_type: 'FREE',
        status: 'active',
      });

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // 2. If token_hash + type is present (Email Confirmation or Magic Link)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (!error && data?.user) {
      await saveUserProfile({
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || '',
        role: 'USER',
      });
      await saveUserSubscription({
        user_id: data.user.id,
        plan_type: 'FREE',
        status: 'active',
      });

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not verify auth session`);
}
