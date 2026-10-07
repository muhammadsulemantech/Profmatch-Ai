import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connected Email Accounts',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConnectorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
