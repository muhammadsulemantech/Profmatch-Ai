import test from 'node:test';
import assert from 'node:assert/strict';
import { saveUserProfile } from '../lib/services/db-service.ts';
import { updateUser } from '../lib/services/user-service.ts';
import { checkAndIncrementQuota } from '../lib/services/quota-service.ts';
import { updateLiveServerPlans, getPlanConfig } from '../lib/services/usage-service.ts';

test('AutoPilot Quota & Dynamic Plan Entitlement Suite', async (t) => {
  await t.test('1. Free tier has 0 AutoPilot emails and is strictly locked (UPGRADE_REQUIRED)', async () => {
    const userId = 'user_free_test_' + Date.now();
    await saveUserProfile({
      id: userId,
      email: `${userId}@test.com`,
      full_name: 'Free Student',
      role: 'USER',
    });

    const result = checkAndIncrementQuota(userId, 'autopilot', { increment: true });
    assert.equal(result.allowed, false);
    assert.equal(result.error, 'UPGRADE_REQUIRED');
  });

  await t.test('2. Admin sets PRO AutoPilot cap to 20: user cannot exceed 20', async () => {
    const userId = 'user_pro_test_' + Date.now();
    await saveUserProfile({
      id: userId,
      email: `${userId}@test.com`,
      full_name: 'Pro Student',
      role: 'USER',
    });
    await updateUser({ userId, planTier: 'PRO' });

    // Ensure PRO has cap of 20
    updateLiveServerPlans([
      {
        tier: 'PRO',
        name: 'Pro Researcher',
        autopilotBatchLimit: 20,
        draftsLimit: 150,
        searchesLimit: 250,
      },
    ]);

    const proCfg = getPlanConfig('PRO');
    assert.equal(proCfg.autopilotBatchLimit, 20);

    // Simulate 20 successful email dispatches
    for (let i = 1; i <= 20; i++) {
      const res = checkAndIncrementQuota(userId, 'autopilot', { increment: true });
      assert.equal(res.allowed, true, `Call ${i} should be allowed`);
      assert.equal(res.used, i);
      assert.equal(res.remaining, 20 - i);
    }

    // Call 21 (and any further attempt) must be strictly blocked with QUOTA_EXCEEDED
    const blockedRes = checkAndIncrementQuota(userId, 'autopilot', { increment: true });
    assert.equal(blockedRes.allowed, false);
    assert.equal(blockedRes.error, 'QUOTA_EXCEEDED');
    assert.equal(blockedRes.limit, 20);
    assert.equal(blockedRes.used, 20);
    assert.equal(blockedRes.remaining, 0);
  });

  await t.test('3. Dynamic admin update to custom cap (e.g. 15) is enforced dynamically without allowing 100 emails', async () => {
    const userId = 'user_custom_test_' + Date.now();
    await saveUserProfile({
      id: userId,
      email: `${userId}@test.com`,
      full_name: 'Custom Cap Student',
      role: 'USER',
    });
    await updateUser({ userId, planTier: 'PRO' });

    // Update dynamically via admin plan update
    updateLiveServerPlans([
      {
        tier: 'PRO',
        name: 'Pro Researcher',
        autopilotBatchLimit: 15,
        draftsLimit: 100,
        searchesLimit: 200,
      },
    ]);

    for (let i = 1; i <= 15; i++) {
      const res = checkAndIncrementQuota(userId, 'autopilot', { increment: true });
      assert.equal(res.allowed, true);
    }

    const blocked = checkAndIncrementQuota(userId, 'autopilot', { increment: true });
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.error, 'QUOTA_EXCEEDED');
    assert.equal(blocked.limit, 15);
  });
});
