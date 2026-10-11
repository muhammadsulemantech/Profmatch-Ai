import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface PendingPasswordReset {
  email: string;
  token: string;
  expiresAt: number; // Timestamp in ms
  attempts: number;
  createdAt: number;
}

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes strictly
const MAX_ATTEMPTS = 5;

// In-memory store
const pendingResetMap = new Map<string, PendingPasswordReset>();

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
 * Creates a cryptographically secure 32-byte reset token (64 hex characters) with a 15-minute expiration.
 */
export function createPasswordResetToken(email: string): { token: string; expiresAt: number } {
  loadResetsFromDisk();
  const normalizedEmail = email.trim().toLowerCase();
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + RESET_TOKEN_EXPIRY_MS;

  const record: PendingPasswordReset = {
    email: normalizedEmail,
    token,
    expiresAt,
    attempts: 0,
    createdAt: now,
  };

  pendingResetMap.set(normalizedEmail, record);
  persistResetsToDisk();

  return { token, expiresAt };
}

/**
 * Validates a password reset token.
 * Single-use: If burnOnSuccess is true, deletes record upon successful match.
 */
export function verifyPasswordResetToken(
  email: string,
  token: string,
  burnOnSuccess: boolean = true
): { valid: boolean; error?: string; isExpired?: boolean } {
  loadResetsFromDisk();
  const normalizedEmail = email.trim().toLowerCase();
  const record = pendingResetMap.get(normalizedEmail);

  if (!record) {
    return {
      valid: false,
      error: 'Invalid or expired password reset link. Please request a new one.',
      isExpired: true,
    };
  }

  // Check 15-minute expiration
  if (Date.now() > record.expiresAt) {
    pendingResetMap.delete(normalizedEmail);
    persistResetsToDisk();
    return {
      valid: false,
      error: 'Password reset link has expired (15-minute limit). Please request a new link.',
      isExpired: true,
    };
  }

  // Check brute force attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    pendingResetMap.delete(normalizedEmail);
    persistResetsToDisk();
    return {
      valid: false,
      error: 'Too many attempts. For security, please request a new password reset link.',
      isExpired: true,
    };
  }

  // Timing safe token comparison
  const tokenBuffer = Buffer.from(record.token);
  const enteredBuffer = Buffer.from(token.trim());

  let matches = false;
  if (tokenBuffer.length === enteredBuffer.length) {
    matches = crypto.timingSafeEqual(tokenBuffer, enteredBuffer);
  }

  if (!matches) {
    record.attempts += 1;
    persistResetsToDisk();
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      valid: false,
      error: `Invalid reset link. (${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining)`,
    };
  }

  if (burnOnSuccess) {
    // Single use burn
    pendingResetMap.delete(normalizedEmail);
    persistResetsToDisk();
  }

  return { valid: true };
}

/**
 * Explicitly clears any pending password reset for an email.
 */
export function clearPasswordResetToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  pendingResetMap.delete(normalizedEmail);
  persistResetsToDisk();
}
