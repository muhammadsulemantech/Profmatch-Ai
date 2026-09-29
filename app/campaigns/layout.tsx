import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Outreach Campaigns & Communication Tracking',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
