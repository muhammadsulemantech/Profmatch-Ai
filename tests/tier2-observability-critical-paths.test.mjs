import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeObject } from '../lib/logger.ts';
import { hashPassword, verifyPassword, createPendingRegistration, verifyPendingOtp } from '../lib/auth/otp-store.ts';
import { checkRateLimit } from '../lib/security/rate-limit.ts';
import { ACADEMIC_PLANS, getEffectiveUserTier, getPlanConfig } from '../lib/services/usage-service.ts';

test('Tier 2.4: Observability, Configuration, and Critical Security Suite', async (t) => {
  await t.test('1. Runtime Config: lib/config.ts exports typed and validated config', async () => {
    const configPath = path.resolve('lib/config.ts');
    assert.ok(fs.existsSync(configPath), 'lib/config.ts must exist');

    const configCode = fs.readFileSync(configPath, 'utf8');
    assert.ok(configCode.includes('envSchema'), 'Must define envSchema with Zod');
    assert.ok(configCode.includes('NEXT_PUBLIC_APP_URL'), 'Must validate NEXT_PUBLIC_APP_URL');
    assert.ok(configCode.includes('SESSION_SECRET'), 'Must validate SESSION_SECRET');
    assert.ok(configCode.includes('export const config'), 'Must export singleton config object');
  });

  await t.test('2. Structured Logger: Credential Redaction removes sensitive fields', () => {
    const rawPayload = {
      user: 'researcher@university.edu',
      password: 'supersecretpassword123',
      otp: '482910',
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
      access_token: 'ya29.a0ARrdaM-sensitive-google-token',
      nested: {
        stripe_secret_key: 'sk_live_948201948201948',
        apiKey: 'gemini_api_key_secret_123',
        publicNote: 'Hello World',
      },
    };

    const sanitized = sanitizeObject(rawPayload);

    assert.notStrictEqual(sanitized.password, 'supersecretpassword123');
    assert.ok(sanitized.password.includes('REDACTED'), 'Password must be redacted');
    assert.ok(sanitized.otp.includes('REDACTED'), 'OTP must be redacted');
    assert.ok(sanitized.authorization.includes('REDACTED'), 'Authorization token must be redacted');
    assert.ok(sanitized.access_token.includes('REDACTED'), 'Access token must be redacted');
    assert.ok(sanitized.nested.stripe_secret_key.includes('REDACTED'), 'Stripe key must be redacted');
    assert.ok(sanitized.nested.apiKey.includes('REDACTED'), 'API key must be redacted');
    assert.strictEqual(sanitized.nested.publicNote, 'Hello World', 'Non-sensitive fields must be preserved');
  });

  await t.test('3. Auth Security: Password Hashing, Timing-Safe OTP, and Admin Privilege Checks', async () => {
    // A. Password scrypt hashing & verification
    const plainPass = 'MyStrongResearchPass!2026';
    const hash = await hashPassword(plainPass);
    assert.ok(hash.includes(':'), 'Hash must contain salt:hash format');
    assert.strictEqual(await verifyPassword(plainPass, hash), true, 'Valid password must verify');
    assert.strictEqual(await verifyPassword('WrongPassword123', hash), false, 'Invalid password must be rejected');

    // B. Server auth file guards verification
    const serverAuthPath = path.resolve('lib/auth/server-auth.ts');
    const serverAuthCode = fs.readFileSync(serverAuthPath, 'utf8');
    assert.ok(serverAuthCode.includes('isAdminEmail'), 'Must export isAdminEmail');
    assert.ok(serverAuthCode.includes('verifyAuthSession'), 'Must export verifyAuthSession');
    assert.ok(serverAuthCode.includes('assertAdmin'), 'Must export assertAdmin');
    assert.ok(serverAuthCode.includes('assertUser'), 'Must export assertUser');

    // C. OTP generation and single-use burn
    const testEmail = `researcher_${Date.now()}@cambridge.ac.uk`;
    const reg = createPendingRegistration({
      email: testEmail,
      fullName: 'Dr. Jane Doe',
      password: plainPass,
      targetDegree: 'Postdoc',
    });

    assert.ok(reg.code && reg.code.length === 6, 'Must generate 6-digit OTP');

    // Attempting wrong OTP fails
    const invalidVerify = verifyPendingOtp(testEmail, '000000');
    assert.strictEqual(invalidVerify.valid, false, 'Wrong OTP must be rejected');

    // Attempting correct OTP succeeds
    const validVerify = verifyPendingOtp(testEmail, reg.code);
    assert.strictEqual(validVerify.valid, true, 'Correct OTP must succeed');

    // OTP cannot be reused (single-use burn)
    const reusedVerify = verifyPendingOtp(testEmail, reg.code);
    assert.strictEqual(reusedVerify.valid, false, 'Reused OTP must be rejected');
  });

  await t.test('4. Rate Limiter: Enforces limit and tracks attempts', () => {
    const testKey = `test_key_${Date.now()}`;
    const opts = { limit: 3, windowMs: 60000 };

    // First 3 requests must succeed
    assert.strictEqual(checkRateLimit(testKey, opts).success, true);
    assert.strictEqual(checkRateLimit(testKey, opts).success, true);
    assert.strictEqual(checkRateLimit(testKey, opts).success, true);

    // 4th request must be rate limited
    const fourth = checkRateLimit(testKey, opts);
    assert.strictEqual(fourth.success, false, '4th attempt must be rejected');
    assert.ok(fourth.reset > 0, 'Must provide reset window');
  });

  await t.test('5. Tier Gating & Quota Logic: ACADEMIC_PLANS and limits', () => {
    assert.ok(ACADEMIC_PLANS.FREE, 'FREE plan must exist');
    assert.ok(ACADEMIC_PLANS.STARTER, 'STARTER plan must exist');
    assert.ok(ACADEMIC_PLANS.PRO, 'PRO plan must exist');
    assert.ok(ACADEMIC_PLANS.ELITE, 'ELITE plan must exist');

    // Tier resolution
    assert.strictEqual(getEffectiveUserTier('FREE'), 'FREE');
    assert.strictEqual(getEffectiveUserTier('PRO'), 'PRO');
    assert.strictEqual(getEffectiveUserTier('STUDENT'), 'STARTER');
    assert.strictEqual(getEffectiveUserTier(undefined), 'FREE');

    // Plan limits
    const freePlan = getPlanConfig('FREE');
    assert.strictEqual(freePlan.searchesLimit, 3);
    assert.strictEqual(freePlan.draftsLimit, 2);

    const proPlan = getPlanConfig('PRO');
    assert.strictEqual(proPlan.searchesLimit, 250);
    assert.strictEqual(proPlan.draftsLimit, 150);

    const elitePlan = getPlanConfig('ELITE');
    assert.strictEqual(elitePlan.searchesLimit, 999999);
    assert.strictEqual(elitePlan.allowedCountries, 'ALL');
  });

  await t.test('6. Security Headers: HSTS, CSP, and X-Frame-Options present in middleware and next.config', () => {
    const middlewarePath = path.resolve('middleware.ts');
    const nextConfigPath = path.resolve('next.config.mjs');

    const middlewareCode = fs.readFileSync(middlewarePath, 'utf8');
    const nextConfigCode = fs.readFileSync(nextConfigPath, 'utf8');

    assert.ok(middlewareCode.includes('Strict-Transport-Security'), 'Middleware must set HSTS');
    assert.ok(middlewareCode.includes('Content-Security-Policy'), 'Middleware must set CSP');
    assert.ok(middlewareCode.includes('X-Frame-Options'), 'Middleware must set X-Frame-Options');

    assert.ok(nextConfigCode.includes('Strict-Transport-Security'), 'next.config must configure HSTS');
    assert.ok(nextConfigCode.includes('Content-Security-Policy'), 'next.config must configure CSP');
  });
});
