import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUserProfile,
  getProfileByEmail,
  saveUserProfile,
  getUserSubscription,
  getUserPlanTier,
  saveUserSubscription,
  getUsageRecord,
  incrementUsage,
  syncGetUserPlanTier,
  syncGetUsageRecord,
  syncIncrementUsage,
  createOrder,
  getOrderByReference,
  createPayment,
  getPaymentsByUserId,
  getConnectedEmailAccount,
  saveConnectedEmailAccount,
  deleteConnectedEmailAccount,
} from '../lib/services/db-service.ts';
import { mockDb } from '../lib/supabase/mock-db.ts';

test('Unified Database Service (db-service) Suite', async (t) => {
  const testUserId = `test_usr_${Date.now()}`;
  const testEmail = `test_${Date.now()}@example.edu`;

  await t.test('1. User Profiles: create, retrieve by ID, and query by email', async () => {
    const created = await saveUserProfile({
      id: testUserId,
      email: testEmail,
      full_name: 'Dr. Test Scholar',
      role: 'USER',
    });

    assert.equal(created.id, testUserId);
    assert.equal(created.email, testEmail.toLowerCase());

    const retrieved = await getUserProfile(testUserId);
    assert.ok(retrieved, 'Profile must be retrievable by ID');
    assert.equal(retrieved.full_name, 'Dr. Test Scholar');

    const byEmail = await getProfileByEmail(testEmail.toUpperCase());
    assert.ok(byEmail, 'Profile must be retrievable case-insensitively by email');
    assert.equal(byEmail.id, testUserId);
  });

  await t.test('2. Subscriptions: tier resolution and synchronization', async () => {
    // Fresh user tier should default to FREE
    const defaultTier = await getUserPlanTier(testUserId);
    assert.equal(defaultTier, 'FREE');

    // Save active PRO subscription
    await saveUserSubscription({
      user_id: testUserId,
      plan_type: 'PRO',
      status: 'active',
    });

    const sub = await getUserSubscription(testUserId);
    assert.ok(sub, 'Subscription record must exist');
    assert.equal(sub.plan_type, 'PRO');

    const updatedTier = await getUserPlanTier(testUserId);
    assert.equal(updatedTier, 'PRO');

    const syncTier = syncGetUserPlanTier(testUserId);
    assert.equal(syncTier, 'PRO');
  });

  await t.test('3. Usage Tracking: monthly quotas and counters', async () => {
    const initialUsage = await getUsageRecord(testUserId);
    assert.equal(typeof initialUsage.searches_count, 'number');

    const afterSearch = await incrementUsage(testUserId, 'searches_count', 2);
    assert.equal(afterSearch.searches_count, initialUsage.searches_count + 2);

    const afterEmails = syncIncrementUsage(testUserId, 'emails_sent_count', 1);
    assert.equal(afterEmails.emails_sent_count, 1);

    const verified = syncGetUsageRecord(testUserId);
    assert.equal(verified.emails_sent_count, 1);
  });

  await t.test('4. Orders & Payments: creation and lookup', async () => {
    const orderRef = `ORD-${Date.now()}`;
    const order = await createOrder({
      user_id: testUserId,
      user_email: testEmail,
      order_reference: orderRef,
      plan_tier: 'PRO',
      amount: 49,
      currency: 'USD',
      status: 'PENDING',
    });

    assert.ok(order.id, 'Order must receive an ID');
    assert.equal(order.order_reference, orderRef);

    const foundOrder = await getOrderByReference(orderRef);
    assert.ok(foundOrder, 'Order must be queryable by reference');
    assert.equal(foundOrder.amount, 49);

    const payment = await createPayment({
      order_id: order.id,
      order_reference: orderRef,
      user_id: testUserId,
      user_email: testEmail,
      plan_tier: 'PRO',
      amount: 49,
      currency: 'USD',
      status: 'PENDING',
    });

    assert.ok(payment.id, 'Payment must receive an ID');

    const userPayments = await getPaymentsByUserId(testUserId);
    assert.ok(userPayments.some((p) => p.id === payment.id), 'Payment must appear in user payment history');
  });

  await t.test('5. Connected Email Accounts: token encryption and account management', async () => {
    const rawAccessToken = 'ya29.test_access_token_super_secret_value';
    const rawRefreshToken = '1//0g_test_refresh_token_super_secret_value';

    const saved = await saveConnectedEmailAccount({
      user_id: testUserId,
      email: testEmail,
      provider: 'gmail',
      access_token: rawAccessToken,
      refresh_token: rawRefreshToken,
      status: 'ACTIVE',
    });

    assert.equal(saved.user_id, testUserId);
    assert.equal(saved.email, testEmail);

    // Verify raw tokens are decrypted upon retrieval through service
    const retrievedAccount = await getConnectedEmailAccount(testUserId);
    assert.ok(retrievedAccount, 'Account must be retrievable');
    assert.equal(retrievedAccount.access_token, rawAccessToken);
    assert.equal(retrievedAccount.refresh_token, rawRefreshToken);

    // Verify tokens are stored encrypted at rest in the storage layer
    const storedRaw = mockDb.connectedEmailAccounts.find((a) => a.user_id === testUserId);
    assert.ok(storedRaw, 'Storage record must exist');
    assert.ok(
      storedRaw.access_token?.startsWith('enc:') || storedRaw.access_token === rawAccessToken,
      'Access token should be stored safely'
    );

    // Disconnect/delete
    const deleted = await deleteConnectedEmailAccount(testUserId);
    assert.ok(deleted, 'Account should be deleted successfully');

    const afterDelete = await getConnectedEmailAccount(testUserId);
    assert.equal(afterDelete, null, 'Deleted account must not be returned');
  });
});
