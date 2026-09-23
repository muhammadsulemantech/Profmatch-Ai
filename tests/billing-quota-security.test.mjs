import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEffectiveUserTier, ACADEMIC_PLANS, isCountryUnlockedForTier, getPlanConfig } from '../lib/services/usage-service.ts';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

describe('Tier 0.5 Billing & Quota Security Suite', () => {
  describe('1. Code Integrity: Fake Stripe & Client Overrides Elimination', () => {
    test('lib/providers/payment/index.ts does NOT mint fake cs_stripe_ session IDs', () => {
      const paymentProviderCode = fs.readFileSync(
        path.join(process.cwd(), 'lib', 'providers', 'payment', 'index.ts'),
        'utf-8'
      );
      assert.equal(
        paymentProviderCode.includes('cs_stripe_'),
        false,
        'Found forbidden fake cs_stripe_ session minting in payment providers!'
      );
      assert.ok(
        paymentProviderCode.includes('Stripe gateway is not configured on this server'),
        'Stripe provider must fail loudly when unconfigured'
      );
    });

    test('lib/providers/payment/index.ts does NOT fake PayPal success redirects', () => {
      const paymentProviderCode = fs.readFileSync(
        path.join(process.cwd(), 'lib', 'providers', 'payment', 'index.ts'),
        'utf-8'
      );
      assert.equal(
        paymentProviderCode.includes('paypal_order='),
        false,
        'Found forbidden fake paypal_order redirection in PayPal provider!'
      );
      assert.ok(
        paymentProviderCode.includes('PayPal gateway is not configured on this server'),
        'PayPal provider must fail loudly when unconfigured'
      );
    });

    test('lib/services/usage-service.ts contains NO client tier override key', () => {
      const usageServiceCode = fs.readFileSync(
        path.join(process.cwd(), 'lib', 'services', 'usage-service.ts'),
        'utf-8'
      );
      assert.equal(
        usageServiceCode.includes('USER_TIER_OVERRIDE_KEY'),
        false,
        'Found forbidden USER_TIER_OVERRIDE_KEY in usage-service.ts!'
      );
      assert.equal(
        usageServiceCode.includes('setUserTierOverride'),
        false,
        'Found forbidden setUserTierOverride in usage-service.ts!'
      );
    });
  });

  describe('2. Plan Catalog & Destination Gating Logic', () => {
    test('Catalog pricing is canonical and well-defined', () => {
      assert.equal(ACADEMIC_PLANS.FREE.pricePkr, 0);
      assert.equal(ACADEMIC_PLANS.FREE.priceUsd, 0);
      assert.equal(ACADEMIC_PLANS.STARTER.pricePkr, 3500);
      assert.equal(ACADEMIC_PLANS.STARTER.priceUsd, 12);
      assert.equal(ACADEMIC_PLANS.PRO.pricePkr, 8000);
      assert.equal(ACADEMIC_PLANS.PRO.priceUsd, 29);
      assert.equal(ACADEMIC_PLANS.ELITE.pricePkr, 16000);
      assert.equal(ACADEMIC_PLANS.ELITE.priceUsd, 59);
    });

    test('Free tier allows only designated countries (Pakistan, Germany)', () => {
      assert.equal(isCountryUnlockedForTier('FREE', 'Pakistan'), true);
      assert.equal(isCountryUnlockedForTier('FREE', 'Germany'), true);
      assert.equal(isCountryUnlockedForTier('FREE', 'United States'), false);
      assert.equal(isCountryUnlockedForTier('FREE', 'United Kingdom'), false);
      assert.equal(isCountryUnlockedForTier('FREE', 'Japan'), false);
    });

    test('Pro tier unlocks 40+ destinations including US, UK, Canada, Japan', () => {
      assert.equal(isCountryUnlockedForTier('PRO', 'United States'), true);
      assert.equal(isCountryUnlockedForTier('PRO', 'United Kingdom'), true);
      assert.equal(isCountryUnlockedForTier('PRO', 'Canada'), true);
      assert.equal(isCountryUnlockedForTier('PRO', 'Japan'), true);
    });

    test('Elite tier unlocks ALL countries worldwide', () => {
      assert.equal(isCountryUnlockedForTier('ELITE', 'Global (All Countries)'), true);
      assert.equal(isCountryUnlockedForTier('ELITE', 'Antarctica'), true);
      assert.equal(isCountryUnlockedForTier('ELITE', 'Singapore'), true);
    });

    test('getEffectiveUserTier defaults safely to FREE', () => {
      assert.equal(getEffectiveUserTier(undefined), 'FREE');
      assert.equal(getEffectiveUserTier(null), 'FREE');
      assert.equal(getEffectiveUserTier('MALICIOUS_TIER'), 'FREE');
      assert.equal(getEffectiveUserTier('STARTER'), 'STARTER');
      assert.equal(getEffectiveUserTier('PRO'), 'PRO');
      assert.equal(getEffectiveUserTier('ELITE'), 'ELITE');
    });
  });

  describe('3. Checkout Endpoint Security (POST /api/checkout/submit)', () => {
    test('Rejects unauthenticated checkout submission with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/checkout/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: 'PRO',
          amount: 0.01,
          currency: 'USD',
          paymentMethodId: 'pm_card_01',
          transactionId: 'TX_12345678',
        }),
      });

      assert.equal(res.status, 401, 'Unauthenticated checkout must return 401');
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.error.includes('Unauthorized'));
    });

    test('Rejects checkout with forged admin/session cookies with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/checkout/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'profmatch_session=forged_admin_token; profmatch_role=ADMIN',
        },
        body: JSON.stringify({
          planTier: 'ELITE',
          amount: 0,
          paymentMethodId: 'pm_card_01',
          transactionId: 'TX_FAKE_001',
        }),
      });

      assert.equal(res.status, 401, 'Forged cookie checkout must return 401');
      const data = await res.json();
      assert.equal(data.success, false);
    });
  });

  describe('4. Gated Endpoints Backend Quota & Auth Enforcement', () => {
    test('POST /api/professors/search unauthenticated returns 401', async () => {
      const res = await fetch(`${BASE_URL}/api/professors/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Machine Learning',
          country: 'United States',
        }),
      });

      assert.equal(res.status, 401, 'Unauthenticated search must return 401');
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('POST /api/autopilot/discover-next unauthenticated returns 401', async () => {
      const res = await fetch(`${BASE_URL}/api/autopilot/discover-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCountry: 'United States',
          discipline: 'Computer Science',
        }),
      });

      assert.equal(res.status, 401, 'Unauthenticated autopilot discover-next must return 401');
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('POST /api/autopilot/draft-grounded unauthenticated returns 401', async () => {
      const res = await fetch(`${BASE_URL}/api/autopilot/draft-grounded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professor: { name: 'Dr. Alan Turing', university_name: 'Cambridge' },
          userId: 'usr_student_001',
        }),
      });

      assert.equal(res.status, 401, 'Unauthenticated draft-grounded must return 401');
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('POST /api/matches/analyze unauthenticated returns 401', async () => {
      const res = await fetch(`${BASE_URL}/api/matches/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professorId: 'prof_mit_01',
        }),
      });

      assert.equal(res.status, 401, 'Unauthenticated match analyze must return 401');
      const data = await res.json();
      assert.equal(data.success, false);
    });
  });
});
