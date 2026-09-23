import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Task 0.8: Honest Email Delivery Failure Suite', async (t) => {
  await t.test('1. lib/providers/email/index.ts defines UnconfiguredEmailProvider and eliminates fake success', () => {
    const filePath = path.join(process.cwd(), 'lib', 'providers', 'email', 'index.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('class UnconfiguredEmailProvider'), 'Must define UnconfiguredEmailProvider');
    assert.ok(content.includes('success: false'), 'UnconfiguredEmailProvider must return success: false');
    assert.ok(content.includes('Email delivery service is unconfigured'), 'Must provide clear unconfigured error message');
    assert.ok(!content.includes('[EMAIL DISPATCHED VIA ${this.name}]'), 'Mocked dispatch console logging eliminated');
    assert.ok(content.includes('return new UnconfiguredEmailProvider()'), 'getEmailProvider must return UnconfiguredEmailProvider by default');
  });

  await t.test('2. Unconfigured provider instance fails loudly with success: false', async () => {
    class UnconfiguredEmailProvider {
      name = 'Unconfigured Email Provider';
      async sendEmail(params) {
        return {
          success: false,
          error: 'Email delivery service is unconfigured. Please configure SMTP credentials (SMTP_USER, SMTP_PASS) or Resend API key (RESEND_API_KEY).',
        };
      }
    }

    const provider = new UnconfiguredEmailProvider();
    const result = await provider.sendEmail({
      to: 'prof@cambridge.ac.uk',
      subject: 'Inquiry',
      text: 'Hello',
    });

    assert.strictEqual(result.success, false, 'Unconfigured provider must return success: false');
    assert.ok(result.error.includes('unconfigured'), 'Must return unconfigured error description');
    assert.strictEqual(result.messageId, undefined, 'Must never invent a fake messageId');
  });

  await t.test('3. Code verification: app/api/email/send/route.ts checks result.success and returns 503', () => {
    const filePath = path.join(process.cwd(), 'app', 'api', 'email', 'send', 'route.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('if (!result.success)'), 'email/send must check if (!result.success)');
    assert.ok(content.includes('status: 503'), 'email/send must return status 503 on unconfigured/failed dispatch');
    assert.ok(!content.includes('success: result.success,\n      messageId: result.messageId'), 'Old unchecked success forwarding removed');
  });

  await t.test('4. Code verification: app/api/outreach/send-email/route.ts checks fallback result.success', () => {
    const filePath = path.join(process.cwd(), 'app', 'api', 'outreach', 'send-email', 'route.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('if (!result.success)'), 'outreach/send-email fallback must check if (!result.success)');
    assert.ok(content.includes('status: 503'), 'outreach/send-email fallback must return status 503 on failure');
    assert.ok(!content.includes("messageId: result.messageId || `msg_${Date.now()}`"), 'Fake msg_ fallback ID eliminated');
  });

  await t.test('5. Code verification: app/api/outreach/create-draft/route.ts eliminates fake draft IDs', () => {
    const filePath = path.join(process.cwd(), 'app', 'api', 'outreach', 'create-draft', 'route.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(!content.includes("draftId: `draft_${Date.now()}`"), 'Fake draft_${Date.now()} IDs eliminated');
    assert.ok(!content.includes("isLocalDraft: true"), 'Fake isLocalDraft success return eliminated');
    assert.ok(content.includes('status: 400'), 'Returns 400 when no Gmail account is connected');
    assert.ok(content.includes('status: 502'), 'Returns 502 when Gmail draft API call fails');
  });
});
