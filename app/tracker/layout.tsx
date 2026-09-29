import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Graduate Applications Tracker',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
