import { DriveItem, SearchFilterOptions, SearchResult, DriveCategory } from './drive-types';
import { getOcrSnippet } from '../ai/ocr-indexer';

// Comprehensive Semantic Concept Dictionaries for Intent Expansion
const CONCEPT_EXPANSIONS: Record<string, string[]> = {
  // Identity Proofs (Strict specific variants)
  pan: ['pancard', 'pan card', 'pan number', 'nsdl', 'uti', 'form 49a'],
  pancard: ['pan', 'pan card', 'pan number', 'nsdl', 'uti', 'form 49a'],
  aadhaar: ['aadhar', 'adhaar', 'adhar', 'uidai', 'uid', 'eaadhaar', 'e aadhaar'],
  aadhar: ['aadhaar', 'adhaar', 'adhar', 'uidai', 'uid', 'eaadhaar', 'e aadhaar'],
  adhar: ['aadhaar', 'aadhar', 'adhaar', 'uidai', 'uid', 'eaadhaar', 'e aadhaar'],
  adhaar: ['aadhaar', 'aadhar', 'adhar', 'uidai', 'uid', 'eaadhaar', 'e aadhaar'],
  uidai: ['aadhaar', 'aadhar', 'adhaar', 'adhar'],
  voter: ['voter id', 'epic', 'election commission', 'voter card', 'voter id card'],
  passport: ['passport', 'passport photo', 'republic of india'],
  driving: ['driving licence', 'driving license', 'license', 'licence', 'dl'],
  license: ['driving license', 'driving licence', 'licence', 'dl'],
  licence: ['driving licence', 'driving license', 'license', 'dl'],
  dl: ['driving licence', 'driving license', 'license', 'licence'],

  // High-level categories (Only when user explicitly searches the generic category)
  identity: ['aadhaar', 'aadhar', 'pan', 'passport', 'voter', 'driving', 'dl', 'kyc', 'uidai', 'epic'],
  id: ['aadhaar', 'aadhar', 'pan', 'passport', 'voter', 'driving', 'dl', 'kyc', 'uidai'],
  kyc: ['aadhaar', 'aadhar', 'pan', 'passport', 'voter', 'driving', 'dl'],

  // People & Family Relationships (Asymmetric: generic terms -> specific name, but specific names -> only that person)
  dad: ['yogesh', 'yogesh jain'],
  father: ['yogesh', 'yogesh jain'],
  yogesh: ['yogesh jain'],
  mom: ['simpal', 'simpal jain'],
  mother: ['simpal', 'simpal jain'],
  simpal: ['simpal jain'],
  shreya: ['shreya jain'],
  sister: ['shreya', 'shreya jain'],
  yash: ['yash jain', 'yaash'],

  // Vehicles (Strict separation between car and bike)
  amaze: ['honda amaze', 'amaze bills', 'honda'],
  car: ['amaze', 'honda amaze', 'car bills'],
  pulsar: ['pulsar 150', 'bajaj pulsar'],
  activa: ['honda activa'],
  bike: ['pulsar', 'activa', 'star city', 'tvs', 'bajaj'],
  vehicle: ['amaze', 'pulsar', 'activa', 'star city', 'tvs', 'honda', 'bajaj', 'rc', 'puc', 'insurance'],
  rc: ['registration certificate', 'rc book', 'rc registration', 'certificate of registration'],
  puc: ['pollution under control', 'pollution', 'emission'],

  // Career & Work
  salary: ['payslip', 'pay slip', 'earnings', 'compensation', 'payroll'],
  payslip: ['salary', 'pay slip', 'earnings', 'compensation', 'payroll'],
  offer: ['offer letter', 'job offer', 'appointment letter', 'joining letter'],
  relieving: ['relieving letter', 'experience letter', 'service certificate'],
  resume: ['cv', 'curriculum vitae', 'profile', 'bio'],

  // Finance, Bank & Tax
  bank: ['sbi', 'icici', 'cheque', 'passbook', 'statement', 'debit', 'credit', 'account', 'hdfc'],
  cheque: ['cancelled cheque', 'sbi', 'icici', 'check'],
  tax: ['tax invoice', 'income tax', 'municipal tax', 'tds', 'form 16', 'gst'],
  bills: ['invoice', 'receipt', 'tax invoice', 'electricity', 'amaze bills', 'expenses'],
  invoice: ['bill', 'tax invoice', 'receipt', 'payment', 'purchase'],
  insurance: ['policy', 'coverage', 'schedule', 'premium', 'lic', 'mediclaim', 'policy schedule'],

  // Property & Education
  property: ['ishan park', 'sapphire', 'registry', 'municipal tax', 'deed', 'flat', 'house'],
  education: ['degree', 'mtech', 'btech', 'certificate', 'diploma', 'marksheet', 'school', 'college', 'vit'],
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
 * Master Hybrid Semantic, OCR & Multi-Token Conjunction Search Algorithm
 */
export function searchDriveItems(
  items: DriveItem[],
  options: SearchFilterOptions
): SearchResult {
  const rawQuery = (options.query || '').trim().toLowerCase();
  const queryTokens = tokenize(rawQuery);
  const numTokens = queryTokens.length;

  // Build per-token concept dictionary
  const tokenExpansions: Map<string, string[]> = new Map();
  queryTokens.forEach((token) => {
    const synonyms = new Set<string>();
    synonyms.add(token);
    if (CONCEPT_EXPANSIONS[token]) {
      CONCEPT_EXPANSIONS[token].forEach((s) => synonyms.add(s.toLowerCase()));
    }
    tokenExpansions.set(token, Array.from(synonyms));
  });

  const scoredItems: { item: DriveItem; score: number; matchedTerms: Set<string>; matchedTokenCount: number }[] = [];

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
      scoredItems.push({ item, score: item.isStarred ? 10 : 1, matchedTerms: new Set(), matchedTokenCount: 0 });
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
    const combinedItemText = `${itemName} ${itemPath} ${itemTags.join(' ')} ${itemKeywords.join(' ')} ${itemSummary} ${itemAiCategory} ${itemOcrText}`;

    // A. Full Exact Query Phrase Match
    if (itemName === rawQuery) {
      score += 200;
      matchedTerms.add(item.name);
    } else if (itemName.includes(rawQuery)) {
      score += 120;
      matchedTerms.add(rawQuery);
    }

    if (itemPath.includes(rawQuery)) {
      score += 80;
      matchedTerms.add(`Path: "${rawQuery}"`);
    }

    if (itemOcrText.includes(rawQuery)) {
      score += 90;
      matchedTerms.add(`OCR: "${rawQuery}"`);
    }

    // B. Token-by-Token Match & Conjunction Verification
    const nameWords = tokenize(itemName);
    const pathWords = tokenize(itemPath);
    const tagWords = itemTags.flatMap((t) => tokenize(t));
    const allItemWords = tokenize(combinedItemText);
    let matchedTokenCount = 0;

    for (let i = 0; i < queryTokens.length; i++) {
      const token = queryTokens[i];
      const expansions = tokenExpansions.get(token) || [token];
      let tokenMatchedInItem = false;
      let tokenScore = 0;

      // 1. Filename match
      if (nameWords.includes(token)) {
        tokenScore += 45;
        tokenMatchedInItem = true;
        matchedTerms.add(token);
      } else if (token.length >= 4 && itemName.includes(token)) {
        tokenScore += 35;
        tokenMatchedInItem = true;
        matchedTerms.add(token);
      } else if (token.length >= 4) {
        for (const word of nameWords) {
          if (word.length >= 4) {
            const sim = fuzzySimilarity(token, word);
            if (sim >= 0.82) {
              tokenScore += Math.round(sim * 30);
              tokenMatchedInItem = true;
              matchedTerms.add(word);
              break;
            }
          }
        }
      }

      // 2. Tags match
      if (!tokenMatchedInItem) {
        for (const tag of itemTags) {
          const tWords = tokenize(tag);
          if (tWords.includes(token) || tag === token) {
            tokenScore += 40;
            tokenMatchedInItem = true;
            matchedTerms.add(tag);
            break;
          } else if (token.length >= 4 && tag.includes(token)) {
            tokenScore += 30;
            tokenMatchedInItem = true;
            matchedTerms.add(tag);
            break;
          }
        }
      }

      // 3. Path / Folder context match
      if (!tokenMatchedInItem) {
        if (pathWords.includes(token)) {
          tokenScore += 30;
          tokenMatchedInItem = true;
          matchedTerms.add(token);
        } else if (token.length >= 4 && itemPath.includes(token)) {
          tokenScore += 25;
          tokenMatchedInItem = true;
          matchedTerms.add(token);
        }
      }

      // 4. AI Category & Keywords
      if (!tokenMatchedInItem) {
        if (itemAiCategory.includes(token)) {
          tokenScore += 25;
          tokenMatchedInItem = true;
          matchedTerms.add(item.aiCategory || token);
        }
        for (const kw of itemKeywords) {
          if (kw === token || (token.length >= 4 && kw.includes(token))) {
            tokenScore += 25;
            tokenMatchedInItem = true;
            matchedTerms.add(kw);
            break;
          }
        }
      }

      // 5. OCR Deep Text Token Match
      if (!tokenMatchedInItem && itemOcrText) {
        if (token.length <= 3) {
          const ocrWords = tokenize(itemOcrText);
          if (ocrWords.includes(token)) {
            tokenScore += 30;
            tokenMatchedInItem = true;
            matchedTerms.add(token);
          }
        } else if (itemOcrText.includes(token)) {
          tokenScore += 30;
          tokenMatchedInItem = true;
          matchedTerms.add(token);
        }
      }

      // 6. If token wasn't directly matched, check concept expansions
      if (!tokenMatchedInItem) {
        for (const concept of expansions) {
          if (concept === token) continue;
          if (concept.length <= 3) {
            if (allItemWords.includes(concept)) {
              tokenScore += 25;
              tokenMatchedInItem = true;
              matchedTerms.add(concept);
              break;
            }
          } else if (combinedItemText.includes(concept)) {
            tokenScore += 25;
            tokenMatchedInItem = true;
            matchedTerms.add(concept);
            break;
          }
        }
      }

      if (tokenMatchedInItem) {
        matchedTokenCount++;
        score += tokenScore;
      }
    }

    // C. Multi-Token Conjunction Filtering & Multiplier Logic
    if (numTokens >= 2) {
      const matchRatio = matchedTokenCount / numTokens;

      // Strict filter: If user searched 2+ tokens, require at least 50% match
      if (matchRatio < 0.5) {
        continue; // Discard completely irrelevant items that only hit 1 word out of 3+
      }

      // If item matched ALL query tokens (100% conjunction)
      if (matchedTokenCount === numTokens) {
        score += 350; // Massive conjunction bonus
      } else {
        // Partial token match: heavily discount so full matches win unconditionally
        score = Math.round(score * 0.45);
      }
    } else if (matchedTokenCount === 0 && score === 0) {
      continue;
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
        matchedTokenCount,
      });
    }
  }

  // 3. Sorting & Ranking
  const sortMode = options.sort || (rawQuery ? 'relevance' : 'date');

  // If multi-token query and we have full conjunction matches, strictly keep full matches
  let candidateItems = scoredItems;
  if (numTokens >= 2) {
    const fullMatches = scoredItems.filter((s) => s.matchedTokenCount === numTokens);
    if (fullMatches.length > 0) {
      candidateItems = fullMatches;
    }
  }

  candidateItems.sort((a, b) => {
    if (sortMode === 'relevance') {
      // First sort by number of matched tokens (conjunction priority)
      if (numTokens >= 2 && b.matchedTokenCount !== a.matchedTokenCount) {
        return b.matchedTokenCount - a.matchedTokenCount;
      }
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

  const finalItems = candidateItems.map((s) => s.item);

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
