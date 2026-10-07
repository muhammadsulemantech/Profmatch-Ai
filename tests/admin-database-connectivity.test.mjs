import test from 'node:test';
import assert from 'node:assert/strict';
import { getEnrichedUsers, updateUser } from '../lib/services/user-service.ts';
import { getFeatureFlags, updateFeatureFlag, getAuditLogs } from '../lib/services/admin-service.ts';
import { getPaymentMethods, getAdminPayments } from '../lib/services/payment-service.ts';
import { getUserProfile, getUserPlanTier } from '../lib/services/db-service.ts';

test('Admin Panel Real Database Connectivity Suite', async (t) => {
  await t.test('1. getEnrichedUsers returns real users from database with correct plan tiers', async () => {
    const result = await getEnrichedUsers({ page: 1, pageSize: 20 });
    assert.ok(result.users, 'Users array must be defined');
    assert.ok(result.total >= 4, `Must have at least 4 real users from database, got ${result.total}`);
    
    // Check real registered users exist
    const emails = result.users.map((u) => u.email.toLowerCase());
    assert.ok(emails.includes('admin@profmatch.ai'), 'admin@profmatch.ai must be in user list');
    assert.ok(emails.includes('muhammadmun305@gmail.com'), 'muhammadmun305@gmail.com must be in user list');

    // Verify fields
    const adminUser = result.users.find((u) => u.email.toLowerCase() === 'admin@profmatch.ai');
    assert.equal(adminUser.role, 'ADMIN', 'adminUser role must be ADMIN');
    assert.ok(adminUser.id, 'User must have id');
    assert.ok(adminUser.created_at, 'User must have created_at');
    assert.ok(adminUser.plan_tier, 'User must have plan_tier');
  });

  await t.test('2. getEnrichedUsers supports filtering by role and search', async () => {
    const adminFilter = await getEnrichedUsers({ role: 'ADMIN' });
    assert.ok(adminFilter.users.length >= 3, 'Must have at least 3 admins');
    assert.ok(adminFilter.users.every((u) => u.role === 'ADMIN'), 'All users in role filter must be ADMIN');

    const searchFilter = await getEnrichedUsers({ search: 'muhammadmun305' });
    assert.equal(searchFilter.users.length, 1, 'Search by specific email must return 1 user');
    assert.equal(searchFilter.users[0].email, 'muhammadmun305@gmail.com');
  });

  await t.test('3. updateUser persists plan changes and synchronizes with getUserPlanTier', async () => {
    const users = await getEnrichedUsers();
    const targetUser = users.users.find((u) => u.email === 'muhammadmun305@gmail.com');
    assert.ok(targetUser, 'Target user must exist');

    // Update plan to PRO
    await updateUser({ userId: targetUser.id, planTier: 'PRO' });

    // Verify plan tier reflected in db-service
    const tier = await getUserPlanTier(targetUser.id);
    assert.equal(tier, 'PRO', 'User plan tier must immediately reflect PRO');

    // Verify in enriched users
    const updatedUsers = await getEnrichedUsers();
    const updatedTarget = updatedUsers.users.find((u) => u.id === targetUser.id);
    assert.equal(updatedTarget.plan_tier, 'PRO', 'Enriched users list must reflect PRO');
    assert.equal(updatedTarget.is_paid, true, 'is_paid must be true for PRO');

    // Revert back to FREE
    await updateUser({ userId: targetUser.id, planTier: 'FREE' });
    const revertedTier = await getUserPlanTier(targetUser.id);
    assert.equal(revertedTier, 'FREE', 'User plan tier must revert to FREE');
  });

  await t.test('4. getPaymentMethods retrieves real methods from database', async () => {
    const methods = await getPaymentMethods();
    assert.ok(Array.isArray(methods), 'Payment methods must be an array');
    assert.ok(methods.length >= 8, `Must have at least 8 real payment methods, got ${methods.length}`);

    const sadapay = methods.find((m) => m.name.includes('SadaPay'));
    assert.ok(sadapay, 'SadaPay method must be present');
    assert.equal(sadapay.country, 'Pakistan');
    assert.equal(sadapay.currency, 'PKR');
  });

  await t.test('5. getFeatureFlags reads and updates real flags from database', async () => {
    const flags = await getFeatureFlags();
    assert.ok(Array.isArray(flags), 'Flags must be an array');
    assert.ok(flags.length >= 6, `Must have at least 6 feature flags, got ${flags.length}`);

    const targetFlag = flags[0];
    const initialStatus = targetFlag.is_enabled;

    // Toggle flag
    const updated = await updateFeatureFlag(targetFlag.flag_key, !initialStatus);
    assert.equal(updated.is_enabled, !initialStatus, 'Flag status must toggle');

    // Revert flag
    await updateFeatureFlag(targetFlag.flag_key, initialStatus);
    const revertedFlags = await getFeatureFlags();
    const revertedFlag = revertedFlags.find((f) => f.flag_key === targetFlag.flag_key);
    assert.equal(revertedFlag.is_enabled, initialStatus, 'Flag status must revert');
  });

  await t.test('6. getAuditLogs retrieves real immutable logs from database', async () => {
    const result = await getAuditLogs(1, 20);
    assert.ok(result.logs, 'Logs must be defined');
    assert.ok(result.total >= 100, `Must have at least 100 real audit logs from database, got ${result.total}`);
    assert.equal(result.logs.length, 20, 'Page size must be 20');
    assert.ok(result.logs[0].action, 'Audit log entry must have action');
    assert.ok(result.logs[0].created_at, 'Audit log entry must have created_at');
  });

  await t.test('7. getAdminPayments retrieves real payments list with count', async () => {
    const result = await getAdminPayments();
    assert.ok(Array.isArray(result.payments), 'Payments must be an array');
    assert.ok(Array.isArray(result.orders), 'Orders must be an array');
    assert.equal(typeof result.total, 'number', 'Total must be a number');
  });
});
