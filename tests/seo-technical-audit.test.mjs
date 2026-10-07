import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sitemap from '../app/sitemap.ts';
import robots from '../app/robots.ts';
import {
  SITE_URL,
  getCanonicalUrl,
  getOrganizationJsonLd,
  getWebSiteJsonLd,
  getSoftwareApplicationJsonLd,
  getFaqJsonLd,
  getProfessorJsonLd,
  getBreadcrumbJsonLd,
} from '../lib/seo/site-config.ts';

test('Technical SEO & Search-Engine Readiness Audit Suite', async (t) => {
  await t.test('1. Sitemap generation integrity and URL hygiene', async () => {
    const entries = sitemap();
    assert.ok(Array.isArray(entries), 'Sitemap must return an array of URL entries');
    assert.ok(entries.length >= 7, 'Sitemap must contain at least base public pages');

    const urls = entries.map((e) => e.url);

    // Verify all URLs are HTTPS and canonical
    for (const url of urls) {
      assert.ok(url.startsWith('https://profmatch.ai'), `URL must start with canonical HTTPS domain: ${url}`);
      assert.ok(!url.endsWith('/') || url === 'https://profmatch.ai', `Non-root URL must not have trailing slash: ${url}`);
    }

    // Verify expected public routes exist
    assert.ok(urls.includes('https://profmatch.ai'), 'Must include homepage');
    assert.ok(urls.includes('https://profmatch.ai/search'), 'Must include /search');
    assert.ok(urls.includes('https://profmatch.ai/pricing'), 'Must include /pricing');
    assert.ok(urls.includes('https://profmatch.ai/faq'), 'Must include /faq');
    assert.ok(urls.includes('https://profmatch.ai/responsible-outreach'), 'Must include /responsible-outreach');
    assert.ok(urls.includes('https://profmatch.ai/privacy'), 'Must include /privacy');
    assert.ok(urls.includes('https://profmatch.ai/terms'), 'Must include /terms');

    // Verify verified professors are indexed
    const professorUrls = urls.filter((u) => u.includes('/professors/'));
    assert.ok(professorUrls.length > 0, 'Sitemap must include public verified faculty pages');

    // Verify strictly forbidden private pages are NOT present
    const forbiddenPatterns = [
      '/dashboard',
      '/login',
      '/signup',
      '/forgot-password',
      '/admin',
      '/profile',
      '/inbox',
      '/campaigns',
      '/autopilot',
      '/tracker',
      '/applications',
      '/billing',
      '/checkout',
      '/choose-plan',
      '/connectors',
      '/api',
    ];

    for (const forbidden of forbiddenPatterns) {
      const leaked = urls.find((u) => u.includes(forbidden));
      assert.strictEqual(leaked, undefined, `Private route ${forbidden} must NOT be in sitemap! Found: ${leaked}`);
    }

    // Verify no duplicates
    const uniqueUrls = new Set(urls);
    assert.strictEqual(uniqueUrls.size, urls.length, 'Sitemap must not contain duplicate URLs');
  });

  await t.test('2. Robots.txt crawl rules and disallow directives', () => {
    const config = robots();
    assert.ok(config.rules, 'Robots must contain rules');
    assert.strictEqual(config.sitemap, 'https://profmatch.ai/sitemap.xml', 'Robots must declare canonical sitemap');

    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    const disallow = rules.disallow || [];
    const allow = rules.allow || [];

    // Ensure all critical private routes are disallowed
    const requiredDisallows = [
      '/admin',
      '/api/',
      '/dashboard',
      '/profile',
      '/campaigns',
      '/autopilot',
      '/tracker',
      '/applications',
      '/inbox',
      '/checkout',
      '/billing',
      '/login',
      '/signup',
    ];

    for (const req of requiredDisallows) {
      assert.ok(
        disallow.includes(req) || disallow.includes(`${req}/`),
        `Robots disallow must contain ${req}`
      );
    }

    // Ensure public routes are allowed
    assert.ok(allow.includes('/'), 'Robots must allow /');
    assert.ok(allow.includes('/search'), 'Robots must allow /search');
    assert.ok(allow.includes('/professors/'), 'Robots must allow /professors/');
  });

  await t.test('3. Schema.org Structured Data Generators', () => {
    // A. Organization
    const org = getOrganizationJsonLd('ProfMatch AI');
    assert.strictEqual(org['@type'], 'Organization');
    assert.strictEqual(org.url, 'https://profmatch.ai');
    assert.ok(org.logo.startsWith('https://profmatch.ai'));

    // B. WebSite
    const site = getWebSiteJsonLd('ProfMatch AI');
    assert.strictEqual(site['@type'], 'WebSite');
    assert.strictEqual(site.potentialAction['@type'], 'SearchAction');
    assert.ok(site.potentialAction.target.urlTemplate.includes('/search?q='));

    // C. SoftwareApplication
    const app = getSoftwareApplicationJsonLd('ProfMatch AI');
    assert.strictEqual(app['@type'], 'SoftwareApplication');
    assert.strictEqual(app.applicationCategory, 'EducationalApplication');

    // D. FAQPage
    const faq = getFaqJsonLd([
      { question: 'Is faculty data verified?', answer: 'Yes, against official university directories.' },
    ]);
    assert.strictEqual(faq['@type'], 'FAQPage');
    assert.strictEqual(faq.mainEntity.length, 1);
    assert.strictEqual(faq.mainEntity[0].name, 'Is faculty data verified?');

    // E. Person (Faculty)
    const profSample = {
      id: 'prof_test_1',
      name: 'Dr. Jane Doe',
      title: 'Associate Professor',
      university_name: 'MIT',
      university_country: 'United States',
      department_name: 'EECS',
      research_interests: ['Robotics', 'Computer Vision'],
      profile_url: 'https://eecs.mit.edu/jane',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      confidence_score: 1.0,
      recruiting_status: 'VERIFIED_RECRUITING',
      verification_status: 'VERIFIED',
    };
    const person = getProfessorJsonLd(profSample);
    assert.strictEqual(person['@type'], 'Person');
    assert.strictEqual(person.name, 'Dr. Jane Doe');
    assert.strictEqual(person.worksFor.name, 'MIT');
    assert.strictEqual(person.url, 'https://profmatch.ai/professors/prof_test_1');
    assert.ok(person.sameAs.includes('https://eecs.mit.edu/jane'));

    // F. Breadcrumbs
    const crumbs = getBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Search', path: '/search' },
    ]);
    assert.strictEqual(crumbs['@type'], 'BreadcrumbList');
    assert.strictEqual(crumbs.itemListElement.length, 2);
    assert.strictEqual(crumbs.itemListElement[0].item, 'https://profmatch.ai');
    assert.strictEqual(crumbs.itemListElement[1].item, 'https://profmatch.ai/search');
  });

  await t.test('4. Private layouts enforce robots: noindex, nofollow', () => {
    const privateLayoutPaths = [
      'app/dashboard/layout.tsx',
      'app/profile/layout.tsx',
      'app/inbox/layout.tsx',
      'app/campaigns/layout.tsx',
      'app/autopilot/layout.tsx',
      'app/tracker/layout.tsx',
      'app/applications/layout.tsx',
      'app/billing/layout.tsx',
      'app/checkout/layout.tsx',
      'app/admin/layout.tsx',
      'app/(auth)/login/layout.tsx',
      'app/(auth)/signup/layout.tsx',
    ];

    for (const relPath of privateLayoutPaths) {
      const fullPath = path.resolve(relPath);
      assert.ok(fs.existsSync(fullPath), `Layout file ${relPath} must exist`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        content.includes('index: false') && content.includes('follow: false'),
        `Layout ${relPath} must specify robots noindex and nofollow`
      );
    }
  });

  await t.test('5. Public layouts and pages specify canonical alternates', () => {
    const publicLayoutPaths = [
      'app/layout.tsx',
      'app/search/layout.tsx',
      'app/pricing/layout.tsx',
      'app/faq/page.tsx',
      'app/responsible-outreach/page.tsx',
      'app/privacy/page.tsx',
      'app/terms/page.tsx',
      'app/professors/[id]/layout.tsx',
    ];

    for (const relPath of publicLayoutPaths) {
      const fullPath = path.resolve(relPath);
      assert.ok(fs.existsSync(fullPath), `Public file ${relPath} must exist`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        content.includes('canonical'),
        `Public file ${relPath} must define canonical URL`
      );
    }
  });
});
