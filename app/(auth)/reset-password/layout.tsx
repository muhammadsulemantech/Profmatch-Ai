import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set New Password',
  description: 'Choose a new password for your ProfMatch researcher account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
