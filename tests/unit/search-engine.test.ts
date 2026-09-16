import assert from 'node:assert';
import { searchDriveItems } from '../../lib/drive/search-engine';
import { DriveItem } from '../../lib/drive/drive-types';

const mockItems = [
  {
    id: '1',
    name: 'Aadhaar card (Yogesh Jain) .pdf',
    type: 'file',
    category: 'pdf',
    relativePath: 'Important documents/People/Yogesh/Aadhaar card(Yogesh jain)(Dad)/Aadhaar card (Yogesh Jain) .pdf',
    tags: ['Yogesh Jain', 'Dad', 'Identity', 'KYC', 'Government ID', 'Aadhaar Card'],
    aiCategory: 'Identity & KYC',
    ocrText: 'Government of India Unique Identification Authority of India Yogesh Jain 1234 5678 9012',
    size: 500000,
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
    isStarred: true,
    isTrash: false,
  },
  {
    id: '2',
    name: 'PAN Card - Yogesh Jain.pdf',
    type: 'file',
    category: 'pdf',
    relativePath: 'Important documents/People/Yogesh/PAN Card/PAN Card - Yogesh Jain.pdf',
    tags: ['Yogesh Jain', 'Dad', 'Identity', 'PAN Card', 'Income Tax Department'],
    aiCategory: 'Identity & KYC',
    ocrText: 'INCOME TAX DEPARTMENT GOVT OF INDIA Permanent Account Number ABCDE1234F Yogesh Jain',
    size: 350000,
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 200000,
    isStarred: false,
    isTrash: false,
  },
  {
    id: '3',
    name: 'Honda Amaze RC Card.jpg',
    type: 'file',
    category: 'image',
    relativePath: 'Important documents/Vehicles/Amaze documents/Honda Amaze RC Card.jpg',
    tags: ['Vehicle', 'Automobile', 'Transport', 'Honda Amaze', 'RC Registration'],
    aiCategory: 'Vehicle & Transport',
    ocrText: 'TRANSPORT DEPARTMENT MADHYA PRADESH Certificate of Registration Honda Amaze MP04AB1234',
    size: 1200000,
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 300000,
    isStarred: false,
    isTrash: false,
  },
  {
    id: '4',
    name: 'Salary Slip July 2024.pdf',
    type: 'file',
    category: 'pdf',
    relativePath: 'Important documents/People/Yash/Work/Salary Slips/Salary Slip July 2024.pdf',
    tags: ['Yash Jain', 'Career', 'Employment', 'Salary Slip', 'Payroll'],
    aiCategory: 'Employment & Career',
    ocrText: 'PAYSLIP FOR THE MONTH OF JULY 2024 Employee Name: Yash Jain Net Pay: INR 150000',
    size: 250000,
    createdAt: Date.now() - 400000,
    updatedAt: Date.now() - 400000,
    isStarred: false,
    isTrash: false,
  },
  {
    id: '5',
    name: 'Secret Vault Document.pdf',
    type: 'file',
    category: 'pdf',
    relativePath: 'Vault/Secret Vault Document.pdf',
    tags: ['Confidential', 'Vault'],
    aiCategory: 'Financial & Banking',
    ocrText: 'Encrypted Zero Knowledge Document',
    size: 100000,
    createdAt: Date.now() - 500000,
    updatedAt: Date.now() - 500000,
    isStarred: false,
    isTrash: false,
    isVault: true,
  },
  {
    id: '6',
    name: 'Old Deleted Receipt.pdf',
    type: 'file',
    category: 'pdf',
    relativePath: 'Trash/Old Deleted Receipt.pdf',
    tags: ['Receipt'],
    size: 80000,
    createdAt: Date.now() - 600000,
    updatedAt: Date.now() - 600000,
    isStarred: false,
    isTrash: true,
  },
] as unknown as DriveItem[];

export async function runSearchEngineTests() {
  console.log('🧪 Testing [search-engine.ts]...');

  // 1. Exact Name Query
  const res1 = searchDriveItems(mockItems, { query: 'Salary Slip July 2024.pdf' });
  assert.strictEqual(res1.items.length, 1);
  assert.strictEqual(res1.items[0].id, '4');

  // 2. Multi-Token Conjunction & Typo-Tolerance
  // 'dad adhar' should match Aadhaar card (Yogesh Jain) via expansion (dad -> yogesh, adhar -> aadhaar)
  const res2 = searchDriveItems(mockItems, { query: 'dad adhar' });
  assert.ok(res2.items.length >= 1, 'Query "dad adhar" should match dad aadhaar card');
  assert.strictEqual(res2.items[0].id, '1');

  // 3. Multi-Token 'yogesh pan' should specifically match PAN Card - Yogesh Jain and not Honda Amaze
  const res3 = searchDriveItems(mockItems, { query: 'yogesh pan' });
  assert.strictEqual(res3.items.length, 1);
  assert.strictEqual(res3.items[0].id, '2');

  // 4. 'amaze rc' should match Honda Amaze RC Card
  const res4 = searchDriveItems(mockItems, { query: 'amaze rc' });
  assert.strictEqual(res4.items.length, 1);
  assert.strictEqual(res4.items[0].id, '3');

  // 5. OCR deep full-text match
  const res5 = searchDriveItems(mockItems, { query: '150000' });
  assert.strictEqual(res5.items.length, 1);
  assert.strictEqual(res5.items[0].id, '4');
  assert.ok(res5.items[0].ocrSnippet, 'OCR snippet should be generated');

  // 6. Vault security filtering
  // When isVaultUnlocked is false, item 5 should NOT be returned
  const res6a = searchDriveItems(mockItems, { query: 'Secret' });
  assert.strictEqual(res6a.items.length, 0, 'Locked vault item must NOT be returned in standard search');

  // When isVaultUnlocked is true and section is 'vault', item 5 is returned
  const res6b = searchDriveItems(mockItems, { query: 'Secret', section: 'vault', isVaultUnlocked: true });
  assert.strictEqual(res6b.items.length, 1);
  assert.strictEqual(res6b.items[0].id, '5');

  // 7. Trash isolation
  // Standard search must never return trash items
  const res7a = searchDriveItems(mockItems, { query: 'Receipt' });
  assert.strictEqual(res7a.items.length, 0);

  // Trash section search returns trash items only
  const res7b = searchDriveItems(mockItems, { query: 'Receipt', section: 'trash' });
  assert.strictEqual(res7b.items.length, 1);
  assert.strictEqual(res7b.items[0].id, '6');

  // 8. Facet count aggregations
  const res8 = searchDriveItems(mockItems, { query: '' });
  assert.ok(res8.availableTags.length > 0, 'Should aggregate tags');
  assert.ok(res8.availableAiCategories.length > 0, 'Should aggregate AI categories');

  console.log('  ✅ [search-engine.ts] passed all assertions.');
}
