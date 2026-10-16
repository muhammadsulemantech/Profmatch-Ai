import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
  RATE_LIMIT_PRESETS,
} from '../lib/security/rate-limit.ts';

test('Comprehensive Security & Rate Limiting Suite', async (t) => {
  await t.test('1. Core Rate Limiter tracks limits, remaining counts, and blocks excess attempts', () => {
    const key = `user_ip_${Date.now()}`;
    const options = { limit: 3, windowMs: 10000 };

    const res1 = checkRateLimit(key, options);
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.remaining, 2);
    assert.strictEqual(res1.limit, 3);

    const res2 = checkRateLimit(key, options);
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.remaining, 1);

    const res3 = checkRateLimit(key, options);
    assert.strictEqual(res3.success, true);
    assert.strictEqual(res3.remaining, 0);

    // 4th request must fail
    const res4 = checkRateLimit(key, options);
    assert.strictEqual(res4.success, false);
    assert.strictEqual(res4.remaining, 0);
    assert.ok(res4.reset > Date.now());
  });

  await t.test('2. getClientIp safely extracts leftmost client IP from complex header chains', () => {
    // Multi-proxy X-Forwarded-For chain
    const req1 = {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      }),
    };
    assert.strictEqual(getClientIp(req1), '203.0.113.195');

    // X-Real-IP fallback
    const req2 = {
      headers: new Headers({
        'x-real-ip': '198.51.100.42',
      }),
    };
    assert.strictEqual(getClientIp(req2), '198.51.100.42');

    // Cloudflare Connecting IP fallback
    const req3 = {
      headers: new Headers({
        'cf-connecting-ip': '192.0.2.1',
      }),
    };
    assert.strictEqual(getClientIp(req3), '192.0.2.1');

    // Default loopback fallback
    const req4 = {
      headers: new Headers(),
    };
    assert.strictEqual(getClientIp(req4), '127.0.0.1');
  });

  await t.test('3. rateLimitResponse constructs standard 429 response with RFC headers', async () => {
    const resetTime = Date.now() + 60000;
    const response = rateLimitResponse(resetTime, 50, 'Rate limit exceeded');

    assert.strictEqual(response.status, 429);
    assert.strictEqual(response.headers.get('Content-Type'), 'application/json');
    assert.strictEqual(response.headers.get('X-RateLimit-Limit'), '50');
    assert.strictEqual(response.headers.get('X-RateLimit-Remaining'), '0');
    assert.ok(response.headers.get('Retry-After'));
    assert.ok(response.headers.get('X-RateLimit-Reset'));

    const body = await response.json();
    assert.strictEqual(body.error, 'Rate limit exceeded');
    assert.ok(body.retryAfterSeconds > 0);
  });

  await t.test('4. RATE_LIMIT_PRESETS defines calibrated thresholds for all critical surfaces', () => {
    assert.ok(RATE_LIMIT_PRESETS.GLOBAL_API.limit >= 60);
    assert.ok(RATE_LIMIT_PRESETS.AUTH.limit <= 30);
    assert.ok(RATE_LIMIT_PRESETS.AUTH_STRICT.limit <= 10);
    assert.ok(RATE_LIMIT_PRESETS.CV_PARSE.limit <= 20);
    assert.ok(RATE_LIMIT_PRESETS.AI_COMPUTE.limit <= 30);
    assert.ok(RATE_LIMIT_PRESETS.CHECKOUT.limit <= 10);
  });

  await t.test('5. Static Code Audit: middleware.ts enforces global API rate limiting', () => {
    const mwContent = fs.readFileSync(path.resolve(process.cwd(), 'middleware.ts'), 'utf8');
    assert.match(mwContent, /checkRateLimit/, 'middleware.ts must call checkRateLimit');
    assert.match(mwContent, /getClientIp/, 'middleware.ts must extract client IP safely');
    assert.match(mwContent, /status:\s*429/, 'middleware.ts must return 429 status on limit breach');
    assert.match(mwContent, /X-RateLimit-Limit/, 'middleware.ts must set X-RateLimit-Limit');
  });

  await t.test('6. Static Code Audit: Heavy & critical endpoints enforce route-level rate limiting', () => {
    const criticalRoutes = [
      'app/api/profile/parse-cv/route.ts',
      'app/api/matches/analyze/route.ts',
      'app/api/outreach/create-draft/route.ts',
      'app/api/autopilot/discover-next/route.ts',
      'app/api/autopilot/draft-grounded/route.ts',
      'app/api/checkout/submit/route.ts',
      'app/api/auth/login/route.ts',
      'app/api/auth/signup/route.ts',
      'app/api/auth/signup/send-otp/route.ts',
      'app/api/auth/signup/verify-otp/route.ts',
      'app/api/auth/forgot-password/route.ts',
      'app/api/auth/reset-password/route.ts',
      'app/api/professors/search/route.ts',
      'app/api/email/send/route.ts',
    ];

    for (const routePath of criticalRoutes) {
      const fullPath = path.resolve(process.cwd(), routePath);
      assert.ok(fs.existsSync(fullPath), `Route file must exist: ${routePath}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.match(
        content,
        /checkRateLimit/,
        `Route ${routePath} must invoke checkRateLimit to mitigate DDoS/brute-force abuse`
      );
    }
  });
});
