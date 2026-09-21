import { mockDb } from '@/lib/supabase/mock-db';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SiteSettings } from '@/types/database';

export async function getSiteSettings(): Promise<SiteSettings> {
  // 1. Try Supabase first (persistent, works on Vercel)
  const supabase = createAdminClient() || createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'general')
        .single();
      if (!error && data?.value) {
        return data.value as SiteSettings;
      }
    } catch {
      // fallback to mockDb
    }
  }

  // 2. Fallback: in-memory mock database (local dev / no Supabase)
  mockDb.loadFromDisk();
  return mockDb.siteSettings;
}

export async function updateSiteSettings(newSettings: Partial<SiteSettings>, userId?: string): Promise<SiteSettings> {
  // 1. Always update in-memory store for immediate reads in same instance
  mockDb.loadFromDisk();
  mockDb.siteSettings = {
    ...mockDb.siteSettings,
    ...newSettings,
  };
  mockDb.persist();

  // 2. Persist to Supabase with service role key (bypasses RLS)
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { error } = await adminClient.from('site_settings').upsert({
        key: 'general',
        value: mockDb.siteSettings,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      }, { onConflict: 'key' });
      if (error) {
        console.error('[SETTINGS SUPABASE WRITE ERROR]', error.message);
      }
    } catch (err) {
      console.error('[SETTINGS DB UPDATE ERROR]', err);
    }
  }

  return mockDb.siteSettings;
}
