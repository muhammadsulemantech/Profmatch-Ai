import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://profmatch.ai';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/inbox/', '/profile/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
