import { mockDb } from '@/lib/supabase/mock-db';
import { createClient } from '@/lib/supabase/server';
import { SiteContentSection } from '@/types/database';

export async function getSiteContentSection(sectionKey: string): Promise<SiteContentSection | null> {
  const supabase = createClient();
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

  return mockDb.siteContent[sectionKey] || null;
}

export async function getAllSiteContent(): Promise<Record<string, SiteContentSection>> {
  const supabase = createClient();
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

  return mockDb.siteContent;
}

export async function updateSiteContent(sectionKey: string, payload: Partial<SiteContentSection>, userId?: string): Promise<SiteContentSection> {
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

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from('site_content').upsert(updatedItem, { onConflict: 'section_key' });
    } catch (err) {
      console.error('[CMS DB UPDATE ERROR]', err);
    }
  }

  return updatedItem;
}
