import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Academic Plans & Worldwide Pricing',
  description: 'Transparent flat academic pricing for prospective graduate applicants and international researchers. Instant access activation with multi-currency support.',
  openGraph: {
    title: 'Academic Plans & Worldwide Pricing | ProfMatch AI',
    description: 'Transparent flat academic pricing for graduate applicants targeting verified faculty worldwide.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
