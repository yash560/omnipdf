import {
  DriveItem,
  DriveRecommendation,
  RecommendationContext,
  DriveRecommendationRationale,
} from './drive-types';

/**
 * Multi-Signal Relevance & Recommendation Engine for FileCraft Drive
 * Implements exponential temporal decay, circadian work/personal shifts,
 * tag co-occurrence graphs, urgency/expiry radar, and semantic similarity.
 */

// Tokenizer & Stopword cleaner for TF-IDF / cosine text comparison
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'or', 'by',
  'with', 'from', 'as', 'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'file', 'document', 'scan'
]);

function extractTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionSize++;
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

/**
 * Calculates temporal decay score (0 - 100)
 */
function calculateTemporalScore(item: DriveItem, now: number): { score: number; rationale?: string } {
  const lastAccess = item.lastAccessedAt || item.updatedAt || item.createdAt;
  const hoursAgo = Math.max(0, (now - lastAccess) / (1000 * 60 * 60));

  // Exponential decay with 72-hour half life
  const decayScore = 100 * Math.exp(-hoursAgo / 72);

  if (hoursAgo < 4) {
    return { score: decayScore, rationale: 'Active in your current session' };
  } else if (hoursAgo < 24) {
    return { score: decayScore, rationale: 'Accessed earlier today' };
  } else if (hoursAgo < 72) {
    return { score: decayScore, rationale: 'Recently viewed this week' };
  }
  return { score: decayScore };
}

/**
 * Evaluates Circadian Work vs. Personal affinity based on current time & day
 */
function calculateCircadianAffinity(
  item: DriveItem,
  hour: number,
  dayOfWeek: number,
  dayOfMonth: number
): { boost: number; rationale?: string; rationaleType?: DriveRecommendationRationale } {
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isWorkHours = hour >= 9 && hour <= 18;
  const isMonthEnd = dayOfMonth >= 25 || dayOfMonth <= 5;

  const itemCategory = (item.aiCategory || item.category || '').toLowerCase();
  const itemName = item.name.toLowerCase();
  const tagsStr = (item.tags || []).join(' ').toLowerCase();

  // 1. Month-end / Payroll affinity
  if (isMonthEnd && (tagsStr.includes('salary') || tagsStr.includes('payroll') || itemName.includes('slip') || itemName.includes('payslip'))) {
    return {
      boost: 45,
      rationale: 'Month-end salary & payroll review',
      rationaleType: 'frequent_work_hours',
    };
  }

  // 2. Weekday Business Hours -> Career, Work, Invoices, Spreadsheets, Code
  if (isWeekday && isWorkHours) {
    if (
      itemCategory.includes('career') ||
      itemCategory.includes('employment') ||
      itemCategory.includes('business') ||
      tagsStr.includes('whydonate') ||
      tagsStr.includes('psymate') ||
      tagsStr.includes('digital convergence') ||
      item.category === 'spreadsheet' ||
      item.category === 'code' ||
      itemName.includes('relieving') ||
      itemName.includes('offer')
    ) {
      return {
        boost: 35,
        rationale: 'Frequently accessed on weekday afternoons',
        rationaleType: 'frequent_work_hours',
      };
    }
  }

  // 3. Evening / Weekend -> Personal, Vehicle, Property, KYC
  if (!isWorkHours || !isWeekday) {
    if (
      itemCategory.includes('vehicle') ||
      itemCategory.includes('property') ||
      itemCategory.includes('identity') ||
      tagsStr.includes('amaze') ||
      tagsStr.includes('pulsar') ||
      tagsStr.includes('ishan park') ||
      tagsStr.includes('aadhaar') ||
      tagsStr.includes('pan card') ||
      item.category === 'image'
    ) {
      return {
        boost: 30,
        rationale: 'Suggested for personal & home management',
        rationaleType: 'predicted_workflow',
      };
    }
  }

  return { boost: 0 };
}

/**
 * Evaluates Urgency & Expiry Radar signals
 */
function calculateUrgencyScore(item: DriveItem): {
  score: number;
  isActionable: boolean;
  actionRationale?: string;
} {
  if (item.expiryStatus === 'expired') {
    return {
      score: 90,
      isActionable: true,
      actionRationale: `⚠️ Document expired (${item.expiryDetails || 'Needs renewal'})`,
    };
  }
  if (item.expiryStatus === 'expiring_soon') {
    const daysLeft = item.expiryDaysLeft ?? 30;
    return {
      score: 75,
      isActionable: true,
      actionRationale: `⏰ Expiring in ${daysLeft} days — Renewal recommended`,
    };
  }
  return { score: 0, isActionable: false };
}

/**
 * Computes Pairwise Semantic & Tag Similarity between two items (0 - 100%)
 */
export function computeItemSimilarity(itemA: DriveItem, itemB: DriveItem): {
  similarityPercentage: number;
  sharedKeywords: string[];
} {
  if (itemA.id === itemB.id) return { similarityPercentage: 100, sharedKeywords: [] };

  const tagsA = new Set((itemA.tags || []).map((t) => t.toLowerCase()));
  const tagsB = new Set((itemB.tags || []).map((t) => t.toLowerCase()));
  const tagJaccard = computeJaccardSimilarity(tagsA, tagsB);

  // Common tags
  const sharedKeywords: string[] = [];
  for (const t of tagsA) {
    if (tagsB.has(t)) sharedKeywords.push(t);
  }

  // Same parent folder boost
  const sameFolder = itemA.parentId === itemB.parentId && itemA.parentId !== null ? 0.25 : 0;

  // AI Category match
  const sameCategory =
    itemA.aiCategory && itemB.aiCategory && itemA.aiCategory.toLowerCase() === itemB.aiCategory.toLowerCase()
      ? 0.2
      : 0;

  // Token overlap on OCR & semantic keywords
  const tokensA = new Set([
    ...extractTokens(itemA.name),
    ...extractTokens(itemA.aiSummary || ''),
    ...(itemA.semanticKeywords || []).map((k) => k.toLowerCase()),
  ]);
  const tokensB = new Set([
    ...extractTokens(itemB.name),
    ...extractTokens(itemB.aiSummary || ''),
    ...(itemB.semanticKeywords || []).map((k) => k.toLowerCase()),
  ]);

  const tokenJaccard = computeJaccardSimilarity(tokensA, tokensB);

  // Combined weighted score
  const rawScore = tagJaccard * 0.4 + tokenJaccard * 0.3 + sameFolder + sameCategory;
  const percentage = Math.min(99, Math.round(rawScore * 100));

  return {
    similarityPercentage: percentage,
    sharedKeywords: sharedKeywords.slice(0, 4),
  };
}

/**
 * Main function to generate ranked "Suggested For You" feed
 */
export function generateForYouFeed(
  items: DriveItem[],
  context: RecommendationContext = {},
  limit = 6
): DriveRecommendation[] {
  const now = Date.now();
  const dateObj = new Date();
  const currentHour = context.currentHour ?? dateObj.getHours();
  const dayOfWeek = context.dayOfWeek ?? dateObj.getDay();
  const dayOfMonth = dateObj.getDate();
  const dismissed = new Set(context.dismissedIds || []);

  const scored: DriveRecommendation[] = [];

  for (const item of items) {
    // 1. Suppression filters
    if (item.isTrash) continue;
    if (dismissed.has(item.id)) continue;
    if (item.isVault && !context.isVaultUnlocked) continue;

    let totalScore = 0;
    let rationale = 'Predicted document you may need';
    let rationaleType: DriveRecommendationRationale = 'predicted_workflow';

    // A. Temporal Recency
    const { score: tempScore, rationale: tempRationale } = calculateTemporalScore(item, now);
    totalScore += tempScore * 0.35;
    if (tempRationale) {
      rationale = tempRationale;
      rationaleType = 'recently_active';
    }

    // B. Circadian & Work Shift Affinity
    const { boost: circBoost, rationale: circRationale, rationaleType: circType } = calculateCircadianAffinity(
      item,
      currentHour,
      dayOfWeek,
      dayOfMonth
    );
    totalScore += circBoost;
    if (circRationale && circBoost > 25) {
      rationale = circRationale;
      rationaleType = circType || 'frequent_work_hours';
    }

    // C. Starred Boost
    if (item.isStarred) {
      totalScore += 25;
      if (totalScore > 60 && !circRationale) {
        rationale = 'Starred high-priority document';
        rationaleType = 'starred';
      }
    }

    // D. Expiry / Renewal Priority
    const { score: urgencyScore, actionRationale } = calculateUrgencyScore(item);
    if (urgencyScore > 0) {
      totalScore += urgencyScore;
      if (actionRationale) {
        rationale = actionRationale;
        rationaleType = 'expiring_soon';
      }
    }

    // E. Folder Context Lineage
    if (context.activeFolderId && item.parentId === context.activeFolderId) {
      totalScore += 15;
    }

    const confidence = Math.min(0.99, Math.max(0.45, totalScore / 150));

    scored.push({
      id: `rec_foryou_${item.id}`,
      itemId: item.id,
      item,
      score: Math.round(totalScore),
      stream: 'for_you',
      rationale,
      rationaleType,
      confidence: parseFloat(confidence.toFixed(2)),
      badgeText: item.aiCategory || (item.category ? item.category.toUpperCase() : 'DOC'),
    });
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Return top unique items
  return scored.slice(0, limit);
}

/**
 * Main function to generate "Contextual Actions & Smart Fixes"
 */
export function generateSuggestedActions(
  items: DriveItem[],
  context: RecommendationContext = {},
  limit = 5
): DriveRecommendation[] {
  const actions: DriveRecommendation[] = [];
  const dismissed = new Set(context.dismissedIds || []);

  // 1. Expiring Documents Actions
  const expiringItems = items.filter(
    (it) => !it.isTrash && (it.expiryStatus === 'expiring_soon' || it.expiryStatus === 'expired')
  );

  for (const it of expiringItems) {
    if (dismissed.has(`action_renew_${it.id}`)) continue;
    actions.push({
      id: `action_renew_${it.id}`,
      itemId: it.id,
      item: it,
      score: it.expiryStatus === 'expired' ? 95 : 85,
      stream: 'suggested_action',
      rationale: it.expiryStatus === 'expired' ? `Review expired ${it.name}` : `Renew upcoming expiry for ${it.name}`,
      rationaleType: 'expiring_soon',
      confidence: 0.95,
      actionType: 'renew',
      actionPayload: { expiryType: it.expiryType, expiryDate: it.expiryDate },
      badgeText: it.expiryStatus === 'expired' ? 'EXPIRED' : 'RENEWAL',
    });
  }

  // 2. Duplicate Scans / Redundant Docs Actions
  const sizeMap = new Map<number, DriveItem[]>();
  for (const it of items) {
    if (it.isTrash || it.type === 'folder' || it.size < 1000) continue;
    const list = sizeMap.get(it.size) || [];
    list.push(it);
    sizeMap.set(it.size, list);
  }

  const dupClusters = Array.from(sizeMap.values()).filter((list) => list.length > 1);
  if (dupClusters.length > 0 && !dismissed.has('action_dedup_all')) {
    const totalDupSavings = dupClusters.reduce((acc, list) => acc + list[0].size * (list.length - 1), 0);
    const savingsMb = (totalDupSavings / (1024 * 1024)).toFixed(1);
    const sampleItem = dupClusters[0][0];

    actions.push({
      id: 'action_dedup_all',
      itemId: sampleItem.id,
      item: sampleItem,
      score: 80,
      stream: 'suggested_action',
      rationale: `Found ${dupClusters.length} duplicate document sets — Free up ${savingsMb} MB`,
      rationaleType: 'cleanup_candidate',
      confidence: 0.9,
      actionType: 'dedup',
      badgeText: 'CLEANUP',
    });
  }

  // 3. Unlocked Vault Action or Veiled Items Reminder
  if (!context.isVaultUnlocked) {
    const vaultCount = items.filter((it) => it.isVault && !it.isTrash).length;
    if (vaultCount > 0 && !dismissed.has('action_vault_unlock')) {
      const firstVault = items.find((it) => it.isVault) || items[0];
      actions.push({
        id: 'action_vault_unlock',
        itemId: firstVault.id,
        item: firstVault,
        score: 75,
        stream: 'suggested_action',
        rationale: `Unlock Secure Vault to view ${vaultCount} protected identity & tax cards`,
        rationaleType: 'missing_dossier_item',
        confidence: 0.88,
        actionType: 'open_folder',
        actionPayload: { section: 'vault' },
        badgeText: 'VAULT',
      });
    }
  }

  // 4. Multi-salary slips merge opportunity
  const salarySlips = items.filter(
    (it) =>
      !it.isTrash &&
      it.type === 'file' &&
      it.extension === 'pdf' &&
      (it.name.toLowerCase().includes('salary slip') || (it.tags || []).includes('Salary Slip'))
  );

  if (salarySlips.length >= 3 && !dismissed.has('action_merge_salary')) {
    actions.push({
      id: 'action_merge_salary',
      itemId: salarySlips[0].id,
      item: salarySlips[0],
      score: 70,
      stream: 'suggested_action',
      rationale: `Merge ${salarySlips.length} salary slips into a unified Annual Tax Dossier PDF`,
      rationaleType: 'predicted_workflow',
      confidence: 0.85,
      actionType: 'merge',
      actionPayload: { itemsCount: salarySlips.length, itemIds: salarySlips.map((s) => s.id) },
      badgeText: 'MERGE',
    });
  }

  actions.sort((a, b) => b.score - a.score);
  return actions.slice(0, limit);
}

/**
 * Computes Contextual "Related Documents" for a selected/previewed item
 */
export function generateRelatedItems(
  targetItem: DriveItem,
  allItems: DriveItem[],
  context: RecommendationContext = {},
  limit = 5
): DriveRecommendation[] {
  const related: DriveRecommendation[] = [];

  for (const item of allItems) {
    if (item.id === targetItem.id || item.isTrash) continue;
    if (item.isVault && !context.isVaultUnlocked) continue;

    const { similarityPercentage, sharedKeywords } = computeItemSimilarity(targetItem, item);

    if (similarityPercentage > 20) {
      let rationale = `${similarityPercentage}% match based on common entities`;
      if (sharedKeywords.length > 0) {
        rationale = `Shared tags: ${sharedKeywords.slice(0, 3).join(', ')}`;
      } else if (item.parentId === targetItem.parentId) {
        rationale = 'Co-located in the same project directory';
      }

      related.push({
        id: `rec_rel_${targetItem.id}_${item.id}`,
        itemId: item.id,
        item,
        score: similarityPercentage,
        stream: 'related',
        rationale,
        rationaleType: 'semantic_match',
        confidence: similarityPercentage / 100,
        similarityScore: similarityPercentage,
        sharedKeywords,
        badgeText: `${similarityPercentage}% MATCH`,
      });
    }
  }

  related.sort((a, b) => b.score - a.score);
  return related.slice(0, limit);
}
