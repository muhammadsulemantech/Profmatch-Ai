import React from 'react';
import NotFoundView from '@/components/ui/not-found-view';

export const metadata = {
  title: 'Page Not Found (404) — ProfMatch AI',
  description: 'The requested faculty profile, research unit, or directory page could not be located.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <NotFoundView />;
}
