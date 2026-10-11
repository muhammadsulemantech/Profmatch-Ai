import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createAdminClient } from '../supabase/admin.ts';

export interface PendingPasswordReset {
  email: string;
  token: string;
  expiresAt: number; // Timestamp in ms
  attempts: number;
  createdAt: number;
}

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes strictly
const MAX_ATTEMPTS = 5;

// In-memory store (for fast local dev server access)
const pendingResetMap = new Map<string, PendingPasswordReset>();

function getSecret(): string {
  return (
    process.env.ENCRYPTION_SECRET ||
    process.env.ADMIN_SECRET_PASSPHRASE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'profmatch-default-dev-secret-key-min-32-chars!!'
  );
}

function getStoreCandidates(): string[] {
  const candidates: string[] = [path.join(process.cwd(), 'database', 'pending_password_resets.json')];
  try {
    const tmpCandidate = path.join('/tmp', 'pending_password_resets.json');
    if (!candidates.includes(tmpCandidate)) {
      candidates.push(tmpCandidate);
    }
  } catch {}
  return candidates;
}

function loadResetsFromDisk() {
  const candidates = getStoreCandidates();
  for (const storeFile of candidates) {
    try {
      if (fs.existsSync(storeFile)) {
        const data = fs.readFileSync(storeFile, 'utf-8');
        if (data) {
          const parsed: Record<string, any> = JSON.parse(data);
          const now = Date.now();
          for (const [email, record] of Object.entries(parsed)) {
            if (record && record.expiresAt > now) {
              pendingResetMap.set(email.toLowerCase(), {
                email: record.email,
                token: record.token,
                expiresAt: record.expiresAt,
                attempts: record.attempts || 0,
                createdAt: record.createdAt || now,
              });
            }
          }
        }
      }
    } catch {
      // Continue to next candidate
    }
  }
}

function persistResetsToDisk() {
  const candidates = getStoreCandidates();
  const obj: Record<string, PendingPasswordReset> = {};
  const now = Date.now();
  pendingResetMap.forEach((record, email) => {
    if (record.expiresAt > now) {
      obj[email] = {
        email: record.email,
        token: record.token,
        expiresAt: record.expiresAt,
        attempts: record.attempts,
        createdAt: record.createdAt,
      };
    }
  });

  const serialized = JSON.stringify(obj, null, 2);
  for (const storeFile of candidates) {
    try {
      const dir = path.dirname(storeFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(storeFile, serialized, 'utf-8');
    } catch {
      // Silently continue if directory is read-only
    }
  }
}

// Initial load
loadResetsFromDisk();

/**
 * Creates a cryptographically signed stateless token.
 * Payload: email|expiresAt|nonce|hmac
 */
function signStatelessToken(email: string, expiresAt: number): string {
  const normalizedEmail = email.trim().toLowerCase();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${normalizedEmail}|${expiresAt}|${nonce}`;
  const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}|${hmac}`).toString('base64url');
}

/**
 * Verifies a stateless token signature and expiry.
 */
function verifyStatelessToken(
  email: string,
  token: string
): { valid: boolean; error?: string; isExpired?: boolean; tokenCreatedAt?: number } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split('|');
    if (parts.length !== 4) {
      return { valid: false };
    }
    const [tokenEmail, expiresAtStr, nonce, receivedHmac] = parts;
    const expiresAt = Number(expiresAtStr);
    if (!tokenEmail || isNaN(expiresAt)) {
      return { valid: false };
    }

    const payload = `${tokenEmail}|${expiresAtStr}|${nonce}`;
    const expectedHmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');

    const receivedBuf = Buffer.from(receivedHmac);
    const expectedBuf = Buffer.from(expectedHmac);
    if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
      return { valid: false, error: 'Invalid reset token signature.' };
    }

    if (tokenEmail.toLowerCase() !== email.trim().toLowerCase()) {
      return { valid: false, error: 'Reset token does not match the provided email address.' };
    }

    if (Date.now() > expiresAt) {
      return {
        valid: false,
        error: 'Password reset link has expired (15-minute limit). Please request a new link.',
        isExpired: true,
      };
    }

    return { valid: true, tokenCreatedAt: expiresAt - RESET_TOKEN_EXPIRY_MS };
  } catch {
    return { valid: false };
  }
}

/**
 * Persists reset token to Supabase user metadata for distributed/serverless persistence.
 */
export async function persistResetTokenToSupabase(email: string, token: string, expiresAt: number) {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) return;

    const normalizedEmail = email.trim().toLowerCase();
    const { data } = await adminClient.auth.admin.listUsers();
    const sbUser = data?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);

    if (sbUser) {
      await adminClient.auth.admin.updateUserById(sbUser.id, {
        user_metadata: {
          ...sbUser.user_metadata,
          reset_password_token: token,
          reset_password_expires_at: expiresAt,
          reset_password_attempts: 0,
        },
      });
    }
  } catch (err) {
    console.warn('[SUPABASE RESET TOKEN SAVE NOTICE]', err);
  }
}

/**
 * Creates a cryptographically secure reset token with a 15-minute expiration.
 * Dual resilience: Generates a signed stateless token and writes to Supabase Auth metadata and disk.
 */
export function createPasswordResetToken(email: string): { token: string; expiresAt: number } {
  loadResetsFromDisk();
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();
  const expiresAt = now + RESET_TOKEN_EXPIRY_MS; // 15 * 60 * 1000

  // 1. Create stateless signed token
  const token = signStatelessToken(normalizedEmail, expiresAt);

  const record: PendingPasswordReset = {
    email: normalizedEmail,
    token,
    expiresAt,
    attempts: 0,
    createdAt: now,
  };

  pendingResetMap.set(normalizedEmail, record);
  persistResetsToDisk();

  // 2. Fire and forget persistence to Supabase user metadata
  persistResetTokenToSupabase(normalizedEmail, token, expiresAt).catch(() => {});

  return { token, expiresAt };
}

/**
 * Validates a password reset token across stateless HMAC, local cache, and Supabase metadata.
 * Single-use: If burnOnSuccess is true, deletes/burns record upon successful match.
 */
export function verifyPasswordResetToken(
  email: string,
  token: string,
  burnOnSuccess: boolean = true
): Promise<{ valid: boolean; error?: string; isExpired?: boolean }> {
  return verifyPasswordResetTokenInternal(email, token, burnOnSuccess);
}

async function verifyPasswordResetTokenInternal(
  email: string,
  token: string,
  burnOnSuccess: boolean = true
): Promise<{ valid: boolean; error?: string; isExpired?: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedToken = token.trim();

  // 1. Stateless HMAC signature check (Zero external latency, 100% serverless immune)
  const stateless = verifyStatelessToken(normalizedEmail, trimmedToken);
  if (stateless.valid) {
    // Check if token was already burned in Supabase
    try {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data } = await adminClient.auth.admin.listUsers();
        const sbUser = data?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
        const lastReset = sbUser?.user_metadata?.last_password_reset_at || 0;

        if (stateless.tokenCreatedAt && lastReset > stateless.tokenCreatedAt) {
          return {
            valid: false,
            error: 'This password reset link has already been used. Please request a new link.',
            isExpired: true,
          };
        }

        if (burnOnSuccess && sbUser) {
          await adminClient.auth.admin.updateUserById(sbUser.id, {
            user_metadata: {
              ...sbUser.user_metadata,
              reset_password_token: null,
              reset_password_expires_at: null,
              last_password_reset_at: Date.now(),
            },
          });
        }
      }
    } catch (sbErr) {
      console.warn('[STATELESS BURN CHECK NOTICE]', sbErr);
    }

    if (burnOnSuccess) {
      pendingResetMap.delete(normalizedEmail);
      persistResetsToDisk();
    }
    return { valid: true };
  } else if (stateless.error && stateless.isExpired) {
    return stateless;
  }

  // 2. In-memory & local disk check
  loadResetsFromDisk();
  const record = pendingResetMap.get(normalizedEmail);
  if (record) {
    if (Date.now() > record.expiresAt) {
      pendingResetMap.delete(normalizedEmail);
      persistResetsToDisk();
      return {
        valid: false,
        error: 'Password reset link has expired (15-minute limit). Please request a new link.',
        isExpired: true,
      };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      pendingResetMap.delete(normalizedEmail);
      persistResetsToDisk();
      return {
        valid: false,
        error: 'Too many attempts. For security, please request a new password reset link.',
        isExpired: true,
      };
    }

    const tokenBuffer = Buffer.from(record.token);
    const enteredBuffer = Buffer.from(trimmedToken);

    let matches = false;
    if (tokenBuffer.length === enteredBuffer.length) {
      matches = crypto.timingSafeEqual(tokenBuffer, enteredBuffer);
    }

    if (matches) {
      if (burnOnSuccess) {
        pendingResetMap.delete(normalizedEmail);
        persistResetsToDisk();
      }
      return { valid: true };
    }
  }

  // 3. Supabase Auth user_metadata persistence (Crucial for existing email links & serverless cold starts)
  try {
    const adminClient = createAdminClient();
    if (adminClient) {
      const { data } = await adminClient.auth.admin.listUsers();
      const sbUser = data?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
      const meta = sbUser?.user_metadata;

      if (meta && meta.reset_password_token) {
        const storedToken = String(meta.reset_password_token).trim();
        const expiresAt = Number(meta.reset_password_expires_at) || 0;
        const attempts = Number(meta.reset_password_attempts) || 0;

        if (Date.now() > expiresAt) {
          return {
            valid: false,
            error: 'Password reset link has expired. Please request a new link.',
            isExpired: true,
          };
        }

        if (attempts >= MAX_ATTEMPTS) {
          return {
            valid: false,
            error: 'Too many attempts. For security, please request a new password reset link.',
            isExpired: true,
          };
        }

        const storedBuf = Buffer.from(storedToken);
        const enteredBuf = Buffer.from(trimmedToken);

        let matches = false;
        if (storedBuf.length === enteredBuf.length) {
          matches = crypto.timingSafeEqual(storedBuf, enteredBuf);
        }

        if (matches) {
          if (burnOnSuccess) {
            await adminClient.auth.admin.updateUserById(sbUser.id, {
              user_metadata: {
                ...meta,
                reset_password_token: null,
                reset_password_expires_at: null,
                last_password_reset_at: Date.now(),
              },
            });
          }
          return { valid: true };
        } else {
          // Record failed attempt
          await adminClient.auth.admin.updateUserById(sbUser.id, {
            user_metadata: {
              ...meta,
              reset_password_attempts: attempts + 1,
            },
          });
          const remaining = MAX_ATTEMPTS - (attempts + 1);
          return {
            valid: false,
            error: `Invalid reset link. (${Math.max(0, remaining)} attempts remaining)`,
          };
        }
      }
    }
  } catch (err) {
    console.error('[SUPABASE USER_METADATA TOKEN VERIFICATION ERROR]', err);
  }

  return {
    valid: false,
    error: 'Invalid or expired password reset link. Please request a new one.',
    isExpired: true,
  };
}

/**
 * Explicitly clears any pending password reset for an email.
 */
export function clearPasswordResetToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  pendingResetMap.delete(normalizedEmail);
  persistResetsToDisk();
}
