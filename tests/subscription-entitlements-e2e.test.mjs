import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUserProfile,
  saveUserProfile,
  getUserSubscription,
  saveUserSubscription,
  getUserPlanTier,
  getUsageRecord,
  incrementUsage,
} from '../lib/services/db-service.ts';
import {
  getEnrichedUsers,
  updateUser,
} from '../lib/services/user-service.ts';
import {
  checkAndIncrementQuota,
} from '../lib/services/quota-service.ts';
import {
  ACADEMIC_PLANS,
  getPlanConfig,
  isCountryUnlockedForTier,
} from '../lib/services/usage-service.ts';
import { mockDb } from '../lib/supabase/mock-db.ts';

test('End-to-End Comprehensive Subscription & Entitlements Suite', async (t) => {
  const testUserId = `usr_test_e2e_${Date.now()}`;
  const testUserEmail = `test.applicant.${Date.now()}@example.com`;

  await t.test('1. New user registration defaults to Free Explorer tier', async () => {
    await saveUserProfile({
      id: testUserId,
      email: testUserEmail,
      full_name: 'Test Candidate',
      role: 'USER',
    });

    const tier = await getUserPlanTier(testUserId);
    assert.equal(tier, 'FREE', 'New user must default to FREE tier');

    const config = getPlanConfig(tier);
    assert.equal(config.tier, 'FREE');
    assert.equal(config.searchesLimit, 3);
    assert.equal(config.draftsLimit, 2);
    assert.equal(config.autopilotBatchLimit, 0);
  });

  await t.test('2. Free user country restrictions & quota enforcement', async () => {
    // US is not allowed on FREE tier
    assert.equal(isCountryUnlockedForTier('FREE', 'United States'), false);
    assert.equal(isCountryUnlockedForTier('FREE', 'Germany'), true);
    assert.equal(isCountryUnlockedForTier('FREE', 'Pakistan'), true);

    // Testing country guard in quota check
    const usCheck = checkAndIncrementQuota(testUserId, 'search', { country: 'United States' });
    assert.equal(usCheck.allowed, false);
    assert.equal(usCheck.error, 'UPGRADE_REQUIRED');

    // AutoPilot is completely unavailable on FREE tier
    const autopilotCheck = checkAndIncrementQuota(testUserId, 'autopilot');
    assert.equal(autopilotCheck.allowed, false);
    assert.equal(autopilotCheck.error, 'UPGRADE_REQUIRED');
  });

  await t.test('3. Admin manual plan assignment starts authoritative 30-day period', async () => {
    const beforeNow = Date.now();
    await updateUser({
      userId: testUserId,
      planTier: 'PRO',
    });

    const activeTier = await getUserPlanTier(testUserId);
    assert.equal(activeTier, 'PRO', 'User tier must immediately reflect PRO');

    const sub = await getUserSubscription(testUserId);
    assert.ok(sub, 'Subscription record must exist');
    assert.equal(sub.plan_type, 'PRO');
    assert.equal(sub.status, 'active');
    assert.ok(sub.current_period_start);
    assert.ok(sub.current_period_end);

    const expiryMs = new Date(sub.current_period_end).getTime();
    const expectedExpiryMin = beforeNow + 29 * 86400000;
    const expectedExpiryMax = Date.now() + 31 * 86400000;
    assert.ok(
      expiryMs >= expectedExpiryMin && expiryMs <= expectedExpiryMax,
      `Expiry must be approximately 30 days from grant, got ${sub.current_period_end}`
    );

    // US is now unlocked for PRO user
    assert.equal(isCountryUnlockedForTier('PRO', 'United States'), true);
    assert.equal(isCountryUnlockedForTier('PRO', 'United Kingdom'), true);
    assert.equal(isCountryUnlockedForTier('PRO', 'Japan'), true);
  });

  await t.test('4. Enriched users list displays real subscription dates and quota usage', async () => {
    const { users } = await getEnrichedUsers({ search: testUserEmail });
    const enrichedUser = users.find((u) => u.id === testUserId);

    assert.ok(enrichedUser, 'Enriched user must be found');
    assert.equal(enrichedUser.plan_tier, 'PRO');
    assert.equal(enrichedUser.is_paid, true);
    assert.equal(enrichedUser.subscription_status, 'active');
    assert.ok(enrichedUser.subscription_end);
    assert.equal(enrichedUser.is_expired, false);
    assert.ok(enrichedUser.usage !== undefined);
  });

  await t.test('5. Strict 30-day automatic expiration immediately downgrades to Free', async () => {
    // Simulate expired subscription (ended 5 minutes ago)
    const pastExpiry = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await saveUserSubscription({
      user_id: testUserId,
      plan_type: 'PRO',
      status: 'active',
      current_period_end: pastExpiry,
    });

    // getUserPlanTier MUST return FREE without delay
    const effectiveTier = await getUserPlanTier(testUserId);
    assert.equal(effectiveTier, 'FREE', 'Expired user must immediately be downgraded to FREE');

    // Subscription record must be marked expired
    const expiredSub = await getUserSubscription(testUserId);
    assert.equal(expiredSub.status, 'expired', 'Subscription status must be expired');

    // Admin enriched users must show expired status
    const { users } = await getEnrichedUsers({ search: testUserEmail });
    const userInAdmin = users.find((u) => u.id === testUserId);
    assert.equal(userInAdmin.plan_tier, 'FREE');
    assert.equal(userInAdmin.is_paid, false);
    assert.equal(userInAdmin.subscription_status, 'expired');
    assert.equal(userInAdmin.is_expired, true);

    // Protected operations must block expired user from paid destinations
    const usSearchAfterExpiry = checkAndIncrementQuota(testUserId, 'search', { country: 'United States' });
    assert.equal(usSearchAfterExpiry.allowed, false, 'Expired user cannot search US');
    assert.equal(usSearchAfterExpiry.error, 'UPGRADE_REQUIRED');
  });

  await t.test('6. User renewal / re-assignment reactivates 30-day period with paid entitlements', async () => {
    await updateUser({
      userId: testUserId,
      planTier: 'ELITE',
    });

    const renewedTier = await getUserPlanTier(testUserId);
    assert.equal(renewedTier, 'ELITE');

    const config = getPlanConfig(renewedTier);
    assert.equal(config.allowedCountries, 'ALL');
    assert.equal(isCountryUnlockedForTier('ELITE', 'Global (All Countries)'), true);
    assert.equal(isCountryUnlockedForTier('ELITE', 'New Zealand'), true);

    const sub = await getUserSubscription(testUserId);
    assert.equal(sub.status, 'active');
    assert.ok(new Date(sub.current_period_end).getTime() > Date.now());
  });

  await t.test('7. Admin downgrade to Free removes paid entitlements safely without deleting user', async () => {
    await updateUser({
      userId: testUserId,
      planTier: 'FREE',
    });

    const finalTier = await getUserPlanTier(testUserId);
    assert.equal(finalTier, 'FREE');

    const profile = await getUserProfile(testUserId);
    assert.ok(profile, 'User profile must remain intact');
    assert.equal(profile.email, testUserEmail);
  });
});
