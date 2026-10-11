import test from 'node:test';
import assert from 'node:assert/strict';
import { saveUserProfile, getUserSubscription, getUserPlanTier } from '../lib/services/db-service.ts';
import { updateUser, getEnrichedUsers } from '../lib/services/user-service.ts';
import { getSearchUsage, isCountryUnlockedForTier, getPlanConfig } from '../lib/services/usage-service.ts';
import { checkAndIncrementQuota } from '../lib/services/quota-service.ts';

test('Universal Subscription & Entitlements Engine Suite (All Users)', async (t) => {
  await t.test('1. Any new user starts at Free tier with 3 searches and 2 preview countries', async () => {
    const randomId = 'usr_any_new_' + Math.random().toString(36).substring(2, 8);
    await saveUserProfile({
      id: randomId,
      email: `${randomId}@example.com`,
      full_name: 'Random Student',
      role: 'USER',
    });

    const tier = await getUserPlanTier(randomId);
    assert.equal(tier, 'FREE');

    const usage = getSearchUsage(randomId, tier);
    assert.equal(usage.tier, 'FREE');
    assert.equal(usage.limit, 3);
    assert.equal(isCountryUnlockedForTier(tier, 'Pakistan'), true);
    assert.equal(isCountryUnlockedForTier(tier, 'United States'), false);
  });

  await t.test('2. Admin assigns PRO to any user: gets exactly 30 days, 250 searches, 45+ countries unlocked', async () => {
    const randomId = 'usr_pro_student_' + Math.random().toString(36).substring(2, 8);
    const beforeNow = Date.now();
    await saveUserProfile({
      id: randomId,
      email: `${randomId}@example.com`,
      full_name: 'Pro Candidate',
      role: 'USER',
    });

    // Admin updates user plan
    await updateUser({ userId: randomId, planTier: 'PRO' });

    const tier = await getUserPlanTier(randomId);
    assert.equal(tier, 'PRO');

    const sub = await getUserSubscription(randomId);
    assert.ok(sub);
    assert.equal(sub.plan_type, 'PRO');
    assert.equal(sub.status, 'active');

    // Exactly 30 days check
    const expiryMs = new Date(sub.current_period_end).getTime();
    const expectedMin = beforeNow + 29 * 86400000;
    const expectedMax = Date.now() + 31 * 86400000;
    assert.ok(expiryMs >= expectedMin && expiryMs <= expectedMax);

    // Search usage & countries
    const usage = getSearchUsage(randomId, tier);
    assert.equal(usage.tier, 'PRO');
    assert.equal(usage.limit, 250);
    assert.equal(isCountryUnlockedForTier(tier, 'United States'), true);
    assert.equal(isCountryUnlockedForTier(tier, 'United Kingdom'), true);
    assert.equal(isCountryUnlockedForTier(tier, 'Canada'), true);
  });

  await t.test('3. Admin assigns ELITE to any user: gets 100% worldwide and unlimited searches', async () => {
    const randomId = 'usr_elite_student_' + Math.random().toString(36).substring(2, 8);
    await saveUserProfile({
      id: randomId,
      email: `${randomId}@example.com`,
      full_name: 'Elite Scholar',
      role: 'USER',
    });

    await updateUser({ userId: randomId, planTier: 'ELITE' });

    const tier = await getUserPlanTier(randomId);
    assert.equal(tier, 'ELITE');

    const usage = getSearchUsage(randomId, tier);
    assert.equal(usage.tier, 'ELITE');
    assert.ok(usage.limit >= 999999);
    assert.equal(isCountryUnlockedForTier(tier, 'Global (All Countries)'), true);
    assert.equal(isCountryUnlockedForTier(tier, 'Japan'), true);
  });

  await t.test('4. Existing paid user is NEVER downgraded to FREE during login / session sync', async () => {
    const randomId = 'usr_keep_paid_' + Math.random().toString(36).substring(2, 8);
    await saveUserProfile({
      id: randomId,
      email: `${randomId}@example.com`,
      full_name: 'Persistent Paid User',
      role: 'USER',
    });
    await updateUser({ userId: randomId, planTier: 'PRO' });

    // Simulate accidental callback / login save with FREE
    const { saveUserSubscription } = await import('../lib/services/db-service.ts');
    const attemptedDowngrade = await saveUserSubscription({
      user_id: randomId,
      plan_type: 'FREE',
      status: 'active',
    });

    // Plan must still be PRO
    assert.equal(attemptedDowngrade.plan_type, 'PRO');
    const tier = await getUserPlanTier(randomId);
    assert.equal(tier, 'PRO');
  });

  await t.test('5. Admin explicit downgrade to FREE restores free limits properly', async () => {
    const randomId = 'usr_downgrade_' + Math.random().toString(36).substring(2, 8);
    await saveUserProfile({
      id: randomId,
      email: `${randomId}@example.com`,
      full_name: 'To Downgrade',
      role: 'USER',
    });
    await updateUser({ userId: randomId, planTier: 'PRO' });
    assert.equal(await getUserPlanTier(randomId), 'PRO');

    // Admin downgrades user
    await updateUser({ userId: randomId, planTier: 'FREE' });
    const tier = await getUserPlanTier(randomId);
    assert.equal(tier, 'FREE');

    const usage = getSearchUsage(randomId, tier);
    assert.equal(usage.tier, 'FREE');
    assert.equal(usage.limit, 3);
  });
});
