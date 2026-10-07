import type { Metadata } from 'next';
import { SITE_URL, getBreadcrumbJsonLd } from '@/lib/seo/site-config';

export const metadata: Metadata = {
  title: 'Academic Plans & Worldwide Pricing',
  description:
    'Transparent flat academic pricing for prospective graduate applicants and international researchers. Instant access activation with multi-currency support.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Academic Plans & Worldwide Pricing | ProfMatch AI',
    description:
      'Transparent flat academic pricing for graduate applicants targeting verified faculty worldwide.',
    url: `${SITE_URL}/pricing`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Academic Plans & Worldwide Pricing | ProfMatch AI',
    description:
      'Transparent flat academic pricing for graduate applicants targeting verified faculty worldwide.',
  },
};

const breadcrumbSchema = getBreadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Pricing & Plans', path: '/pricing' },
]);

export default function PricingLayout({
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
