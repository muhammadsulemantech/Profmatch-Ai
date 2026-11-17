import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { encryptToken, decryptToken } from '@/lib/security/encryption';
import { createSignedOAuthState, verifySignedOAuthState } from '@/lib/security/oauth-state';

describe('Security Utilities', () => {
  it('enforces rate limits per identifier', () => {
    const id = `vitest_rl_${Date.now()}`;
    const first = checkRateLimit(id, { limit: 2, windowMs: 60_000 });
    const second = checkRateLimit(id, { limit: 2, windowMs: 60_000 });
    const third = checkRateLimit(id, { limit: 2, windowMs: 60_000 });

    expect(first.success).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.success).toBe(false);
  });

  it('encrypts and decrypts OAuth tokens round-trip', () => {
    const raw = 'ya29.test-oauth-refresh-token';
    const encrypted = encryptToken(raw);

    expect(encrypted).toMatch(/^enc:/);
    expect(encrypted).not.toContain(raw);
    expect(decryptToken(encrypted)).toBe(raw);
  });

  it('signs and verifies OAuth state while rejecting tampered state', () => {
    const state = createSignedOAuthState({ userId: 'usr_123', redirectTo: '/connectors' });
    const verified = verifySignedOAuthState(state);

    expect(verified.valid).toBe(true);
    expect(verified.payload?.userId).toBe('usr_123');
    expect(verified.payload?.redirectTo).toBe('/connectors');

    const tampered = `${state.slice(0, -4)}XXXX`;
    expect(verifySignedOAuthState(tampered).valid).toBe(false);
  });
});

