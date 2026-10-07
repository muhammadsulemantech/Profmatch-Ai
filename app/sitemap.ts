import type { MetadataRoute } from 'next';
import { mockDb } from '../lib/supabase/mock-db.ts';
import { SITE_URL } from '../lib/seo/site-config.ts';

export default function sitemap(): MetadataRoute.Sitemap {
  mockDb.loadFromDisk();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/responsible-outreach`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Include only verified and complete public faculty profiles
  const verifiedProfessors = (mockDb.professors || []).filter(
    (p) =>
      p.id &&
      p.name &&
      (p.verification_status === 'VERIFIED' ||
        (p as any).is_verified === true ||
        p.email_verification_status === 'VERIFIED')
  );

  const seenUrls = new Set<string>(staticRoutes.map((r) => r.url));
  const professorRoutes: MetadataRoute.Sitemap = [];

  for (const prof of verifiedProfessors) {
    const profUrl = `${SITE_URL}/professors/${prof.id}`;
    if (!seenUrls.has(profUrl)) {
      seenUrls.add(profUrl);
      professorRoutes.push({
        url: profUrl,
        lastModified: prof.updated_at ? new Date(prof.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  return [...staticRoutes, ...professorRoutes];
}
