import assert from 'node:assert';
import { generateForYouFeed, generateSuggestedActions, generateRelatedItems, computeItemSimilarity } from '../../lib/drive/recommendation-engine';
import { DriveItem } from '../../lib/drive/drive-types';

const sampleItems = [
  {
    id: 'it-1',
    name: 'Yash Jain - Relieving Letter.pdf',
    type: 'file',
    category: 'pdf',
    parentId: 'folder-work',
    tags: ['career', 'employment', 'relieving letter', 'yash jain'],
    aiCategory: 'Employment & Career',
    semanticKeywords: ['relieving', 'experience', 'service', 'resignation'],
    size: 200000,
    createdAt: Date.now() - 1000 * 3600 * 2, // 2h ago
    updatedAt: Date.now() - 1000 * 3600 * 2,
    isStarred: true,
    isTrash: false,
  },
  {
    id: 'it-2',
    name: 'Husys Signed Experience & Relieving Letter_signed.pdf',
    type: 'file',
    category: 'pdf',
    parentId: 'folder-work',
    tags: ['career', 'employment', 'relieving letter', 'yash jain'],
    aiCategory: 'Employment & Career',
    semanticKeywords: ['relieving', 'experience', 'service'],
    size: 300000,
    createdAt: Date.now() - 1000 * 3600 * 24,
    updatedAt: Date.now() - 1000 * 3600 * 24,
    isStarred: false,
    isTrash: false,
  },
  {
    id: 'it-3',
    name: 'Vehicle Insurance Renewal Honda Amaze.pdf',
    type: 'file',
    category: 'pdf',
    parentId: 'folder-vehicles',
    tags: ['vehicle', 'insurance', 'honda amaze', 'policy'],
    aiCategory: 'Vehicle & Transport',
    expiryStatus: 'expired',
    expiryDetails: 'Expired 10 days ago',
    expiryDaysLeft: -10,
    size: 150000,
    createdAt: Date.now() - 1000 * 3600 * 200,
    updatedAt: Date.now() - 1000 * 3600 * 200,
    isStarred: false,
    isTrash: false,
  },
  {
    id: 'it-4',
    name: 'Aadhaar Card Copy (1).pdf',
    type: 'file',
    category: 'pdf',
    parentId: 'folder-kyc',
    tags: ['kyc', 'identity', 'aadhaar'],
    size: 450000, // duplicate size of it-5
    createdAt: Date.now() - 1000 * 3600 * 50,
    updatedAt: Date.now() - 1000 * 3600 * 50,
    isStarred: false,
    isTrash: false,
  },
  {
    id: 'it-5',
    name: 'Aadhaar Card Copy (2).pdf',
    type: 'file',
    category: 'pdf',
    parentId: 'folder-kyc',
    tags: ['kyc', 'identity', 'aadhaar'],
    size: 450000, // exact same size
    createdAt: Date.now() - 1000 * 3600 * 48,
    updatedAt: Date.now() - 1000 * 3600 * 48,
    isStarred: false,
    isTrash: false,
  },
] as unknown as DriveItem[];

export async function runRecommendationsTests() {
  console.log('🧪 Testing [recommendation-engine.ts]...');

  // 1. "For You" Feed Generation
  const forYou = generateForYouFeed(sampleItems, { currentHour: 14, dayOfWeek: 3 }, 4);
  assert.ok(forYou.length > 0, 'For You feed should return recommendations');
  // High urgency item (it-3 expired) or high recency item (it-1) should rank at the top
  assert.ok(forYou.some((r) => r.itemId === 'it-3' || r.itemId === 'it-1'));

  // 2. Pairwise Item Similarity
  const sim = computeItemSimilarity(sampleItems[0], sampleItems[1]);
  assert.ok(sim.similarityPercentage >= 60, 'Work relieving letters should have >60% similarity');
  assert.ok(sim.sharedKeywords.includes('relieving letter') || sim.sharedKeywords.includes('career'));

  // 3. Related Items Generation
  const related = generateRelatedItems(sampleItems[0], sampleItems, {}, 3);
  assert.ok(related.length >= 1, 'Should find related items for relieving letter');
  assert.strictEqual(related[0].itemId, 'it-2', 'Most related item should be it-2');

  // 4. Suggested Actions (Expiry renewal & Dedup detection)
  const actions = generateSuggestedActions(sampleItems, {}, 5);
  assert.ok(actions.length >= 1, 'Should generate suggested actions');
  const renewAction = actions.find((a) => a.actionType === 'renew');
  assert.ok(renewAction, 'Should recommend renewal for expired vehicle insurance');
  assert.strictEqual(renewAction?.itemId, 'it-3');

  const dedupAction = actions.find((a) => a.actionType === 'dedup');
  assert.ok(dedupAction, 'Should identify duplicate documents (it-4 & it-5)');

  console.log('  ✅ [recommendation-engine.ts] passed all assertions.');
}
