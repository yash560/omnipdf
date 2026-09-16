'use client';

import React, { useState } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import {
  Search,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  Download,
  Trash2,
  FolderInput,
  Star,
  CheckSquare,
  ChevronRight,
  RotateCcw,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { DriveSortField } from '@/lib/drive/drive-types';

interface DriveToolbarProps {
  onOpenMoveModal: () => void;
  onOpenEmptyTrashConfirm: () => void;
}

export function DriveToolbar({ onOpenMoveModal, onOpenEmptyTrashConfirm }: DriveToolbarProps) {
  const {
    breadcrumbs,
    navigateToFolder,
    viewSection,
    selectedCategory,
    selectedTag,
    setSelectedTag,
    selectedAiCategory,
    setSelectedAiCategory,
    availableTags,
    triggerAutoLabel,
    viewLayout,
    setViewLayout,
    sortOption,
    setSortOption,
    searchTerm,
    setSearchTerm,
    selectedIds,
    items,
    clearSelection,
    selectAll,
    trashSelected,
    restoreSelected,
    deleteSelectedPermanently,
    emptyTrash,
  } = useDrive();

  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const hasSelection = selectedIds.length > 0;

  const sortOptions: { label: string; field: DriveSortField; order: 'asc' | 'desc' }[] = [
    { label: 'Name (A to Z)', field: 'name', order: 'asc' },
    { label: 'Name (Z to A)', field: 'name', order: 'desc' },
    { label: 'Last Modified (Newest)', field: 'updatedAt', order: 'desc' },
    { label: 'Last Modified (Oldest)', field: 'updatedAt', order: 'asc' },
    { label: 'File Size (Largest)', field: 'size', order: 'desc' },
    { label: 'File Size (Smallest)', field: 'size', order: 'asc' },
    { label: 'File Category', field: 'category', order: 'asc' },
  ];

  return (
    <div className="w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 py-3 space-y-3">
      {/* Top Row: Search + Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar with Semantic & Fuzzy Capabilities */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keywords, natural concepts (e.g. 'salary slip', 'car bills', 'passport')..."
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-inner font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View & Sort & AI Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          {/* AI Auto-Label All Button */}
          <button
            type="button"
            onClick={() => triggerAutoLabel()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 hover:from-rose-500/20 hover:to-amber-500/20 border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400 transition-all cursor-pointer shadow-2xs"
            title="Auto-label all files using AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="hidden md:inline">Auto-Label AI</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Sort:</span>
              <span className="truncate max-w-[120px]">
                {sortOptions.find((s) => s.field === sortOption.field && s.order === sortOption.order)?.label || 'Name'}
              </span>
            </button>

            {sortDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSortDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-40 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                    Sort By
                  </div>
                  {sortOptions.map((opt, i) => {
                    const isSelected = opt.field === sortOption.field && opt.order === sortOption.order;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSortOption({ field: opt.field, order: opt.order });
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              title="List View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === 'list'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tag & Category Filter Pills */}
      {(availableTags.length > 0 || selectedTag || selectedAiCategory || searchTerm) && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-bold text-zinc-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>AI Filters:</span>
          </span>

          {/* Active Tag Filter */}
          {selectedTag && (
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-bold shadow-xs cursor-pointer shrink-0"
            >
              <span>#{selectedTag}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Active AI Category Filter */}
          {selectedAiCategory && (
            <button
              type="button"
              onClick={() => setSelectedAiCategory(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold shadow-xs cursor-pointer shrink-0"
            >
              <span>Category: {selectedAiCategory}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Available Tag Pills */}
          {availableTags.slice(0, 10).map((t) => {
            if (selectedTag === t.tag) return null;
            return (
              <button
                key={t.tag}
                type="button"
                onClick={() => setSelectedTag(t.tag)}
                className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 transition-colors cursor-pointer shrink-0"
              >
                #{t.tag} <span className="text-[10px] text-zinc-400">({t.count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Row: Breadcrumbs OR Bulk Selection Actions */}
      <div className="flex items-center justify-between min-h-[32px]">
        {hasSelection ? (
          /* Bulk Action Bar */
          <div className="w-full flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-950 dark:text-rose-200 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-bold text-[11px]">
                {selectedIds.length} Selected
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline text-[11px] cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={selectAll}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline text-[11px] cursor-pointer ml-1"
              >
                Select All ({items.length})
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {viewSection === 'trash' ? (
                <>
                  <button
                    type="button"
                    onClick={restoreSelected}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 font-bold text-xs shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelectedPermanently}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Forever</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onOpenMoveModal}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 font-bold text-xs shadow-2xs cursor-pointer"
                  >
                    <FolderInput className="w-3.5 h-3.5 text-blue-500" />
                    <span>Move</span>
                  </button>
                  <button
                    type="button"
                    onClick={trashSelected}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 text-rose-600 dark:text-rose-400 font-bold text-xs shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to Trash</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Normal Breadcrumbs */
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 overflow-x-auto no-scrollbar">
            {viewSection === 'my-drive' ? (
              breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.id || 'root'}>
                    <button
                      type="button"
                      onClick={() => navigateToFolder(crumb.id)}
                      className={`font-semibold hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1 ${
                        isLast
                          ? 'text-zinc-900 dark:text-zinc-100 font-bold text-sm'
                          : 'text-zinc-500'
                      }`}
                    >
                      {idx === 0 && <FolderOpen className="w-3.5 h-3.5 text-rose-500" />}
                      <span>{crumb.name}</span>
                    </button>
                    {!isLast && <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />}
                  </React.Fragment>
                );
              })
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 capitalize">
                  {viewSection === 'category' && selectedCategory
                    ? `${selectedCategory} Files`
                    : viewSection}
                </span>
                {viewSection === 'trash' && items.length > 0 && (
                  <button
                    type="button"
                    onClick={onOpenEmptyTrashConfirm}
                    className="ml-3 text-rose-500 hover:text-rose-600 font-bold text-xs underline cursor-pointer"
                  >
                    Empty Trash
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
