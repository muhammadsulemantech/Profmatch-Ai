import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_SECRET ||
    process.env.ADMIN_SECRET_PASSPHRASE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'profmatch-default-dev-secret-key-min-32-chars!!';

  // Derive a consistent 32-byte (256-bit) key using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext string (e.g. OAuth access/refresh token) using AES-256-GCM.
 * Output format: "enc:iv:authTag:ciphertext" (hex encoded)
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted token using AES-256-GCM.
 * Safely handles unencrypted legacy tokens for backward compatibility during migration.
 */
export function decryptToken(cipherText: string): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:')) {
    // Legacy unencrypted token
    return cipherText;
  }

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 4) return '';

    const [, ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('[TOKEN DECRYPTION ERROR] Failed to decrypt token:', err);
    return '';
  }
}
