import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types/database';

export interface AuthSession {
  user: UserProfile;
  token: string;
}

/**
 * Checks if the given email has administrative privileges based on configuration.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const configuredAdmins = (process.env.ADMIN_EMAILS || 'admin@profmatch.ai')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  return configuredAdmins.includes(normalized) || normalized === 'admin@profmatch.ai';
}

/**
 * Server-side helper to verify user session strictly via Supabase Auth.
 * Unrecognized or garbage cookies/tokens will NEVER resolve to a user.
 */
export async function verifyAuthSession(request?: NextRequest): Promise<AuthSession | null> {
  const supabase = createClient();
  if (!supabase) {
    return null;
  }

  try {
    // 1. If an explicit Bearer token is provided in Authorization header, verify it
    const authHeader = request?.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (!token) return null;

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        return null;
      }
      return mapSupabaseUserToSession(data.user, token);
    }

    // 2. Otherwise verify via Supabase session cookies managed by @supabase/ssr
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }

    return mapSupabaseUserToSession(data.user, data.user.id);
  } catch (err) {
    return null;
  }
}

/**
 * Maps a verified Supabase Auth user into an internal AuthSession object.
 */
function mapSupabaseUserToSession(user: any, token: string): AuthSession {
  const email = (user.email || '').toLowerCase().trim();
  const isAdmin = isAdminEmail(email) || user.user_metadata?.role === 'ADMIN';

  return {
    user: {
      id: user.id,
      email: user.email || '',
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (isAdmin ? 'Administrator' : email.split('@')[0] || 'Researcher'),
      avatar_url: user.user_metadata?.avatar_url || null,
      role: isAdmin ? 'ADMIN' : ((user.user_metadata?.role as any) || 'USER'),
      is_suspended: false,
      created_at: user.created_at,
      updated_at: new Date().toISOString(),
    },
    token,
  };
}

/**
 * Server-side guard to verify administrative privileges strictly from verified session.
 */
export async function verifyAdminSession(request?: NextRequest): Promise<AuthSession | null> {
  const session = await verifyAuthSession(request);
  if (!session || !session.user) return null;

  if (session.user.role === 'ADMIN' || isAdminEmail(session.user.email)) {
    return session;
  }

  return null;
}
