import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AutoPilot Autonomous Faculty Outreach',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AutoPilotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
