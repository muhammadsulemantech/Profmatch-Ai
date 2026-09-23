import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

describe('Tier 0.3 Admin Authorization Security Suite', () => {
  const adminEndpoints = [
    { name: 'payment-methods (GET)', url: '/api/admin/payment-methods', method: 'GET' },
    { name: 'payment-methods (POST)', url: '/api/admin/payment-methods', method: 'POST', body: { name: 'Test' } },
    { name: 'payment-methods (PUT)', url: '/api/admin/payment-methods', method: 'PUT', body: { id: 'pm_1' } },
    { name: 'payment-methods (DELETE)', url: '/api/admin/payment-methods?id=pm_1', method: 'DELETE' },
    { name: 'payments (GET)', url: '/api/admin/payments', method: 'GET' },
    { name: 'payments (PUT)', url: '/api/admin/payments', method: 'PUT', body: { paymentId: 'p_1', action: 'APPROVE' } },
    { name: 'feature-flags (GET)', url: '/api/admin/feature-flags', method: 'GET' },
    { name: 'feature-flags (PUT)', url: '/api/admin/feature-flags', method: 'PUT', body: { flagKey: 'test', enabled: true } },
    { name: 'audit-logs (GET)', url: '/api/admin/audit-logs', method: 'GET' },
    { name: 'audit-logs (POST)', url: '/api/admin/audit-logs', method: 'POST', body: { action: 'FORGED_LOG' } },
    { name: 'users (GET)', url: '/api/admin/users', method: 'GET' },
    { name: 'users (PUT)', url: '/api/admin/users', method: 'PUT', body: { userId: 'usr_1', updates: {} } },
    { name: 'settings (GET)', url: '/api/admin/settings', method: 'GET' },
    { name: 'settings (PUT)', url: '/api/admin/settings', method: 'PUT', body: { site_name: 'Hacked' } },
    { name: 'content (GET)', url: '/api/admin/content', method: 'GET' },
    { name: 'content (PUT)', url: '/api/admin/content', method: 'PUT', body: { sectionKey: 'hero', title: 'Hacked' } },
  ];

  for (const ep of adminEndpoints) {
    test(`Unauthenticated request to ${ep.name} returns 401`, async () => {
      const options = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (ep.body) options.body = JSON.stringify(ep.body);

      const res = await fetch(`${BASE_URL}${ep.url}`, options);
      assert.equal(
        res.status,
        401,
        `Expected 401 for unauthenticated ${ep.method} ${ep.url}, got ${res.status}`
      );
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test(`Forged headers & cookies on ${ep.name} (x-admin-role, profmatch_role=ADMIN) are rejected with 401`, async () => {
      const options = {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'ADMIN',
          Cookie: 'profmatch_role=ADMIN; profmatch_session=admin_elevated_123',
        },
      };
      if (ep.body) options.body = JSON.stringify(ep.body);

      const res = await fetch(`${BASE_URL}${ep.url}`, options);
      assert.equal(
        res.status,
        401,
        `Expected 401 for forged-header ${ep.method} ${ep.url}, got ${res.status}`
      );
      const data = await res.json();
      assert.equal(data.success, false);
    });
  }
});
