'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DriveItem } from '@/lib/drive/drive-types';
import { useDrive } from '@/lib/drive/drive-context';
import { getRecommendedToolsForFile, FileCraftTool, searchFileCraftTools } from '@/lib/tools/tools-registry';
import { ToolIcon } from '@/components/tools/ToolIcon';
import { triggerHaptic } from '@/lib/drive/haptics';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Wrench, 
  Zap, 
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';

interface DriveRecommendedToolsSectionProps {
  item: DriveItem;
  compact?: boolean;
}

export function DriveRecommendedToolsSection({ item, compact = false }: DriveRecommendedToolsSectionProps) {
  const router = useRouter();
  const { openToolSearch, openQuickTools } = useDrive();
  const [searchFilter, setSearchFilter] = useState('');

  const recommendedTools = useMemo(() => {
    return getRecommendedToolsForFile(item);
  }, [item]);

  const displayedTools = useMemo(() => {
    if (!searchFilter.trim()) {
      return recommendedTools.slice(0, compact ? 3 : 5);
    }
    return searchFileCraftTools(searchFilter, item).slice(0, 6);
  }, [recommendedTools, searchFilter, item, compact]);

  const handleLaunch = (tool: FileCraftTool) => {
    triggerHaptic('light');
    const params = new URLSearchParams();
    params.set('driveId', item.id);
    params.set('name', item.name);
    const url = `${tool.href}?${params.toString()}`;
    router.push(url);
  };

  if (item.type === 'folder') return null;

  return (
    <div className="space-y-3 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Recommended Tools
          </span>
        </div>
        <button
          type="button"
          onClick={() => openToolSearch(item)}
          className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Search 50+ Tools</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Instant Filter Search Input */}
      {!compact && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter tools (e.g. compress, ocr, edit)..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>
      )}

      {/* Tool Cards List */}
      <div className="space-y-1.5">
        {displayedTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => handleLaunch(tool)}
            className="w-full flex items-center justify-between p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-rose-500 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ToolIcon name={tool.iconName} className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate">
                    {tool.name}
                  </span>
                  {tool.badge && (
                    <span className="px-1 py-0.2 rounded text-[8px] font-extrabold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 line-clamp-1">
                  {tool.description}
                </p>
              </div>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        ))}
      </div>

      {/* Button to open Full Tool Search Modal */}
      <button
        type="button"
        onClick={() => openToolSearch(item)}
        className="w-full py-2 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-rose-500 text-zinc-500 hover:text-rose-500 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Browse All 50+ Specialized Tools...</span>
      </button>
    </div>
  );
}
