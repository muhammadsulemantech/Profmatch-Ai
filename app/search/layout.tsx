import type { Metadata } from 'next';
import { SITE_URL, getBreadcrumbJsonLd } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: 'Professor Discovery & Research Verification',
  description:
    'Search accredited university faculty across 190+ countries. Filter by research discipline, verified .edu emails, publications, and graduate recruiting status.',
  alternates: {
    canonical: '/search',
  },
  openGraph: {
    title: 'Professor Discovery & Research Verification | ProfMatch AI',
    description:
      'Search accredited university faculty across 190+ countries with verified publication records.',
    url: `${SITE_URL}/search`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professor Discovery & Research Verification | ProfMatch AI',
    description:
      'Search accredited university faculty across 190+ countries with verified publication records.',
  },
};

const breadcrumbSchema = getBreadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Professor Search', path: '/search' },
]);

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
