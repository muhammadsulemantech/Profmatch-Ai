import type { Metadata } from 'next';
import { mockDb } from '@/lib/supabase/mock-db';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const prof = mockDb.professors.find(
    (p) => p.id === params.id || p.id.includes(params.id) || params.id.includes(p.id)
  );

  if (!prof) {
    return {
      title: 'Faculty Research Profile',
      description: 'Verified academic research profile, publication history, and institutional contact details.',
    };
  }

  const university = prof.university_name || 'Accredited Institution';
  const department = prof.department_name || prof.primary_discipline || 'Academic Department';
  const interests = (prof.research_interests || []).slice(0, 3).join(', ');

  const title = `${prof.name} — ${university}`;
  const description = `Academic research profile for ${prof.name} (${department}, ${university}). Research interests: ${interests || 'Peer-reviewed scholarly literature'}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${prof.name} | Faculty Research Directory`,
      description,
      type: 'profile',
    },
  };
}

export default function ProfessorDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
