import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Task 1.3: Real Supabase Auth Email Confirmation Suite', async (t) => {
  const verifyOtpPath = path.resolve('app/api/auth/signup/verify-otp/route.ts');
  const callbackPath = path.resolve('app/api/auth/callback/route.ts');

  assert.ok(fs.existsSync(verifyOtpPath), 'verify-otp route must exist');
  assert.ok(fs.existsSync(callbackPath), 'auth/callback route must exist');

  const verifyOtpCode = fs.readFileSync(verifyOtpPath, 'utf8');
  const callbackCode = fs.readFileSync(callbackPath, 'utf8');

  await t.test('1. verify-otp explicitly confirms user email in Supabase Auth', () => {
    assert.match(
      verifyOtpCode,
      /updateUserById\([^,]+,\s*\{\s*email_confirm:\s*true\s*\}\)/,
      'verify-otp must mark email_confirm true in Supabase Auth'
    );
  });

  await t.test('2. verify-otp persists user profile and subscription through db-service', () => {
    assert.match(
      verifyOtpCode,
      /saveUserProfile/,
      'verify-otp must call saveUserProfile'
    );
    assert.match(
      verifyOtpCode,
      /saveUserSubscription/,
      'verify-otp must call saveUserSubscription'
    );
  });

  await t.test('3. app/api/auth/callback handles code exchange and OTP verification', () => {
    assert.match(
      callbackCode,
      /exchangeCodeForSession/,
      'callback route must support PKCE code exchange'
    );
    assert.match(
      callbackCode,
      /verifyOtp/,
      'callback route must support email token_hash verifyOtp'
    );
    assert.match(
      callbackCode,
      /validateSafeRedirect/,
      'callback route must protect against open redirect attacks'
    );
  });
});
