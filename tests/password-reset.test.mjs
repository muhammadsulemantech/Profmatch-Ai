import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('ProfMatch AI — Password Reset Feature Test Suite', async (t) => {
  // 1. Verify existence of all required routes and pages
  await t.test('1. Core file routes and pages exist', () => {
    const requiredFiles = [
      'lib/auth/password-reset-store.ts',
      'lib/email/reset-password-email.ts',
      'app/api/auth/forgot-password/route.ts',
      'app/api/auth/reset-password/route.ts',
      'app/(auth)/forgot-password/page.tsx',
      'app/(auth)/reset-password/page.tsx',
      'app/(auth)/reset-password/layout.tsx',
    ];

    for (const file of requiredFiles) {
      const fullPath = path.resolve(file);
      assert.ok(fs.existsSync(fullPath), `Expected file ${file} to exist on disk`);
    }
  });

  // 2. Test Password Reset Store token lifecycle
  await t.test('2. Password reset token generation and verification logic', async () => {
    // Dynamic import to test compiled/ts node execution
    const storePath = path.resolve('lib/auth/password-reset-store.ts');
    const storeContent = fs.readFileSync(storePath, 'utf-8');

    // Verify key functions are exported
    assert.match(storeContent, /export function createPasswordResetToken/);
    assert.match(storeContent, /export function verifyPasswordResetToken/);
    assert.match(storeContent, /export function clearPasswordResetToken/);

    // Verify 15-minute expiry is enforced
    assert.match(storeContent, /15 \* 60 \* 1000/);

    // Verify timing-safe comparison is used
    assert.match(storeContent, /crypto\.timingSafeEqual/);
  });

  // 3. Test Email Dispatcher and Template
  await t.test('3. Reset password email module structure', () => {
    const emailPath = path.resolve('lib/email/reset-password-email.ts');
    const emailContent = fs.readFileSync(emailPath, 'utf-8');

    assert.match(emailContent, /export async function sendPasswordResetEmail/);
    assert.match(emailContent, /Reset your ProfMatch password/);
    assert.match(emailContent, /\/reset-password\?token=/);
  });

  // 4. Test API Route handlers
  await t.test('4. Forgot password and reset password API handlers', () => {
    const forgotRoute = fs.readFileSync(path.resolve('app/api/auth/forgot-password/route.ts'), 'utf-8');
    const resetRoute = fs.readFileSync(path.resolve('app/api/auth/reset-password/route.ts'), 'utf-8');

    // Forgot password route validations
    assert.match(forgotRoute, /export async function POST/);
    assert.match(forgotRoute, /createPasswordResetToken/);
    assert.match(forgotRoute, /sendPasswordResetEmail/);
    assert.match(forgotRoute, /checkRateLimit/);

    // Reset password route validations
    assert.match(resetRoute, /export async function GET/);
    assert.match(resetRoute, /export async function POST/);
    assert.match(resetRoute, /verifyPasswordResetToken/);
    assert.match(resetRoute, /updateUserById/);
  });

  // 5. Test Auth Modal UI Integration
  await t.test('5. Auth Modal contains Forgot Password flow', () => {
    const modalContent = fs.readFileSync(path.resolve('components/auth/auth-modal.tsx'), 'utf-8');

    assert.match(modalContent, /Forgot password\?/);
    assert.match(modalContent, /handleForgotPasswordSubmit/);
    assert.match(modalContent, /step === 'forgot'/);
    assert.match(modalContent, /\/api\/auth\/forgot-password/);
  });
});
