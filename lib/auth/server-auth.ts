import { NextRequest } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types/database';

export interface AuthSession {
  user: UserProfile;
  token: string;
}

/**
 * Server-side helper to verify user session from cookies or headers
 */
export async function verifyAuthSession(request: NextRequest): Promise<AuthSession | null> {
  const isAdminEmail = (e?: string) => e?.toLowerCase() === 'sulemanmunir6752@gmail.com' || e?.toLowerCase() === 'admin@profmatch.ai';

  // 1. Check Supabase session if configured
  const supabase = createClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const isAdmin = isAdminEmail(user.email);
        return {
          user: {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || (isAdmin ? 'Suleman Munir (Admin)' : user.email?.split('@')[0] || 'Researcher'),
            avatar_url: user.user_metadata?.avatar_url || null,
            role: isAdmin ? 'ADMIN' : ((user.user_metadata?.role as any) || 'USER'),
            is_suspended: false,
            created_at: user.created_at,
            updated_at: new Date().toISOString(),
          },
          token: user.id,
        };
      }
    } catch {
      // Fallback to cookie check
    }
  }

  // 2. Check profmatch_session and profmatch_user cookie
  const sessionCookie = request.cookies.get('profmatch_session')?.value;
  const userCookie = request.cookies.get('profmatch_user')?.value;
  const roleCookie = request.cookies.get('profmatch_role')?.value;

  if (!sessionCookie) {
    // Check Authorization header for API callers
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7);
      const matched = mockDb.profiles.find(p => p.id === bearerToken || sessionCookie === bearerToken);
      if (matched) {
        return { user: matched, token: bearerToken };
      }
    }
    return null;
  }

  // 3. Admin session token check
  if (sessionCookie.startsWith('admin_elevated_') || roleCookie === 'ADMIN') {
    const adminUser = mockDb.profiles.find(p => p.role === 'ADMIN') || {
      id: 'usr_admin_001',
      email: 'sulemanmunir6752@gmail.com',
      full_name: 'Suleman Munir (Admin)',
      avatar_url: null,
      role: 'ADMIN',
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { user: adminUser, token: sessionCookie };
  }

  // 4. If user profile stored in cookie JSON
  if (userCookie) {
    try {
      const parsedUser = JSON.parse(decodeURIComponent(userCookie));
      if (parsedUser && parsedUser.email) {
        if (isAdminEmail(parsedUser.email)) {
          parsedUser.role = 'ADMIN';
        }
        return {
          user: parsedUser,
          token: sessionCookie,
        };
      }
    } catch {
      // Fall through to mockDb lookup
    }
  }

  // Match against mockDb by token or default student
  const studentUser = mockDb.profiles.find(p => p.role === 'USER') || mockDb.profiles[1];
  if (studentUser) {
    return {
      user: studentUser,
      token: sessionCookie,
    };
  }

  return null;
}
