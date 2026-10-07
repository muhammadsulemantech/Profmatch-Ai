import type { Professor } from '@/types/database';

export const SITE_DOMAIN = 'profmatch.ai';
export const SITE_URL = 'https://profmatch.ai';

/**
 * Returns the canonical HTTPS URL for a given path.
 * Guarantees consistent canonicalization without trailing slashes (except root).
 */
export function getCanonicalUrl(path = ''): string {
  if (!path || path === '/') {
    return SITE_URL;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized.replace(/\/+$/, '')}`;
}

/**
 * Schema.org Organization structured data
 */
export function getOrganizationJsonLd(siteName = 'ProfMatch AI') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}#organization`,
    name: siteName,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description:
      'AI-powered platform helping graduate candidates discover verified professors, understand scholarly research, and conduct grounded outreach.',
    sameAs: [],
  };
}

/**
 * Schema.org WebSite structured data with Sitelinks Searchbox
 */
export function getWebSiteJsonLd(siteName = 'ProfMatch AI') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: siteName,
    description:
      'Find the right professors. Understand their research. Send better outreach.',
    publisher: {
      '@id': `${SITE_URL}#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Schema.org SoftwareApplication structured data
 */
export function getSoftwareApplicationJsonLd(siteName = 'ProfMatch AI') {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteName,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'All modern web browsers',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Academic research discovery and outreach platform connecting graduate applicants to verified faculty and laboratory openings.',
  };
}

/**
 * Schema.org FAQPage structured data
 */
export function getFaqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Schema.org Person & EducationalOrganization structured data for verified faculty
 */
export function getProfessorJsonLd(prof: Professor) {
  const sameAsLinks = [
    prof.profile_url,
    prof.google_scholar_url,
    prof.lab_url,
  ].filter(Boolean) as string[];

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${getCanonicalUrl(`/professors/${prof.id}`)}#person`,
    name: prof.name,
    jobTitle: prof.title || 'Professor',
    worksFor: {
      '@type': 'EducationalOrganization',
      name: prof.university_name || 'Accredited University',
      ...(prof.university_country ? { address: { '@type': 'PostalAddress', addressCountry: prof.university_country } } : {}),
    },
    affiliation: {
      '@type': 'EducationalOrganization',
      name: prof.department_name || prof.primary_discipline || 'Department of Research',
    },
    knowsAbout: prof.research_interests || [],
    url: getCanonicalUrl(`/professors/${prof.id}`),
    sameAs: sameAsLinks.length > 0 ? sameAsLinks : undefined,
  };
}

/**
 * Schema.org BreadcrumbList structured data
 */
export function getBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}
