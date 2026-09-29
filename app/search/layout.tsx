import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Professor Discovery & Research Verification',
  description: 'Search accredited university faculty across 190+ countries. Filter by research discipline, verified .edu emails, publications, and graduate recruiting status.',
  openGraph: {
    title: 'Professor Discovery & Research Verification | ProfMatch AI',
    description: 'Search accredited university faculty across 190+ countries with verified publication records.',
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
