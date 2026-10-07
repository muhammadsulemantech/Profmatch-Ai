import type { Metadata } from 'next';
import { mockDb } from '@/lib/supabase/mock-db';
import {
  SITE_URL,
  getCanonicalUrl,
  getProfessorJsonLd,
  getBreadcrumbJsonLd,
} from '@/lib/seo/site-config';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  mockDb.loadFromDisk();
  const prof = mockDb.professors.find(
    (p) => p.id === params.id || p.id.includes(params.id) || params.id.includes(p.id)
  );

  if (!prof) {
    return {
      title: 'Faculty Profile Not Found — ProfMatch AI',
      description:
        'The requested faculty research profile could not be located in the verified academic registry.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const university = prof.university_name || 'Accredited Institution';
  const department = prof.department_name || prof.primary_discipline || 'Academic Department';
  const interests = (prof.research_interests || []).slice(0, 3).join(', ');

  const title = `${prof.name} — ${university}`;
  const description = `Academic research profile for ${prof.name} (${department}, ${university}). Research interests: ${
    interests || 'Peer-reviewed scholarly literature'
  }.`;
  const canonicalUrl = getCanonicalUrl(`/professors/${prof.id}`);

  return {
    title,
    description,
    alternates: {
      canonical: `/professors/${prof.id}`,
    },
    openGraph: {
      title: `${prof.name} | Faculty Research Directory`,
      description,
      url: canonicalUrl,
      type: 'profile',
      images: [
        {
          url: '/icon.svg',
          width: 512,
          height: 512,
          alt: `${prof.name} — ${university}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${prof.name} — ${university}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ProfessorDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  mockDb.loadFromDisk();
  const prof = mockDb.professors.find(
    (p) => p.id === params.id || p.id.includes(params.id) || params.id.includes(p.id)
  );

  const breadcrumbSchema = prof
    ? getBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Faculty Search', path: '/search' },
        {
          name: prof.university_name || 'University',
          path: `/search?q=${encodeURIComponent(prof.university_name || '')}`,
        },
        { name: prof.name, path: `/professors/${prof.id}` },
      ])
    : null;

  return (
    <>
      {prof && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getProfessorJsonLd(prof)),
          }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema),
          }}
        />
      )}
      {children}
    </>
  );
}
