import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ProfMatch AI - Academic Research Matching & Outreach Platform',
    short_name: 'ProfMatch AI',
    description: 'Find verified professors, analyze research papers, and send hyper-personalized academic outreach emails.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080B11',
    theme_color: '#080B11',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
