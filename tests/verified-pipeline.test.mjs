import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { formatCleanProfessorEmail, resolveUniversityDomain } from '../lib/utils/email-resolver.ts';

describe('Tier 0.6 Verified Faculty Pipeline Integrity Suite', () => {
  describe('1. Tavily Provider Pipeline Integrity', () => {
    const tavilyCode = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'providers', 'search', 'tavily-provider.ts'),
      'utf-8'
    );

    test('Permanently deleted 50 hardcoded fallback professor names', () => {
      assert.equal(
        tavilyCode.includes('fallbackNames'),
        false,
        'Found forbidden fallbackNames array in tavily-provider.ts!'
      );
      assert.equal(
        tavilyCode.includes('Dr. Alexander Vance'),
        false,
        'Found forbidden hardcoded persona "Dr. Alexander Vance" in tavily-provider.ts!'
      );
      assert.equal(
        tavilyCode.includes('Dr. Elena Rostova'),
        false,
        'Found forbidden hardcoded persona "Dr. Elena Rostova" in tavily-provider.ts!'
      );
    });

    test('Permanently deleted round-robin title assignment', () => {
      assert.equal(
        tavilyCode.includes('index % 3 === 0'),
        false,
        'Found forbidden round-robin title assignment in tavily-provider.ts!'
      );
    });

    test('Never fabricates VERIFIED status for web search results', () => {
      assert.ok(
        tavilyCode.includes("verification_status: 'UNVERIFIED'"),
        'Tavily search results must be marked UNVERIFIED'
      );
      assert.equal(
        tavilyCode.includes("verification_status: 'VERIFIED'"),
        false,
        'Tavily provider must never claim VERIFIED on unverified web search results'
      );
    });

    test('verifyFacultyProfile returns unverified when no institutional verification proof exists', () => {
      assert.ok(
        tavilyCode.includes('isVerified: false'),
        'verifyFacultyProfile must return isVerified: false by default'
      );
      assert.equal(
        tavilyCode.includes('isVerified: true'),
        false,
        'verifyFacultyProfile must not return fake isVerified: true'
      );
    });
  });

  describe('2. OpenAlex Provider Integrity', () => {
    const openAlexCode = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'providers', 'search', 'openalex-provider.ts'),
      'utf-8'
    );

    test('OpenAlex results are marked UNVERIFIED for verification and candidate emails', () => {
      assert.ok(
        openAlexCode.includes("verification_status: 'UNVERIFIED'"),
        'OpenAlex graph author records must be marked UNVERIFIED'
      );
      assert.ok(
        openAlexCode.includes("email_verification_status: 'UNVERIFIED'"),
        'Constructed candidate emails must be marked UNVERIFIED'
      );
      assert.ok(
        openAlexCode.includes("recruiting_status: 'UNKNOWN'"),
        'OpenAlex records without explicit recruitment notice must be marked UNKNOWN'
      );
    });

    test('OpenAlex verifyFacultyProfile does not claim fake verified status', () => {
      assert.ok(
        openAlexCode.includes('isVerified: false'),
        'verifyFacultyProfile must return isVerified: false'
      );
      assert.equal(
        openAlexCode.includes('isVerified: true'),
        false,
        'verifyFacultyProfile must not return fake isVerified: true'
      );
    });
  });

  describe('3. Professor Detail Page (app/professors/[id]/page.tsx) Integrity', () => {
    const pageCode = fs.readFileSync(
      path.join(process.cwd(), 'app', 'professors', '[id]', 'page.tsx'),
      'utf-8'
    );

    test('generateDeterministicProf function is completely eliminated', () => {
      assert.equal(
        pageCode.includes('generateDeterministicProf'),
        false,
        'Found forbidden generateDeterministicProf in app/professors/[id]/page.tsx!'
      );
    });

    test('Fake 95.5% fallbackMatch is completely eliminated', () => {
      assert.equal(
        pageCode.includes('fallbackMatch'),
        false,
        'Found forbidden fake fallbackMatch in app/professors/[id]/page.tsx!'
      );
      assert.equal(
        pageCode.includes('overall_score: 95.5'),
        false,
        'Found forbidden hardcoded 95.5% overall_score in app/professors/[id]/page.tsx!'
      );
    });

    test('Displays truthful badge conditionally, never unconditionally claiming verified', () => {
      assert.ok(
        pageCode.includes("prof.verification_status === 'VERIFIED'"),
        'Verification badge must be conditionally rendered'
      );
      assert.ok(
        pageCode.includes('Unverified Web Record'),
        'Must display Unverified Web Record badge when unverified'
      );
    });
  });

  describe('4. Email Resolver Truthfulness', () => {
    test('Resolves university domain correctly', () => {
      assert.equal(resolveUniversityDomain('Stanford University'), 'stanford.edu');
      assert.equal(resolveUniversityDomain('MIT'), 'mit.edu');
      assert.equal(resolveUniversityDomain('University of Oxford'), 'ox.ac.uk');
      assert.equal(resolveUniversityDomain('Technical University of Munich'), 'tum.de');
    });

    test('Constructs candidate pattern email correctly without double dots', () => {
      const email = formatCleanProfessorEmail({
        name: 'Dr. Yann LeCun',
        university_name: 'Stanford University',
      });
      assert.equal(email, 'yann.lecun@stanford.edu');
      assert.ok(!email.includes('..'));
    });
  });
});
