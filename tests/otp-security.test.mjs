import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  hashPassword,
  verifyPassword,
  createPendingRegistration,
  getPendingRegistration,
  refreshPendingRegistration,
  verifyPendingOtp,
  clearPendingRegistration,
} from '../lib/auth/otp-store.ts';

test('Task 0.7: Plaintext OTP and Password Security Suite', async (t) => {
  await t.test('1. hashPassword generates salted scrypt hash and verifyPassword validates correctly', () => {
    const rawPass = 'SecretP@ssw0rd!123';
    const hashed = hashPassword(rawPass);

    // Format must be salt:hash
    assert.ok(hashed.includes(':'), 'Hashed password must contain salt:hash delimiter');
    const [salt, scryptHash] = hashed.split(':');
    assert.strictEqual(salt.length, 32, 'Salt should be 16 bytes hex (32 chars)');
    assert.strictEqual(scryptHash.length, 128, 'Scrypt hash should be 64 bytes hex (128 chars)');

    // Different salts for identical passwords
    const hashed2 = hashPassword(rawPass);
    assert.notStrictEqual(hashed, hashed2, 'Hashes of identical passwords must have unique salts');

    // Validation
    assert.strictEqual(verifyPassword(rawPass, hashed), true, 'Correct password verifies successfully');
    assert.strictEqual(verifyPassword('WrongPassword', hashed), false, 'Incorrect password fails verification');
    assert.strictEqual(verifyPassword('', hashed), false, 'Empty password fails verification');
  });

  await t.test('2. createPendingRegistration stores scrypt hash and never stores plaintext password', () => {
    const testEmail = `test_security_${Date.now()}@example.com`;
    const testPass = 'UltraSecure123!';
    const res = createPendingRegistration({
      email: testEmail,
      fullName: 'Alice Researcher',
      password: testPass,
      targetDegree: 'PhD',
    });

    assert.ok(res.code && res.code.length === 6, 'Generated code must be 6 digits');
    const reg = getPendingRegistration(testEmail);
    assert.ok(reg, 'Pending registration must exist');
    assert.strictEqual(reg.password, undefined, 'Plaintext password field must not exist on record');
    assert.ok(reg.passwordHash, 'passwordHash field must exist');
    assert.notStrictEqual(reg.passwordHash, testPass, 'passwordHash must not equal plaintext password');
    assert.strictEqual(verifyPassword(testPass, reg.passwordHash), true, 'Stored hash must verify against password');

    clearPendingRegistration(testEmail);
  });

  await t.test('3. refreshPendingRegistration preserves password hash and updates OTP', () => {
    const testEmail = `test_refresh_${Date.now()}@example.com`;
    const testPass = 'RefreshSecret999!';
    const initial = createPendingRegistration({
      email: testEmail,
      fullName: 'Bob Scholar',
      password: testPass,
      targetDegree: 'Master',
    });

    const initialReg = getPendingRegistration(testEmail);
    const initialHash = initialReg.passwordHash;

    const refreshed = refreshPendingRegistration(testEmail);
    assert.ok(refreshed, 'refreshPendingRegistration should return code and expiresAt');

    const updatedReg = getPendingRegistration(testEmail);
    assert.strictEqual(updatedReg.passwordHash, initialHash, 'passwordHash must remain intact and unchanged');
    assert.strictEqual(verifyPassword(testPass, updatedReg.passwordHash), true, 'Password remains verifiable');
    assert.strictEqual(updatedReg.attempts, 0, 'Attempts must be reset');

    clearPendingRegistration(testEmail);
  });

  await t.test('4. Route files do not log plaintext OTP or passwords', () => {
    const sendOtpPath = path.join(process.cwd(), 'app', 'api', 'auth', 'signup', 'send-otp', 'route.ts');
    const resendOtpPath = path.join(process.cwd(), 'app', 'api', 'auth', 'signup', 'resend-otp', 'route.ts');

    const sendOtpCode = fs.readFileSync(sendOtpPath, 'utf-8');
    const resendOtpCode = fs.readFileSync(resendOtpPath, 'utf-8');

    // Neither file should log `${code}` or `password` in console.log/console.info/console.error
    assert.ok(!sendOtpCode.includes('${code}'), 'send-otp route must not interpolate OTP code in console logging');
    assert.ok(!resendOtpCode.includes('${code}'), 'resend-otp route must not interpolate OTP code in console logging');

    assert.ok(!sendOtpCode.includes('console.log(`[SIGNUP OTP GENERATED] Email: ${email} | Code: ${code}'), 'Old plaintext OTP log removed');
    assert.ok(!resendOtpCode.includes('console.log(`[SIGNUP OTP RESENT] Email: ${email} | New Code: ${code}'), 'Old plaintext OTP log removed');
  });
});
