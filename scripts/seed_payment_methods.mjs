import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const methods = [
  {
    name: 'SadaPay (Fast Digital Wallet / IBFT)',
    type: 'mobile_wallet',
    country: 'Pakistan',
    country_code: 'PAK',
    currency: 'PKR',
    account_name: 'ProfMatch Billing Services',
    account_number: '03009876543',
    account_identifier: 'PK82SADA0000000300987654',
    instructions: '1. Open SadaPay App.\n2. Tap "Send Money" to SadaPay or IBFT.\n3. Enter SadaPay Number: 0300-9876543 (IBAN: PK82SADA0000000300987654).\n4. Account Title: ProfMatch Billing Services.\n5. Copy the Transaction ID and upload the payment receipt screenshot below.',
    enabled: true,
    sort_order: 1
  },
  {
    name: 'NayaPay (Instant Digital Wallet)',
    type: 'mobile_wallet',
    country: 'Pakistan',
    country_code: 'PAK',
    currency: 'PKR',
    account_name: 'ProfMatch AI Services',
    account_number: '03123456789',
    account_identifier: 'profmatch@nayapay',
    instructions: '1. Open NayaPay App.\n2. Send funds to NayaPay ID: profmatch@nayapay or Mobile: 0312-3456789.\n3. Account Title: ProfMatch AI Services.\n4. Take a screenshot of the successful transfer and attach it below with TRX ID.',
    enabled: true,
    sort_order: 2
  },
  {
    name: 'Meezan Bank Ltd (Direct IBFT Transfer)',
    type: 'bank_transfer',
    country: 'Pakistan',
    country_code: 'PAK',
    currency: 'PKR',
    account_name: 'ProfMatch Global Private Limited',
    account_number: '01010102030405',
    account_identifier: 'PK56MEZN0001010102030405',
    instructions: '1. Log in to your banking app (HBL, Meezan, Alfalah, UBL, Allied, etc.).\n2. Choose Inter-Bank Funds Transfer (IBFT) to Meezan Bank.\n3. Enter IBAN: PK56MEZN0001010102030405 (Title: ProfMatch Global Private Limited).\n4. Enter order reference in transfer remarks and attach receipt screenshot.',
    enabled: true,
    sort_order: 3
  },
  {
    name: 'JazzCash Mobile Account',
    type: 'mobile_wallet',
    country: 'Pakistan',
    country_code: 'PAK',
    currency: 'PKR',
    account_name: 'ProfMatch Education Services',
    account_number: '03001234567',
    account_identifier: '03001234567',
    instructions: '1. Open JazzCash App or dial *786#.\n2. Send money to Mobile Account 0300-1234567 (ProfMatch Education Services).\n3. Enter the 11-digit Transaction ID (TID) from the SMS.\n4. Upload your payment confirmation screenshot.',
    enabled: true,
    sort_order: 4
  },
  {
    name: 'EasyPaisa Mobile Account',
    type: 'mobile_wallet',
    country: 'Pakistan',
    country_code: 'PAK',
    currency: 'PKR',
    account_name: 'ProfMatch Education Services',
    account_number: '03451234567',
    account_identifier: '03451234567',
    instructions: '1. Open EasyPaisa App.\n2. Transfer to EasyPaisa Mobile Account 0345-1234567.\n3. Verify Account Title: ProfMatch Education Services.\n4. Enter TRX ID and upload payment screenshot.',
    enabled: true,
    sort_order: 5
  },
  {
    name: 'Bank Alfalah (International / Roshan Digital)',
    type: 'bank_transfer',
    country: 'Pakistan',
    country_code: 'PAK',
    currency: 'PKR',
    account_name: 'ProfMatch Global Private Limited',
    account_number: '55010203040506',
    account_identifier: 'PK34ALFH0055010203040506',
    instructions: '1. Initiate transfer to Bank Alfalah Ltd.\n2. Account IBAN: PK34ALFH0055010203040506.\n3. Account Title: ProfMatch Global Private Limited.\n4. Upload payment proof with transaction ID.',
    enabled: true,
    sort_order: 6
  },
  {
    name: 'International Wire Transfer / SWIFT',
    type: 'bank_transfer',
    country: 'Global',
    country_code: 'GLB',
    currency: 'USD',
    account_name: 'ProfMatch Global Inc.',
    account_number: '987654321098',
    account_identifier: 'SWIFT: MEZNPKKAXXX',
    instructions: '1. Initiate international wire via your bank.\n2. Beneficiary: ProfMatch Global Inc.\n3. SWIFT Code: MEZNPKKAXXX.\n4. Reference: Your PM Order Reference.\n5. Upload wire confirmation document.',
    enabled: true,
    sort_order: 7
  },
  {
    name: 'USDC / Crypto (TRC20 / Polygon)',
    type: 'crypto',
    country: 'Global',
    country_code: 'GLB',
    currency: 'USD',
    account_name: 'ProfMatch Treasury',
    account_number: '0x71C8A66f2C38d9fEf117985444b0e8b2b189Ec9D',
    account_identifier: 'Polygon / TRC20',
    instructions: '1. Send exact USDC amount on Polygon network to: 0x71C8A66f2C38d9fEf117985444b0e8b2b189Ec9D.\n2. Double check Polygon chain before sending.\n3. Enter Polygonscan transaction hash below.',
    enabled: true,
    sort_order: 8
  },
  {
    name: 'PayPal (Global Academic Billing)',
    type: 'paypal',
    country: 'Global',
    country_code: 'GLB',
    currency: 'USD',
    account_name: 'ProfMatch Global',
    account_number: 'billing@profmatch.ai',
    account_identifier: 'paypal.me/profmatch',
    instructions: '1. Send payment to billing@profmatch.ai via PayPal.\n2. Choose Goods & Services or Academic Billing.\n3. Note your Order Reference in the note.\n4. Enter Transaction ID and upload PayPal receipt screenshot.',
    enabled: true,
    sort_order: 9
  }
];

async function seed() {
  const { data: existing } = await supabase.from('payment_methods').select('id');
  if (existing && existing.length > 0) {
    console.log('payment_methods already contains', existing.length, 'methods');
    return;
  }
  const { data, error } = await supabase.from('payment_methods').insert(methods).select();
  if (error) {
    console.error('Error inserting payment_methods:', error);
  } else {
    console.log('Successfully inserted', data.length, 'payment methods into Supabase!');
  }
}

seed();
