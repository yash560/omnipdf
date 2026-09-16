import { DriveItem, SearchFilterOptions, SearchResult, DriveCategory } from './drive-types';
import { getOcrSnippet } from '../ai/ocr-indexer';

// Semantic Concept Dictionaries for Intent Expansion
const CONCEPT_EXPANSIONS: Record<string, string[]> = {
  identity: ['aadhaar', 'aadhar', 'pan', 'passport', 'voter', 'driving', 'licence', 'license', 'dl', 'kyc', 'uidai', 'epic'],
  id: ['aadhaar', 'aadhar', 'pan', 'passport', 'voter', 'driving', 'licence', 'license', 'dl', 'kyc', 'uidai'],
  kyc: ['aadhaar', 'aadhar', 'pan', 'passport', 'voter', 'driving', 'licence', 'license', 'dl', 'bank'],
  salary: ['payslip', 'pay slip', 'earnings', 'compensation', 'payroll', 'whydonate', 'psymate', 'hyperbeans', 'dct', 'outworks', 'income'],
  payslip: ['salary', 'earnings', 'compensation', 'payroll', 'income proof'],
  work: ['salary', 'payslip', 'offer letter', 'relieving', 'experience', 'resume', 'whydonate', 'psymate', 'dct', 'repsoft', 'molog'],
  job: ['offer letter', 'relieving', 'experience', 'resume', 'salary', 'recommendation', 'joining'],
  career: ['resume', 'cv', 'offer letter', 'experience', 'relieving', 'recommendation'],
  vehicle: ['amaze', 'pulsar', 'activa', 'star city', 'tvs', 'honda', 'bajaj', 'rc', 'puc', 'insurance', 'car', 'bike'],
  car: ['amaze', 'honda amaze', 'rc', 'puc', 'insurance', 'vehicle', 'car bills'],
  bike: ['pulsar', 'activa', 'star city', 'tvs', 'bajaj', 'rc', 'puc', 'insurance'],
  dad: ['yogesh', 'yogesh jain', 'father'],
  father: ['yogesh', 'yogesh jain', 'dad'],
  yash: ['yash jain', 'yaash', 'my'],
  mom: ['simpal', 'simpal jain', 'mother'],
  mother: ['simpal', 'simpal jain', 'mom'],
  shreya: ['shreya jain', 'sister'],
  bank: ['sbi', 'icici', 'cheque', 'passbook', 'statement', 'debit', 'credit', 'account'],
  cheque: ['cancelled cheque', 'sbi', 'icici', 'bank', 'check'],
  tax: ['pan card', 'tax invoice', 'income tax', 'municipal tax', 'tds', 'form 16', 'gst'],
  bills: ['invoice', 'receipt', 'tax invoice', 'electricity', 'amaze bills', 'expenses'],
  invoice: ['bill', 'tax invoice', 'receipt', 'payment', 'purchase'],
  insurance: ['policy', 'coverage', 'schedule', 'premium', 'pulsar insurance', 'amaze insurance', 'lic', 'mediclaim'],
  property: ['registry', 'electricity', 'municipal', 'flat', 'house', 'land', 'deed', 'ishan park', 'sapphire'],
  education: ['degree', 'mtech', 'btech', 'certificate', 'diploma', 'marksheet', 'school', 'college'],
  resume: ['cv', 'curriculum vitae', 'profile', 'bio', 'internshala'],
};

/**
 * Clean and tokenize a text string
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Fast Levenshtein distance for fuzzy typo tolerance
 */
function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const v0 = new Array(s2.length + 1);
  const v1 = new Array(s2.length + 1);

  for (let i = 0; i <= s2.length; i++) v0[i] = i;

  for (let i = 0; i < s1.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= s2.length; j++) v0[j] = v1[j];
  }

  return v0[s2.length];
}

/**
 * Fuzzy similarity score (0.0 to 1.0)
 */
function fuzzySimilarity(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Master Hybrid Semantic, OCR & Fuzzy Search Algorithm
 */
export function searchDriveItems(
  items: DriveItem[],
  options: SearchFilterOptions
): SearchResult {
  const rawQuery = (options.query || '').trim().toLowerCase();
  const queryTokens = tokenize(rawQuery);

  // Expand query tokens with semantic concepts
  const expandedConcepts = new Set<string>();
  queryTokens.forEach((token) => {
    expandedConcepts.add(token);
    if (CONCEPT_EXPANSIONS[token]) {
      CONCEPT_EXPANSIONS[token].forEach((syn) => expandedConcepts.add(syn.toLowerCase()));
    }
  });

  const expandedList = Array.from(expandedConcepts);
  const scoredItems: { item: DriveItem; score: number; matchedTerms: Set<string> }[] = [];

  for (const item of items) {
    // 1. Hard filters & Section constraints
    if (options.section === 'trash' && !item.isTrash) continue;
    if (options.section !== 'trash' && item.isTrash) continue;
    if (options.section === 'starred' && !item.isStarred) continue;
    if (options.section === 'vault') {
      if (!item.isVault) continue;
    } else if (item.isVault && !options.isVaultUnlocked) {
      // Hide locked vault items from general browsing unless unlocked
      continue;
    }

    if (options.section === 'expiry') {
      if (!item.expiryStatus || item.expiryStatus === 'none') continue;
    }

    if (options.category && item.category !== options.category) continue;
    if (options.aiCategory && item.aiCategory !== options.aiCategory) continue;
    if (options.parentId !== undefined && item.parentId !== options.parentId) continue;

    // Type filter (files, folders, ocr, vault, expiry, or specific categories)
    if (options.typeFilter && options.typeFilter !== 'all') {
      const tf = options.typeFilter.toLowerCase();
      if (tf === 'folders' && item.type !== 'folder') continue;
      if (tf === 'files' && item.type !== 'file') continue;
      if (tf === 'ocr' && (!item.ocrText || item.ocrText.trim().length === 0)) continue;
      if (tf === 'vault' && !item.isVault) continue;
      if (tf === 'expiry' && (!item.expiryStatus || item.expiryStatus === 'none')) continue;
      if (['pdf', 'image', 'spreadsheet', 'document', 'media', 'code', 'archive', 'other'].includes(tf)) {
        if (item.category !== tf) continue;
      }
    }

    // Person facet filter
    if (options.person) {
      const p = options.person.toLowerCase();
      const combinedMeta = `${item.name} ${item.relativePath || ''} ${(item.tags || []).join(' ')} ${item.ocrText || ''}`.toLowerCase();
      if (!combinedMeta.includes(p)) continue;
    }

    // Vehicle facet filter
    if (options.vehicle) {
      const v = options.vehicle.toLowerCase();
      const combinedMeta = `${item.name} ${item.relativePath || ''} ${(item.tags || []).join(' ')} ${item.ocrText || ''}`.toLowerCase();
      if (!combinedMeta.includes(v)) continue;
    }

    if (options.tag) {
      const hasTag = (item.tags || []).some(
        (t) => t.toLowerCase() === options.tag!.toLowerCase()
      );
      if (!hasTag) continue;
    }

    if (options.dateRange && options.dateRange !== 'all') {
      const now = Date.now();
      const itemTime = item.updatedAt || item.createdAt;
      if (options.dateRange === 'today' && now - itemTime > 24 * 3600 * 1000) continue;
      if (options.dateRange === 'week' && now - itemTime > 7 * 24 * 3600 * 1000) continue;
      if (options.dateRange === 'month' && now - itemTime > 30 * 24 * 3600 * 1000) continue;
      if (options.dateRange === 'year' && now - itemTime > 365 * 24 * 3600 * 1000) continue;
    }

    // If query is empty, match all filtered items with base score
    if (!rawQuery) {
      scoredItems.push({ item, score: item.isStarred ? 10 : 1, matchedTerms: new Set() });
      continue;
    }

    // 2. Score Calculation
    let score = 0;
    const matchedTerms = new Set<string>();

    const itemName = item.name.toLowerCase();
    const itemPath = (item.relativePath || '').toLowerCase();
    const itemTags = (item.tags || []).map((t) => t.toLowerCase());
    const itemKeywords = (item.semanticKeywords || []).map((k) => k.toLowerCase());
    const itemSummary = (item.aiSummary || '').toLowerCase();
    const itemAiCategory = (item.aiCategory || '').toLowerCase();
    const itemOcrText = (item.ocrText || '').toLowerCase();

    // A. Full Exact String Match
    if (itemName === rawQuery) {
      score += 100;
      matchedTerms.add(item.name);
    } else if (itemName.includes(rawQuery)) {
      score += 60;
      matchedTerms.add(rawQuery);
    }

    // OCR Full Text Exact Match
    if (itemOcrText.includes(rawQuery)) {
      score += 70;
      matchedTerms.add(`OCR: "${rawQuery}"`);
    }

    // B. Token-by-Token Match & Fuzzy Comparison
    for (const token of queryTokens) {
      // Direct token in filename
      if (itemName.includes(token)) {
        score += 35;
        matchedTerms.add(token);
      } else {
        // Fuzzy token match against filename words
        const nameWords = tokenize(itemName);
        for (const word of nameWords) {
          if (word.length >= 3 && token.length >= 3) {
            const sim = fuzzySimilarity(token, word);
            if (sim >= 0.75) {
              score += Math.round(sim * 25);
              matchedTerms.add(word);
              break;
            }
          }
        }
      }

      // Tag exact or partial match
      for (const tag of itemTags) {
        if (tag === token || tag.includes(token)) {
          score += 40;
          matchedTerms.add(tag);
        } else if (tag.length >= 3 && token.length >= 3) {
          const sim = fuzzySimilarity(token, tag);
          if (sim >= 0.8) {
            score += 20;
            matchedTerms.add(tag);
          }
        }
      }

      // Path / Folder context match
      if (itemPath.includes(token)) {
        score += 25;
        matchedTerms.add(token);
      }

      // AI Category match
      if (itemAiCategory.includes(token)) {
        score += 30;
        matchedTerms.add(item.aiCategory || token);
      }

      // AI Summary match
      if (itemSummary.includes(token)) {
        score += 20;
        matchedTerms.add(token);
      }

      // Semantic keywords match
      for (const kw of itemKeywords) {
        if (kw === token || kw.includes(token)) {
          score += 30;
          matchedTerms.add(kw);
        }
      }

      // OCR Deep Text Token Match
      if (itemOcrText.includes(token)) {
        score += 35;
        matchedTerms.add(token);
      }
    }

    // C. Semantic Concept Expansion Matches
    for (const concept of expandedList) {
      if (queryTokens.includes(concept)) continue; // already scored above

      if (itemName.includes(concept)) {
        score += 25;
        matchedTerms.add(concept);
      }
      if (itemTags.some((t) => t.includes(concept))) {
        score += 25;
        matchedTerms.add(concept);
      }
      if (itemKeywords.some((k) => k.includes(concept))) {
        score += 20;
        matchedTerms.add(concept);
      }
      if (itemPath.includes(concept)) {
        score += 15;
        matchedTerms.add(concept);
      }
      if (itemOcrText.includes(concept)) {
        score += 15;
        matchedTerms.add(concept);
      }
    }

    // D. Starred & Recency Boosts
    if (score > 0) {
      if (item.isStarred) score += 5;
      const recencyDays = (Date.now() - (item.updatedAt || item.createdAt)) / (1000 * 3600 * 24);
      if (recencyDays < 7) score += 5;
      else if (recencyDays < 30) score += 2;

      const ocrSnippet = item.ocrText ? getOcrSnippet(item.ocrText, rawQuery) || undefined : undefined;

      scoredItems.push({
        item: {
          ...item,
          searchScore: score,
          matchedTerms: Array.from(matchedTerms),
          ocrSnippet,
        },
        score,
        matchedTerms,
      });
    }
  }

  // 3. Sorting & Ranking
  const sortMode = options.sort || (rawQuery ? 'relevance' : 'date');

  scoredItems.sort((a, b) => {
    if (sortMode === 'relevance') {
      return b.score - a.score;
    }
    if (sortMode === 'date') {
      return (b.item.updatedAt || 0) - (a.item.updatedAt || 0);
    }
    if (sortMode === 'name') {
      return a.item.name.localeCompare(b.item.name);
    }
    if (sortMode === 'size') {
      return b.item.size - a.item.size;
    }
    if (sortMode === 'expiry') {
      const expA = a.item.expiryDate || Infinity;
      const expB = b.item.expiryDate || Infinity;
      return expA - expB;
    }
    return b.score - a.score;
  });

  const finalItems = scoredItems.map((s) => s.item);

  // 4. Facet Aggregations
  const tagCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const it of finalItems) {
    (it.tags || []).forEach((t) => {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    });
    if (it.aiCategory) {
      categoryCounts.set(it.aiCategory, (categoryCounts.get(it.aiCategory) || 0) + 1);
    }
  }

  const availableTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const availableAiCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const limitedItems = (options.limit && options.limit > 0) ? finalItems.slice(0, options.limit) : finalItems;

  return {
    items: limitedItems,
    totalMatches: finalItems.length,
    availableTags,
    availableAiCategories,
  };
}
