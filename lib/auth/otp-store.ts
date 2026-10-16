import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface PendingSignupRegistration {
  email: string;
  fullName: string;
  passwordHash: string;
  targetDegree: string;
  code: string;
  expiresAt: number; // Timestamp in ms
  attempts: number;
  createdAt: number;
}

const OTP_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes strictly
const MAX_ATTEMPTS = 5;

// In-memory store
const pendingOtpMap = new Map<string, PendingSignupRegistration>();

// Persistent file path for resilience across Next.js dev server restarts
const OTP_STORE_FILE = path.join(process.cwd(), 'database', 'pending_otps.json');

/**
 * Strong password hashing using salted scrypt KDF.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Constant-time verification of password against stored scrypt hash.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  if (!password || !combinedHash || !combinedHash.includes(':')) return false;
  const [salt, storedHash] = combinedHash.split(':');
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const storedHashBuffer = Buffer.from(storedHash, 'hex');
  return crypto.timingSafeEqual(hashBuffer, storedHashBuffer);
}

function getStoreCandidates(): string[] {
  const candidates: string[] = [path.join(process.cwd(), 'database', 'pending_otps.json')];
  try {
    const tmpCandidate = path.join(os.tmpdir(), 'pending_otps.json');
    if (!candidates.includes(tmpCandidate)) {
      candidates.push(tmpCandidate);
    }
  } catch {}
  return candidates;
}

function loadOtpsFromDisk() {
  const candidates = getStoreCandidates();
  for (const storeFile of candidates) {
    try {
      if (fs.existsSync(storeFile)) {
        const data = fs.readFileSync(storeFile, 'utf-8');
        if (data && data.trim()) {
          const parsed: Record<string, any> = JSON.parse(data);
          const now = Date.now();
          const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
          for (const [email, record] of Object.entries(parsed)) {
            if (record && (record.expiresAt > now || (record.createdAt && record.createdAt + TWO_HOURS_MS > now))) {
              const existing = pendingOtpMap.get(email.toLowerCase());
              if (!existing || existing.createdAt <= (record.createdAt || 0)) {
                const passwordHash = record.passwordHash || (record.password ? hashPassword(record.password) : '');
                pendingOtpMap.set(email.toLowerCase(), {
                  email: record.email,
                  fullName: record.fullName,
                  passwordHash,
                  targetDegree: record.targetDegree || 'PhD',
                  code: record.code,
                  expiresAt: record.expiresAt,
                  attempts: record.attempts || 0,
                  createdAt: record.createdAt || now,
                });
              }
            }
          }
        }
      }
    } catch {
      // Continue to next candidate
    }
  }
}

function persistOtpsToDisk() {
  const candidates = getStoreCandidates();
  const obj: Record<string, PendingSignupRegistration> = {};
  const now = Date.now();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  pendingOtpMap.forEach((record, email) => {
    if (record.expiresAt > now || (record.createdAt && record.createdAt + TWO_HOURS_MS > now)) {
      obj[email] = {
        email: record.email,
        fullName: record.fullName,
        passwordHash: record.passwordHash,
        targetDegree: record.targetDegree,
        code: record.code,
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
      // Silently fall through to next candidate if read-only
    }
  }
}

// Initial load
loadOtpsFromDisk();

/**
 * Generates a cryptographically strong, completely unique 6-digit numeric verification code (100000 - 999999).
 */
export function generateUniqueOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Stores or updates a pending user registration with a new 15-minute OTP and hashed password.
 */
export function createPendingRegistration(params: {
  email: string;
  fullName: string;
  password: string;
  targetDegree?: string;
}): { code: string; expiresAt: number } {
  loadOtpsFromDisk();
  const normalizedEmail = params.email.trim().toLowerCase();
  const code = generateUniqueOtpCode();
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MS; // Exactly 15 minutes

  const record: PendingSignupRegistration = {
    email: normalizedEmail,
    fullName: params.fullName.trim(),
    passwordHash: hashPassword(params.password),
    targetDegree: params.targetDegree || 'PhD',
    code,
    expiresAt,
    attempts: 0,
    createdAt: now,
  };

  pendingOtpMap.set(normalizedEmail, record);
  persistOtpsToDisk();

  return { code, expiresAt };
}

/**
 * Retrieves the pending registration.
 * Keeps record available for 2 hours so users can click "Resend code" even if the 15-minute OTP expired.
 */
export function getPendingRegistration(email: string): PendingSignupRegistration | null {
  loadOtpsFromDisk();
  const normalizedEmail = email.trim().toLowerCase();
  const record = pendingOtpMap.get(normalizedEmail);
  if (!record) return null;

  // Keep pending registration for 2 hours for resending fresh OTP codes
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  if (Date.now() > record.createdAt + TWO_HOURS_MS) {
    pendingOtpMap.delete(normalizedEmail);
    persistOtpsToDisk();
    return null;
  }

  return record;
}

/**
 * Refreshes an existing pending registration with a newly generated OTP code,
 * resetting expiration to 15 minutes and attempts to 0, while keeping the
 * securely hashed password intact.
 */
export function refreshPendingRegistration(email: string): { code: string; expiresAt: number } | null {
  loadOtpsFromDisk();
  const normalizedEmail = email.trim().toLowerCase();
  const record = pendingOtpMap.get(normalizedEmail);
  if (!record) return null;

  const code = generateUniqueOtpCode();
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MS;

  record.code = code;
  record.expiresAt = expiresAt;
  record.attempts = 0;
  record.createdAt = now;

  pendingOtpMap.set(normalizedEmail, record);
  persistOtpsToDisk();

  return { code, expiresAt };
}


/**
 * Validates the entered OTP code.
 * Returns { valid: boolean, error?: string, registration?: PendingSignupRegistration }
 */
export function verifyPendingOtp(email: string, enteredCode: string): {
  valid: boolean;
  error?: string;
  isExpired?: boolean;
  registration?: PendingSignupRegistration;
} {
  loadOtpsFromDisk();
  const normalizedEmail = email.trim().toLowerCase();
  const record = pendingOtpMap.get(normalizedEmail);

  if (!record) {
    return {
      valid: false,
      error: 'No pending registration found or code has expired. Please sign up again.',
      isExpired: true,
    };
  }

  // Check 15-minute expiration
  if (Date.now() > record.expiresAt) {
    pendingOtpMap.delete(normalizedEmail);
    persistOtpsToDisk();
    return {
      valid: false,
      error: 'Verification code has expired (15 minutes limit exceeded). Please request a new code.',
      isExpired: true,
    };
  }

  // Check brute force attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    pendingOtpMap.delete(normalizedEmail);
    persistOtpsToDisk();
    return {
      valid: false,
      error: 'Too many incorrect attempts. For security, please sign up again to receive a fresh code.',
      isExpired: true,
    };
  }

  const cleanEntered = enteredCode.trim().replace(/\D/g, '');
  const codeBuf = Buffer.from(record.code);
  const enteredBuf = Buffer.from(cleanEntered);
  const isMatch =
    codeBuf.length === enteredBuf.length &&
    crypto.timingSafeEqual(codeBuf, enteredBuf);

  if (!isMatch) {
    record.attempts += 1;
    persistOtpsToDisk();
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      valid: false,
      error: `Wrong verification code. Please check your email and try again. (${remaining} ${
        remaining === 1 ? 'attempt' : 'attempts'
      } left)`,
    };
  }

  // Code is valid! Delete from pending store
  pendingOtpMap.delete(normalizedEmail);
  persistOtpsToDisk();

  return {
    valid: true,
    registration: record,
  };
}

/**
 * Clears pending OTP for an email.
 */
export function clearPendingRegistration(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  pendingOtpMap.delete(normalizedEmail);
  persistOtpsToDisk();
}
