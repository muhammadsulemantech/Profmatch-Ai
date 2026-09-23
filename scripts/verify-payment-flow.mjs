// verify-payment-flow.mjs
// Automated verification for ProfMatch AI Payment, Checkout & Admin Verification System

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('='.repeat(70));
  console.log('PROFMATCH AI — END-TO-END PAYMENT & ADMIN VERIFICATION TEST');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  // 1. Test GET /api/payments/methods (Global)
  try {
    console.log('\n[1/7] Testing GET /api/payments/methods (Global)...');
    const res = await fetch(`${BASE_URL}/api/payments/methods`);
    const json = await res.json();
    if (res.ok && json.success && Array.isArray(json.methods) && json.methods.length > 0) {
      console.log(`✅ Passed: Retrieved ${json.methods.length} payment methods.`);
      passed++;
    } else {
      throw new Error(`Failed response: ${JSON.stringify(json)}`);
    }
  } catch (err) {
    console.error(`❌ FAILED:`, err.message);
    failed++;
  }

  // 2. Test GET /api/payments/methods?country=Pakistan
  try {
    console.log('\n[2/7] Testing GET /api/payments/methods?country=Pakistan...');
    const res = await fetch(`${BASE_URL}/api/payments/methods?country=Pakistan`);
    const json = await res.json();
    const hasJazzCash = json.methods?.some(m => m.name.includes('JazzCash'));
    const hasEasyPaisa = json.methods?.some(m => m.name.includes('EasyPaisa'));
    if (res.ok && json.success && hasJazzCash && hasEasyPaisa) {
      console.log(`✅ Passed: Filtered Pakistan channels successfully (JazzCash & EasyPaisa present).`);
      passed++;
    } else {
      throw new Error(`Failed: Missing expected Pakistan payment channels`);
    }
  } catch (err) {
    console.error(`❌ FAILED:`, err.message);
    failed++;
  }

  // 3. Test POST /api/checkout/submit (Student submitting payment proof)
  let orderRef = '';
  let paymentId = '';
  try {
    console.log('\n[3/7] Testing POST /api/checkout/submit (Student manual payment submission)...');
    const payload = {
      planTier: 'STUDENT',
      planName: 'Graduate Applicant Pro',
      amount: 5200,
      currency: 'PKR',
      billingInterval: 'monthly',
      paymentMethodId: 'pm_jazzcash_01',
      transactionId: 'TID-99281736451',
      paymentNote: 'Transferred from JazzCash App (0300-1122334)',
      proofFileName: 'jazzcash_trans_proof.png',
      proofFileUrl: 'data:image/png;base64,mockproofbytes',
      userEmail: 'student@example.com',
      userName: 'Alex Vance',
      userId: 'usr_student_001',
    };

    const res = await fetch(`${BASE_URL}/api/checkout/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (res.ok && json.success && json.orderReference && json.paymentId) {
      orderRef = json.orderReference;
      paymentId = json.paymentId;
      console.log(`✅ Passed: Order created with Reference ${orderRef}, Payment ID ${paymentId}, Status: ${json.status}`);
      passed++;
    } else {
      throw new Error(`Failed to submit payment: ${JSON.stringify(json)}`);
    }
  } catch (err) {
    console.error(`❌ FAILED:`, err.message);
    failed++;
  }

  let adminHeaders = {
    'Content-Type': 'application/json',
  };

  // Attempt real login to obtain authenticated session
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@profmatch.ai', password: process.env.ADMIN_PASSWORD || 'ProfMatchAdmin2026!' }),
    });
    const setCookie = adminLoginRes.headers.get('set-cookie');
    if (setCookie) {
      adminHeaders['Cookie'] = setCookie;
    }
  } catch (e) {
    // If running in mocked environment
  }

  // 4. Test GET /api/admin/payments (Admin querying pending payments)
  try {
    console.log('\n[4/7] Testing GET /api/admin/payments (Admin listing payments)...');
    const res = await fetch(`${BASE_URL}/api/admin/payments?status=PENDING`, {
      headers: adminHeaders,
    });
    const json = await res.json();
    const foundPayment = json.payments?.find(p => p.id === paymentId || p.order_reference === orderRef);

    if (res.ok && json.success && foundPayment) {
      console.log(`✅ Passed: Admin successfully retrieved submitted pending payment for ${foundPayment.user_name} (${foundPayment.transaction_id})`);
      passed++;
    } else {
      throw new Error(`Submitted payment not found in admin list: ${JSON.stringify(json)}`);
    }
  } catch (err) {
    console.error(`❌ FAILED:`, err.message);
    failed++;
  }

  // 5. Test PUT /api/admin/payments (Admin approving payment and activating subscription)
  try {
    console.log('\n[5/7] Testing PUT /api/admin/payments (Admin verification and approval)...');
    const res = await fetch(`${BASE_URL}/api/admin/payments`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        paymentId,
        action: 'APPROVE',
        adminNote: 'TID-99281736451 verified with bank statement. Subscription activated.',
      }),
    });
    const json = await res.json();

    if (res.ok && json.success && json.payment?.status === 'APPROVED' && json.order?.status === 'APPROVED') {
      console.log(`✅ Passed: Payment and Order APPROVED! User subscription activated for plan: ${json.subscription?.plan_type}`);
      passed++;
    } else {
      throw new Error(`Failed approval response: ${JSON.stringify(json)}`);
    }
  } catch (err) {
    console.error(`❌ FAILED:`, err.message);
    failed++;
  }

  // 6. Test POST /api/admin/payment-methods (Admin adding custom channel)
  let createdMethodId = '';
  try {
    console.log('\n[6/7] Testing POST /api/admin/payment-methods (Admin creating new payment channel)...');
    const res = await fetch(`${BASE_URL}/api/admin/payment-methods`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Nayapay Mobile Wallet',
        type: 'mobile_wallet',
        country: 'Pakistan',
        currency: 'PKR',
        account_name: 'ProfMatch Technologies',
        account_number: '0311-9988776',
        instructions: 'Transfer to Nayapay ID @profmatch.',
        enabled: true,
      }),
    });
    const json = await res.json();

    if (res.ok && json.success && json.method?.id) {
      createdMethodId = json.method.id;
      console.log(`✅ Passed: Created new channel "${json.method.name}" (ID: ${createdMethodId})`);
      passed++;
    } else {
      throw new Error(`Failed to create method: ${JSON.stringify(json)}`);
    }
  } catch (err) {
    console.error(`❌ FAILED:`, err.message);
    failed++;
  }

  // 7. Test DELETE /api/admin/payment-methods (Admin deleting test channel)
  try {
    console.log('\n[7/7] Testing DELETE /api/admin/payment-methods...');
    const res = await fetch(`${BASE_URL}/api/admin/payment-methods?id=${createdMethodId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    const json = await res.json();

    if (res.ok && json.success) {
      console.log(`✅ Passed: Deleted test payment channel successfully.`);
      passed++;
    } else {
      throw new Error(`Failed to delete method: ${JSON.stringify(json)}`);
    }
  } catch (err) {
    console.error(`❌ FAILED:`, err.message);
    failed++;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`FINAL RESULT: ${passed}/7 PASSED, ${failed}/7 FAILED`);
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
}

runTests();
