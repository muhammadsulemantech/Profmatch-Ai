import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { encryptToken, decryptToken } from '../lib/security/encryption.ts';
import { createSignedOAuthState, verifySignedOAuthState } from '../lib/security/oauth-state.ts';
import { validateSafeRedirect } from '../lib/security/url-validation.ts';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

describe('Tier 0.4 Gmail OAuth & Multi-Tenancy Security Suite', () => {
  describe('1. Token Encryption & Decryption (AES-256-GCM)', () => {
    test('Encrypts plaintext token and decrypts back to original', () => {
      const originalToken = 'ya29.a0AfH6SMD_secret_google_oauth_token_1234567890';
      const encrypted = encryptToken(originalToken);

      assert.ok(encrypted.startsWith('enc:'), 'Encrypted token must have enc: prefix');
      assert.notEqual(encrypted, originalToken, 'Ciphertext must not match plaintext');
      assert.ok(!encrypted.includes('secret_google'), 'Ciphertext must not leak token content');

      const decrypted = decryptToken(encrypted);
      assert.equal(decrypted, originalToken, 'Decrypted token must match original exactly');
    });

    test('Tampered ciphertext fails decryption and returns empty string', () => {
      const originalToken = 'secret_token';
      const encrypted = encryptToken(originalToken);
      const tampered = encrypted.slice(0, -4) + 'ffff';

      const decrypted = decryptToken(tampered);
      assert.equal(decrypted, '', 'Tampered token must fail to decrypt');
    });
  });

  describe('2. HMAC-Signed OAuth State & Anti-CSRF Nonce', () => {
    test('Valid signed state verifies and preserves user ID and safe redirect', () => {
      const state = createSignedOAuthState({
        userId: 'usr_verified_123',
        redirectTo: '/connectors',
      });

      const verification = verifySignedOAuthState(state);
      assert.equal(verification.valid, true);
      assert.equal(verification.payload?.userId, 'usr_verified_123');
      assert.equal(verification.payload?.redirectTo, '/connectors');
      assert.ok(verification.payload?.nonce, 'State must contain a unique cryptographic nonce');
    });

    test('Forged/tampered state signature is rejected', () => {
      const validState = createSignedOAuthState({
        userId: 'usr_verified_123',
        redirectTo: '/connectors',
      });

      const [payloadB64] = validState.split('.');
      const forgedState = `${payloadB64}.forged_invalid_signature_hex`;

      const verification = verifySignedOAuthState(forgedState);
      assert.equal(verification.valid, false);
      assert.ok(verification.error?.includes('signature') || verification.error?.includes('CSRF'));
    });

    test('Unsigned raw base64 JSON state (old exploit format) is rejected', () => {
      const oldExploitState = Buffer.from(
        JSON.stringify({ userId: 'attacker_target_user', redirectTo: 'https://evil.com' })
      ).toString('base64');

      const verification = verifySignedOAuthState(oldExploitState);
      assert.equal(verification.valid, false);
    });
  });

  describe('3. Open Redirect Prevention', () => {
    test('External domains are sanitized to default safe path', () => {
      assert.equal(validateSafeRedirect('https://evil-attacker.com/steal-creds'), '/settings');
      assert.equal(validateSafeRedirect('http://evil.com'), '/settings');
      assert.equal(validateSafeRedirect('//evil.com/phish'), '/settings');
      assert.equal(validateSafeRedirect('javascript:alert(1)'), '/settings');
    });

    test('Valid relative paths and local application URLs are allowed', () => {
      assert.equal(validateSafeRedirect('/settings'), '/settings');
      assert.equal(validateSafeRedirect('/connectors?success=true'), '/connectors?success=true');
      assert.equal(validateSafeRedirect('/dashboard'), '/dashboard');
    });
  });

  describe('4. Multi-Tenant Outreach & Callback API Protection', () => {
    test('POST /api/outreach/send-email unauthenticated returns 401 even with arbitrary userId body', async () => {
      const res = await fetch(`${BASE_URL}/api/outreach/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: 'prof@mit.edu',
          subject: 'Research inquiry',
          bodyText: 'Hello Professor',
          userId: 'usr_student_victim_001',
        }),
      });

      assert.equal(res.status, 401, 'Unauthenticated send-email must return 401');
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('POST /api/outreach/create-draft unauthenticated returns 401', async () => {
      const res = await fetch(`${BASE_URL}/api/outreach/create-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: 'prof@mit.edu',
          subject: 'Research inquiry',
          bodyText: 'Hello Professor',
        }),
      });

      assert.equal(res.status, 401, 'Unauthenticated create-draft must return 401');
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('GET /api/auth/google/gmail/callback with forged state redirects to error without open redirect', async () => {
      const forgedState = 'unsigned_bogus_state';
      const res = await fetch(`${BASE_URL}/api/auth/google/gmail/callback?state=${forgedState}&code=dummy_code`, {
        redirect: 'manual',
      });

      // Must redirect to /settings with error, NOT follow forged state
      assert.equal(res.status, 307);
      const location = res.headers.get('location') || '';
      assert.ok(location.includes('/settings'), 'Must redirect to safe settings page');
      assert.ok(location.includes('error='), 'Must indicate error in query');
      assert.ok(!location.includes('evil.com'), 'Must never redirect to external domain');
    });

    test('GET /api/auth/google/gmail/callback with attacker open-redirect payload is blocked', async () => {
      const attackerPayload = Buffer.from(
        JSON.stringify({ origin: 'https://evil-phishing-site.com', redirectTo: 'https://evil-phishing-site.com' })
      ).toString('base64');

      const res = await fetch(`${BASE_URL}/api/auth/google/gmail/callback?state=${attackerPayload}&code=dummy`, {
        redirect: 'manual',
      });

      assert.equal(res.status, 307);
      const location = res.headers.get('location') || '';
      assert.ok(!location.startsWith('https://evil-phishing-site.com'), 'Must block attacker external redirect');
      assert.ok(location.includes('/settings'), 'Must redirect to internal safe path');
    });

    test('GET /api/auth/google/gmail unauthenticated redirects to /login', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/google/gmail`, {
        redirect: 'manual',
      });

      assert.equal(res.status, 307);
      const location = res.headers.get('location') || '';
      assert.ok(location.includes('/login'), 'Unauthenticated Gmail connect must redirect to /login');
    });
  });
});
