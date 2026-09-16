'use client';

import React, { useMemo } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveItem } from '@/lib/drive/drive-types';
import { generateRelatedItems } from '@/lib/drive/recommendation-engine';
import { Sparkles, FileText, ChevronRight } from 'lucide-react';

interface DriveRelatedItemsProps {
  item: DriveItem;
  onSelectItem?: (item: DriveItem) => void;
  maxItems?: number;
}

export function DriveRelatedItems({
  item,
  onSelectItem,
  maxItems = 4,
}: DriveRelatedItemsProps) {
  const { items, openPreview, isVaultUnlocked } = useDrive();

  const related = useMemo(() => {
    if (!item) return [];
    return generateRelatedItems(item, items, { isVaultUnlocked }, maxItems);
  }, [item, items, isVaultUnlocked, maxItems]);

  if (related.length === 0) {
    return null;
  }

  const handleSelect = (relItem: DriveItem) => {
    if (onSelectItem) {
      onSelectItem(relItem);
    } else {
      openPreview(relItem);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Related Documents</span>
        </h4>
        <span className="text-[10px] font-bold text-zinc-400">
          AI Semantic Match
        </span>
      </div>

      <div className="space-y-1.5">
        {related.map((rel) => (
          <div
            key={rel.id}
            onClick={() => handleSelect(rel.item)}
            className="group flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <div className="w-6 h-6 rounded-md bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {rel.item.name}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  {rel.rationale}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {rel.similarityScore}%
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
