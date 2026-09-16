'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  FileText, 
  Folder, 
  Sparkles, 
  Tag, 
  ArrowRight, 
  X, 
  Shield, 
  AlertTriangle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { DriveItem } from '@/lib/drive/drive-types';

interface SearchIntent {
  label: string;
  query: string;
  icon: string;
  description: string;
  count?: number;
  category?: string;
  match?: (it: DriveItem) => boolean;
}

const RAW_INTENTS: SearchIntent[] = [
  {
    label: 'Salary Slips & Payslips',
    query: 'salary slip',
    icon: '💼',
    description: 'Monthly earnings and payslip records',
    category: 'Career',
    match: (it: DriveItem) => {
      const n = it.name.toLowerCase();
      const tags = (it.tags || []).map((t) => t.toLowerCase());
      return n.includes('salary') || n.includes('payslip') || tags.includes('salary slip');
    },
  },
  {
    label: 'Vehicle Registration & Insurance',
    query: 'vehicle insurance',
    icon: '🚗',
    description: 'Vehicle policies & RC cards',
    category: 'Vehicles',
    match: (it: DriveItem) => {
      const n = it.name.toLowerCase();
      const tags = (it.tags || []).map((t) => t.toLowerCase());
      return (
        (it.aiCategory || '').toLowerCase().includes('vehicle') ||
        tags.includes('amaze') ||
        tags.includes('pulsar') ||
        tags.includes('activa') ||
        n.includes('rc') ||
        n.includes('insurance')
      );
    },
  },
  {
    label: 'Property Tax & Registry Deeds',
    query: 'property tax',
    icon: '🏠',
    description: 'Property deeds & municipal tax receipts',
    category: 'Property',
    match: (it: DriveItem) => {
      const n = it.name.toLowerCase();
      const tags = (it.tags || []).map((t) => t.toLowerCase());
      return (
        (it.aiCategory || '').toLowerCase().includes('property') ||
        tags.includes('property') ||
        n.includes('tax') ||
        n.includes('registry')
      );
    },
  },
  {
    label: 'Aadhaar, PAN & KYC IDs',
    query: 'aadhaar pan',
    icon: '🛂',
    description: 'Verified government identity proofs & passbooks',
    category: 'Identity',
    match: (it: DriveItem) => {
      const n = it.name.toLowerCase();
      const tags = (it.tags || []).map((t) => t.toLowerCase());
      return (
        tags.includes('aadhaar') ||
        tags.includes('pan card') ||
        tags.includes('voter id') ||
        tags.includes('passbook') ||
        n.includes('aadhaar') ||
        n.includes('pan') ||
        n.includes('voter')
      );
    },
  },
  {
    label: 'Experience & Relieving Letters',
    query: 'relieving letter',
    icon: '📜',
    description: 'Service certificates and offer letters',
    category: 'Career',
    match: (it: DriveItem) => {
      const n = it.name.toLowerCase();
      return n.includes('relieving') || n.includes('offer') || n.includes('experience');
    },
  },
  {
    label: 'Expiring Documents Radar',
    query: 'expiry',
    icon: '⚠️',
    description: 'Items with approaching renewal deadlines',
    category: 'Urgent',
    match: (it: DriveItem) => it.expiryStatus === 'expiring_soon' || it.expiryStatus === 'expired',
  },
];

interface DriveSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onSelectQuery: (q: string) => void;
  onSelectItem: (item: DriveItem) => void;
  items: DriveItem[];
  recentSearches: string[];
  onClearRecentSearches: () => void;
  onRemoveRecentSearch: (q: string) => void;
}

export function DriveSearchDropdown({
  isOpen,
  onClose,
  query,
  onSelectQuery,
  onSelectItem,
  items,
  recentSearches,
  onClearRecentSearches,
  onRemoveRecentSearch,
}: DriveSearchDropdownProps) {
  // Clean query
  const cleanQuery = (query || '').trim().toLowerCase();

  // 1. Matched instant item previews (Top 5)
  const matchedItems = useMemo(() => {
    if (!cleanQuery) return [];
    return items
      .filter((it) => !it.isTrash)
      .filter((it) => {
        const nameMatch = it.name.toLowerCase().includes(cleanQuery);
        const tagMatch = (it.tags || []).some((t) => t.toLowerCase().includes(cleanQuery));
        const ocrMatch = (it.ocrText || '').toLowerCase().includes(cleanQuery);
        const summaryMatch = (it.aiSummary || '').toLowerCase().includes(cleanQuery);
        return nameMatch || tagMatch || ocrMatch || summaryMatch;
      })
      .slice(0, 5);
  }, [items, cleanQuery]);

  // 2. Dynamically Filtered & Counted Suggested Intents
  const suggestedIntents = useMemo(() => {
    const accessible = (items || []).filter((it) => !it.isTrash);
    const enriched = RAW_INTENTS.map((intent) => {
      const count = intent.match ? accessible.filter(intent.match).length : 0;
      return {
        ...intent,
        count: count > 0 ? count : undefined,
      };
    });

    if (!cleanQuery) return enriched.slice(0, 4);
    return enriched.filter((intent) => 
      intent.label.toLowerCase().includes(cleanQuery) ||
      intent.query.toLowerCase().includes(cleanQuery) ||
      intent.description.toLowerCase().includes(cleanQuery)
    );
  }, [items, cleanQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 right-0 top-full mt-2 max-h-[380px] sm:max-h-[480px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col"
    >

        <div className="p-3 overflow-y-auto space-y-4">
          {/* SECTION 1: INSTANT MATCHED DOCUMENTS (When Query Exists) */}
          {cleanQuery && matchedItems.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-rose-500" />
                  <span>Instant Document Matches</span>
                </span>
                <span>{matchedItems.length} results</span>
              </div>

            <div className="space-y-0.5">
              {matchedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0 group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-colors">
                      {item.type === 'folder' ? (
                        <Folder className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400">
                        {item.name}
                      </div>
                      <div className="text-3xs text-zinc-400 truncate flex items-center gap-1.5">
                        <span>{item.relativePath || 'My Drive'}</span>
                        {item.ocrText && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Full text searchable</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-3xs font-mono font-bold text-zinc-400 group-hover:text-rose-500 shrink-0 flex items-center gap-1">
                    <span>Preview</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: RECENT SEARCHES (If exists and no long query) */}
        {!cleanQuery && recentSearches.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Recent Searches</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearRecentSearches();
                }}
                className="hover:text-rose-500 cursor-pointer font-bold text-3xs lowercase"
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 px-1">
              {recentSearches.map((rec, i) => (
                <div
                  key={i}
                  onClick={() => {
                    onSelectQuery(rec);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer group"
                >
                  <Clock className="w-3 h-3 text-zinc-400 group-hover:text-amber-500" />
                  <span>{rec}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecentSearch(rec);
                    }}
                    className="p-0.5 text-zinc-400 hover:text-rose-500 rounded-md"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: RECOMMENDED SEARCH INTENTS & PROMPTS */}
        <div className="space-y-1.5">
          <div className="px-2 text-3xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-500" />
              <span>Recommended Search Queries</span>
            </span>
            <span className="text-3xs text-violet-500 font-bold">1-Click Discovery</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {suggestedIntents.map((intent, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelectQuery(intent.query);
                  onClose();
                }}
                className="text-left p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900 transition-all flex items-start gap-2.5 group cursor-pointer shadow-2xs"
              >
                <span className="text-base shrink-0 mt-0.5">{intent.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center justify-between">
                    <span className="truncate">{intent.label}</span>
                    {intent.count && (
                      <span className="text-3xs font-mono font-bold text-zinc-400 shrink-0 ml-1">
                        {intent.count} docs
                      </span>
                    )}
                  </div>
                  <p className="text-3xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                    {intent.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 4: SMART SHORTCUTS */}
        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-3xs text-zinc-400 px-2">
          <span>Tip: Use <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-3xs">⌘K</kbd> for Global Omnisearch across files & tools</span>
        </div>
      </div>
    </div>
  );
}
