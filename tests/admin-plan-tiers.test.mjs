import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ACADEMIC_PLANS } from '../lib/services/usage-service.ts';

test('Task 1.2: Admin Plan Tier Truthfulness Suite', async (t) => {
  const usersRoutePath = path.resolve('app/api/admin/users/route.ts');
  const mockDbPath = path.resolve('lib/supabase/mock-db.ts');

  assert.ok(fs.existsSync(usersRoutePath), 'admin/users/route.ts must exist');
  const routeCode = fs.readFileSync(usersRoutePath, 'utf8');
  const mockDbCode = fs.readFileSync(mockDbPath, 'utf8');

  await t.test('1. Fake ELITE default assignment for admins is eliminated from admin/users/route.ts', () => {
    assert.equal(
      routeCode.includes("planTier = 'ELITE'"),
      false,
      'admin/users/route.ts must not fabricate planTier = ELITE for admins'
    );
    assert.equal(
      routeCode.includes("u.role === 'ADMIN' && planTier === 'FREE'"),
      false,
      'admin/users/route.ts must not branch on admin role to fabricate subscriptions'
    );
  });

  await t.test('2. Fake ELITE default assignment is eliminated from mock-db.ts', () => {
    assert.equal(
      mockDbCode.includes("isAdmin ? 'ELITE' : 'FREE'"),
      false,
      'mock-db.ts must not grant ELITE subscription by default based on isAdmin flag'
    );
  });

  await t.test('3. Plan tiers are strictly aligned with ACADEMIC_PLANS', () => {
    const validTiers = Object.keys(ACADEMIC_PLANS);
    assert.ok(validTiers.includes('FREE'), 'Must include FREE');
    assert.ok(validTiers.includes('STARTER'), 'Must include STARTER');
    assert.ok(validTiers.includes('PRO'), 'Must include PRO');
    assert.ok(validTiers.includes('ELITE'), 'Must include ELITE');

    assert.ok(
      routeCode.includes('ACADEMIC_PLANS'),
      'admin/users/route.ts must import and reference ACADEMIC_PLANS for validation'
    );
  });
});
