import { mockDb } from '@/lib/supabase/mock-db';
import { createClient } from '@/lib/supabase/server';
import { SiteSettings } from '@/types/database';

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = createClient();
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
      // fallback
    }
  }

  mockDb.loadFromDisk();
  return mockDb.siteSettings;
}

export async function updateSiteSettings(newSettings: Partial<SiteSettings>, userId?: string): Promise<SiteSettings> {
  mockDb.siteSettings = {
    ...mockDb.siteSettings,
    ...newSettings,
  };
  mockDb.persist();

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from('site_settings').upsert({
        key: 'general',
        value: mockDb.siteSettings,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      }, { onConflict: 'key' });
    } catch (err) {
      console.error('[SETTINGS DB UPDATE ERROR]', err);
    }
  }

  return mockDb.siteSettings;
}
