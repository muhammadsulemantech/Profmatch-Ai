import { mockDb } from '@/lib/supabase/mock-db';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SiteContentSection } from '@/types/database';

export async function getSiteContentSection(sectionKey: string): Promise<SiteContentSection | null> {
  // 1. Try Supabase first (persistent, works on Vercel)
  const supabase = createAdminClient() || createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section_key', sectionKey)
        .single();
      if (!error && data) return data as SiteContentSection;
    } catch {
      // Fallback to in-memory CMS store
    }
  }

  // 2. Fallback: in-memory mock database
  mockDb.loadFromDisk();
  return mockDb.siteContent[sectionKey] || null;
}

export async function getAllSiteContent(): Promise<Record<string, SiteContentSection>> {
  // 1. Try Supabase first
  const supabase = createAdminClient() || createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('site_content').select('*');
      if (!error && data && data.length > 0) {
        const map: Record<string, SiteContentSection> = {};
        data.forEach(item => {
          map[item.section_key] = item;
        });
        return map;
      }
    } catch {
      // Fallback to in-memory CMS store
    }
  }

  // 2. Fallback: in-memory mock database
  mockDb.loadFromDisk();
  return mockDb.siteContent;
}

export async function updateSiteContent(sectionKey: string, payload: Partial<SiteContentSection>, userId?: string): Promise<SiteContentSection> {
  // 1. Always update in-memory store for immediate reads
  mockDb.loadFromDisk();
  const updatedItem: SiteContentSection = {
    section_key: sectionKey,
    title: payload.title || mockDb.siteContent[sectionKey]?.title || '',
    subtitle: payload.subtitle !== undefined ? payload.subtitle : mockDb.siteContent[sectionKey]?.subtitle,
    content: payload.content || mockDb.siteContent[sectionKey]?.content || {},
    is_published: payload.is_published !== undefined ? payload.is_published : true,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  mockDb.siteContent[sectionKey] = updatedItem;
  mockDb.persist();

  // 2. Persist to Supabase with service role key (bypasses RLS)
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { error } = await adminClient.from('site_content').upsert(updatedItem, { onConflict: 'section_key' });
      if (error) {
        console.error('[CMS SUPABASE WRITE ERROR]', error.message);
      }
    } catch (err) {
      console.error('[CMS DB UPDATE ERROR]', err);
    }
  }

  return updatedItem;
}
