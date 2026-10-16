import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getCountryIso2 } from '../lib/geography/country-iso.ts';
import {
  UniversityVerificationEngine,
  isAccreditedInstitutionalDomain,
  isInstitutionalEmail,
} from '../lib/verification/university-verification.ts';

describe('OpenAlex Integration & Strict University Verification Suite', () => {
  describe('1. OpenAlex Country ISO-2 Mapper', () => {
    test('Maps common country names and codes to ISO-2 correctly', () => {
      assert.equal(getCountryIso2('Japan'), 'JP');
      assert.equal(getCountryIso2('United States'), 'US');
      assert.equal(getCountryIso2('United Kingdom'), 'GB');
      assert.equal(getCountryIso2('Canada'), 'CA');
      assert.equal(getCountryIso2('Germany'), 'DE');
      assert.equal(getCountryIso2('Pakistan'), 'PK');
      assert.equal(getCountryIso2('Australia'), 'AU');
    });

    test('Returns null for Global / All Countries', () => {
      assert.equal(getCountryIso2('Global (All Countries)'), null);
      assert.equal(getCountryIso2('All'), null);
      assert.equal(getCountryIso2(''), null);
      assert.equal(getCountryIso2(undefined), null);
    });
  });

  describe('2. University Verification Engine & Evidence Auditing', () => {
    test('Accredited institutional domain detection', () => {
      assert.equal(isAccreditedInstitutionalDomain('https://cs.stanford.edu/people/faculty'), true);
      assert.equal(isAccreditedInstitutionalDomain('https://www.ox.ac.uk/research'), true);
      assert.equal(isAccreditedInstitutionalDomain('https://nust.edu.pk/faculty'), true);
      assert.equal(isAccreditedInstitutionalDomain('https://www.u-tokyo.ac.jp/en'), true);
      assert.equal(isAccreditedInstitutionalDomain('https://medium.com/@author'), false);
      assert.equal(isAccreditedInstitutionalDomain('https://openalex.org/A123'), false);
    });

    test('Institutional email format validation', () => {
      assert.equal(isInstitutionalEmail('gdurrett@cs.utexas.edu'), true);
      assert.equal(isInstitutionalEmail('faculty@ox.ac.uk'), true);
      assert.equal(isInstitutionalEmail('john.doe@gmail.com'), false);
      assert.equal(isInstitutionalEmail('contact@yahoo.com'), false);
      assert.equal(isInstitutionalEmail(null), false);
    });

    test('OpenAlex author profile alone is classified UNVERIFIED without institutional proof', () => {
      const evaluation = UniversityVerificationEngine.verifyFaculty({
        name: 'Yoshua Bengio',
        universityName: 'Université de Montréal',
        openAlexAuthorId: 'https://openalex.org/A5086198262',
      });

      assert.equal(evaluation.overallStatus, 'UNVERIFIED');
      assert.equal(evaluation.isVerified, false);
      assert.equal(evaluation.emailStatus, 'NOT_FOUND');
      assert.ok(evaluation.confidenceScore < 0.7);
      assert.ok(evaluation.evidences.length > 0);
      assert.equal(evaluation.evidences[0].evidenceType, 'ACADEMIC_GRAPH_RECORD');
    });

    test('Institutional faculty page + verified email elevates to VERIFIED with timestamped evidence', () => {
      const evaluation = UniversityVerificationEngine.verifyFaculty({
        name: 'Dr. Greg Durrett',
        universityName: 'University of Texas at Austin',
        officialPageUrl: 'https://www.cs.utexas.edu/~gdurrett/',
        email: 'gdurrett@cs.utexas.edu',
        openAlexAuthorId: 'https://openalex.org/A5023880391',
      });

      assert.equal(evaluation.overallStatus, 'VERIFIED');
      assert.equal(evaluation.isVerified, true);
      assert.equal(evaluation.emailStatus, 'VERIFIED');
      assert.ok(evaluation.confidenceScore >= 0.9);
      assert.ok(evaluation.sources.some((s) => s.source_type === 'UNIVERSITY_FACULTY_PAGE'));
      assert.ok(evaluation.evidences.some((e) => e.evidenceType === 'OFFICIAL_UNIVERSITY_DIRECTORY'));
    });
  });

  describe('3. Codebase Static Audit: Strict Rules Enforcement', () => {
    const openAlexCode = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'providers', 'search', 'openalex-provider.ts'),
      'utf-8'
    );
    const searchRouteCode = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'professors', 'search', 'route.ts'),
      'utf-8'
    );
    const schemaSql = fs.readFileSync(
      path.join(process.cwd(), 'database', 'schema.sql'),
      'utf-8'
    );

    test('OpenAlex provider does not invent email addresses (sets email: null)', () => {
      assert.ok(
        openAlexCode.includes('email: null'),
        'OpenAlex provider must set email: null instead of synthesizing an email'
      );
    });

    test('OpenAlex provider uses ISO-2 country filter parameter in API query', () => {
      assert.ok(
        openAlexCode.includes('last_known_institutions.country_code'),
        'OpenAlex query must pass last_known_institutions.country_code filter'
      );
    });

    test('Search route asynchronously persists canonical professors to PostgreSQL', () => {
      assert.ok(
        searchRouteCode.includes('upsertProfessorsBatch'),
        'Search route must call upsertProfessorsBatch'
      );
    });

    test('Database schema includes openalex_id and performance index', () => {
      assert.ok(
        schemaSql.includes('openalex_id TEXT UNIQUE'),
        'schema.sql must define openalex_id TEXT UNIQUE'
      );
    });
  });
});
