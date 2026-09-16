'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDrive } from '@/lib/drive/drive-context';
import { 
  FileCraftTool, 
  ALL_FILECRAFT_TOOLS, 
  getRecommendedToolsForFile, 
  searchFileCraftTools,
  ToolCategory
} from '@/lib/tools/tools-registry';
import { ToolIcon } from '@/components/tools/ToolIcon';
import { triggerHaptic } from '@/lib/drive/haptics';
import { 
  Search, 
  X, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  Layers, 
  Zap, 
  FileText, 
  Check, 
  Command,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export function DriveToolSearchModal() {
  const router = useRouter();
  const {
    isToolSearchOpen,
    setIsToolSearchOpen,
    toolSearchTargetItem,
  } = useDrive();
  useBodyScrollLock(!!toolSearchTargetItem);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all' | 'recommended'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Recommended tools for the current targeted item
  const recommendedTools = useMemo(() => {
    if (!toolSearchTargetItem) return [];
    return getRecommendedToolsForFile(toolSearchTargetItem);
  }, [toolSearchTargetItem]);

  const recommendedIds = useMemo(() => {
    return new Set(recommendedTools.map((t) => t.id));
  }, [recommendedTools]);

  // Filtered & Searched Tools List
  const filteredTools = useMemo(() => {
    let list = searchFileCraftTools(query, toolSearchTargetItem);

    if (selectedCategory === 'recommended' && toolSearchTargetItem) {
      list = list.filter((t) => recommendedIds.has(t.id));
    } else if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category === selectedCategory);
    }

    return list;
  }, [query, toolSearchTargetItem, selectedCategory, recommendedIds]);

  // Reset state on open
  useEffect(() => {
    if (isToolSearchOpen) {
      setQuery('');
      setSelectedCategory(toolSearchTargetItem ? 'recommended' : 'all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isToolSearchOpen, toolSearchTargetItem]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredTools.length]);

  // Handle Keyboard Navigation
  useEffect(() => {
    if (!isToolSearchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredTools.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredTools.length - 1));
      } else if (e.key === 'Enter') {
        if (filteredTools.length > 0) {
          e.preventDefault();
          launchTool(filteredTools[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsToolSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isToolSearchOpen, filteredTools, selectedIndex]);

  // Launch tool with query params
  const launchTool = (tool: FileCraftTool) => {
    if (!tool) return;
    triggerHaptic('success');
    setIsToolSearchOpen(false);

    let url = tool.href;
    if (toolSearchTargetItem) {
      const params = new URLSearchParams();
      params.set('driveId', toolSearchTargetItem.id);
      params.set('name', toolSearchTargetItem.name);
      url += (url.includes('?') ? '&' : '?') + params.toString();
    }

    router.push(url);
  };

  if (!isToolSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 bg-black/75 backdrop-blur-md animate-modal-backdrop">
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-modal-pop">
        
        {/* TOP SEARCH BAR */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50/80 dark:bg-zinc-950/80">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              toolSearchTargetItem
                ? `Search tools for "${toolSearchTargetItem.name}"... (e.g. compress, edit, ocr)`
                : 'Search 50+ specialized FileCraft engines (e.g. remove background, pdf merge, hash)...'
            }
            className="w-full text-sm sm:text-base font-bold bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsToolSearchOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TARGET FILE CONTEXT BANNER */}
        {toolSearchTargetItem && (
          <div className="px-5 py-2.5 bg-rose-500/10 dark:bg-rose-950/30 border-b border-rose-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="text-zinc-500 dark:text-zinc-400">Targeting file:</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400 truncate">
                {toolSearchTargetItem.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-500 uppercase">
                {toolSearchTargetItem.extension || toolSearchTargetItem.category}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
              Selected tool will open this file
            </span>
          </div>
        )}

        {/* CATEGORY FILTER PILLS */}
        <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto select-none bg-white dark:bg-zinc-900">
          {toolSearchTargetItem && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('recommended');
                triggerHaptic('selection');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'recommended'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended ({recommendedTools.length})</span>
            </button>
          )}

          {[
            { id: 'all', label: 'All Tools' },
            { id: 'pdf', label: 'PDF Suite' },
            { id: 'image', label: 'Image Lab' },
            { id: 'ai', label: 'AI & OCR' },
            { id: 'spreadsheet', label: 'Data & Sheets' },
            { id: 'media', label: 'Audio & Video' },
            { id: 'document', label: 'Documents' },
            { id: 'security', label: 'Security & Dev' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id as any);
                triggerHaptic('selection');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* SEARCH RESULTS LIST */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-500">No tools found matching "{query}"</p>
              <p className="text-xs text-zinc-400">Try searching for generic terms like "compress", "convert", "crop", or "edit".</p>
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const isSelected = selectedIndex === idx;
              const isRec = recommendedIds.has(tool.id);

              return (
                <div
                  key={tool.id}
                  onClick={() => launchTool(tool)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20 shadow-md'
                      : 'border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      tool.category === 'pdf'
                        ? 'bg-rose-500/10 text-rose-500'
                        : tool.category === 'image'
                        ? 'bg-purple-500/10 text-purple-500'
                        : tool.category === 'ai'
                        ? 'bg-amber-500/10 text-amber-500'
                        : tool.category === 'spreadsheet'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : tool.category === 'media'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      <ToolIcon name={tool.iconName} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white truncate">
                          {tool.name}
                        </span>
                        
                        {isRec && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-2xs">
                            Recommended
                          </span>
                        )}

                        {tool.badge && !isRec && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {tool.badge}
                          </span>
                        )}

                        <span className="text-[10px] text-zinc-400 font-medium">
                          • {tool.categoryLabel}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>Launch</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER SHORTCUTS HELP */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-zinc-700 dark:text-zinc-300">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-zinc-700 dark:text-zinc-300">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-zinc-700 dark:text-zinc-300">Enter</kbd> to launch</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-zinc-700 dark:text-zinc-300">Esc</kbd> to close</span>
          </div>
          <span className="font-mono">{filteredTools.length} tools available</span>
        </div>

      </div>
    </div>
  );
}
