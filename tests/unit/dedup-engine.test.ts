import assert from 'node:assert';
import { findDuplicateClusters } from '../../lib/drive/dedup-engine';
import { DriveItem } from '../../lib/drive/drive-types';

export async function runDedupTests() {
  console.log('🧪 Testing [dedup-engine.ts]...');

  const items = [
    {
      id: 'd1',
      name: 'Passport Front.jpg',
      type: 'file',
      size: 450000,
      createdAt: 100,
      updatedAt: 100,
      isStarred: false,
      isTrash: false,
    },
    {
      id: 'd2',
      name: 'Passport Front (Copy).jpg',
      type: 'file',
      size: 450000,
      createdAt: 200,
      updatedAt: 200,
      isStarred: false,
      isTrash: false,
    },
    {
      id: 'd3',
      name: 'Different File.pdf',
      type: 'file',
      size: 120000,
      createdAt: 300,
      updatedAt: 300,
      isStarred: false,
      isTrash: false,
    },
    {
      id: 'd4',
      name: 'Aadhaar Card (1).pdf',
      type: 'file',
      size: 300000,
      createdAt: 400,
      updatedAt: 400,
      isStarred: false,
      isTrash: false,
    },
    {
      id: 'd5',
      name: 'Aadhaar Card copy.pdf',
      type: 'file',
      size: 305000, // slightly different size, matches on normalized name
      createdAt: 500,
      updatedAt: 500,
      isStarred: false,
      isTrash: false,
    },
  ] as unknown as DriveItem[];

  const clusters = findDuplicateClusters(items);
  assert.strictEqual(clusters.length, 2, 'Should find 2 duplicate clusters');

  // Exact size cluster
  const sizeCluster = clusters.find((c) => c.items.some((i) => i.id === 'd1'));
  assert.ok(sizeCluster, 'Should have size cluster for d1 and d2');
  assert.strictEqual(sizeCluster?.items.length, 2);
  assert.strictEqual(sizeCluster?.suggestedKeepId, 'd2', 'Should suggest keeping most recently updated item');

  // Normalized name cluster
  const nameCluster = clusters.find((c) => c.items.some((i) => i.id === 'd4'));
  assert.ok(nameCluster, 'Should have name cluster for d4 and d5');
  assert.strictEqual(nameCluster?.items.length, 2);

  console.log('  ✅ [dedup-engine.ts] passed all assertions.');
}
