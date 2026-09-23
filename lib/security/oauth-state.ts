import crypto from 'crypto';
import { validateSafeRedirect } from './url-validation.ts';

const STATE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

function getStateSecret(): string {
  return (
    process.env.ADMIN_SECRET_PASSPHRASE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'profmatch-oauth-state-signing-secret-key-2026'
  );
}

export interface OAuthStatePayload {
  userId: string;
  redirectTo: string;
  nonce: string;
  timestamp: number;
}

/**
 * Creates an HMAC-SHA256 signed OAuth state parameter with a unique nonce and timestamp.
 */
export function createSignedOAuthState(params: { userId: string; redirectTo?: string }): string {
  const payload: OAuthStatePayload = {
    userId: params.userId,
    redirectTo: validateSafeRedirect(params.redirectTo, '/settings'),
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now(),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getStateSecret())
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the HMAC-SHA256 signature and freshness of an OAuth state parameter.
 */
export function verifySignedOAuthState(stateString: string | null | undefined): {
  valid: boolean;
  payload?: OAuthStatePayload;
  error?: string;
} {
  if (!stateString || typeof stateString !== 'string') {
    return { valid: false, error: 'Missing or invalid state parameter.' };
  }

  const parts = stateString.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed state parameter format.' };
  }

  const [payloadB64, signature] = parts;

  // Verify HMAC signature in constant time
  const expectedSignature = crypto
    .createHmac('sha256', getStateSecret())
    .update(payloadB64)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return { valid: false, error: 'Invalid OAuth state signature. Possible CSRF attempt.' };
  }

  // Parse and validate payload
  try {
    const payload: OAuthStatePayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // Check expiration
    if (Date.now() - payload.timestamp > STATE_MAX_AGE_MS) {
      return { valid: false, error: 'OAuth state has expired. Please initiate connection again.' };
    }

    if (!payload.userId) {
      return { valid: false, error: 'Invalid state payload: missing user binding.' };
    }

    // Ensure redirectTo is sanitized
    payload.redirectTo = validateSafeRedirect(payload.redirectTo, '/settings');

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Corrupt state payload.' };
  }
}
