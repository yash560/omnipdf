import assert from 'node:assert';
import { detectDocumentExpiry } from '../../lib/drive/expiry-tracker';

export async function runExpiryTests() {
  console.log('🧪 Testing [expiry-tracker.ts]...');

  // 1. Insurance Policy parsing
  const res1 = detectDocumentExpiry({
    name: 'PULSAR INSURANCE POLICY ENDING 2029.pdf',
    relativePath: 'Important documents/Vehicles/Pulsar/PULSAR INSURANCE POLICY.pdf',
    tags: ['vehicle', 'insurance', 'pulsar'],
  });
  assert.strictEqual(res1.expiryType, 'insurance');
  assert.strictEqual(res1.expiryStatus, 'valid');
  assert.ok(res1.expiryDaysLeft > 0);

  // 2. Past year insurance policy (expired)
  const res2 = detectDocumentExpiry({
    name: 'Insurance Policy 2021.pdf',
    relativePath: 'Important documents/Vehicles/Amaze/Insurance Policy 2021.pdf',
    tags: ['vehicle', 'insurance'],
  });
  assert.strictEqual(res2.expiryType, 'insurance');
  assert.strictEqual(res2.expiryStatus, 'expired');
  assert.ok(res2.expiryDaysLeft < 0);

  // 3. Property Tax Assessment Cycle (e.g. 2023-2024)
  const res3 = detectDocumentExpiry({
    name: 'Property Tax - Sapphire Complex - 2023-2024.html',
    relativePath: 'Important documents/Property/Sapphire complex/Property Tax/Property Tax - Sapphire Complex - 2023-2024.html',
    tags: ['property', 'tax', 'sapphire'],
  });
  assert.strictEqual(res3.expiryType, 'tax');
  assert.strictEqual(res3.expiryStatus, 'expired');
  assert.ok(res3.expiryDetails.includes('2023-2024'));

  // 4. Passport & DL long-term validity
  const res4 = detectDocumentExpiry({
    name: 'Shreya Passport.pdf',
    relativePath: 'Important documents/People/Shreya/Shreya Passport.pdf',
    tags: ['passport', 'identity'],
  });
  assert.strictEqual(res4.expiryType, 'passport');
  assert.strictEqual(res4.expiryStatus, 'valid');

  // 5. Document with no expiry indicators
  const res5 = detectDocumentExpiry({
    name: 'Family Photo.jpg',
    relativePath: 'Photos/Family Photo.jpg',
    tags: ['photo'],
  });
  assert.strictEqual(res5.expiryStatus, 'none');
  assert.strictEqual(res5.expiryDate, null);

  console.log('  ✅ [expiry-tracker.ts] passed all assertions.');
}
