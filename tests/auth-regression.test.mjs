import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

describe('Tier 0.2 Authentication Security Regression Suite', () => {
  test('1. Arbitrary/garbage profmatch_session cookie is treated as unauthenticated (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: 'profmatch_session=garbage_fake_session_token_xyz',
      },
    });

    assert.equal(res.status, 401, 'Expected 401 for garbage session cookie');
    const data = await res.json();
    assert.equal(data.authenticated, false);
    assert.equal(data.user, null);
  });

  test('2. Forged admin cookie (profmatch_role=ADMIN) is rejected with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: 'profmatch_role=ADMIN; profmatch_session=admin_elevated_999999',
      },
    });

    assert.equal(res.status, 401, 'Expected 401 for forged admin role cookie');
    const data = await res.json();
    assert.equal(data.authenticated, false);
    assert.equal(data.user, null);
  });

  test('3. Forged profmatch_user JSON cookie is rejected with 401', async () => {
    const fakeAdminPayload = encodeURIComponent(
      JSON.stringify({
        id: 'usr_admin_fake',
        email: 'admin@profmatch.ai',
        role: 'ADMIN',
      })
    );

    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: `profmatch_user=${fakeAdminPayload}`,
      },
    });

    assert.equal(res.status, 401, 'Expected 401 for forged profmatch_user cookie');
    const data = await res.json();
    assert.equal(data.authenticated, false);
    assert.equal(data.user, null);
  });

  test('4. Login with wrong password fails with 401 and does not forge mock user', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        password: 'wrong_password_attempt',
      }),
    });

    assert.equal(res.status, 401, 'Expected 401 for incorrect password');
    const data = await res.json();
    assert.equal(data.success, false);

    // Verify response does not set any legacy profmatch_* cookies
    const setCookie = res.headers.get('set-cookie') || '';
    assert.ok(!setCookie.includes('profmatch_session='), 'Must not set profmatch_session');
    assert.ok(!setCookie.includes('profmatch_role='), 'Must not set profmatch_role');
    assert.ok(!setCookie.includes('profmatch_user='), 'Must not set profmatch_user');
  });

  test('5. Login with empty password fails with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        password: '',
      }),
    });

    assert.equal(res.status, 400, 'Expected 400 for empty password');
    const data = await res.json();
    assert.equal(data.success, false);
  });
});
