import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Researcher Account',
  description: 'Register for ProfMatch AI verified academic directory access and grounded research outreach.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
