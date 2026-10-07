import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Choose Academic Plan',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChoosePlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
