'use client';

import React, { useState, useEffect } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveSearchDropdown } from './DriveSearchDropdown';
import {
  Search,
  X,
  LayoutGrid,
  List,
  Columns3,
  ArrowUpDown,
  Download,
  Trash2,
  FolderInput,
  Star,
  StarOff,
  Tag,
  CheckSquare,
  Square,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  FolderOpen,
  MessageSquare,
  Lock,
  Unlock,
  SlidersHorizontal,
  HelpCircle,
  Menu,
  Settings,
  FileText,
  Layers,
  Files,
  Clock,
  Image as ImageIcon,
  Table as TableIcon
} from 'lucide-react';
import { DriveSortField } from '@/lib/drive/drive-types';

interface DriveToolbarProps {
  onOpenMoveModal: () => void;
  onOpenEmptyTrashConfirm: () => void;
  showFastFilters?: boolean;
  onToggleFastFilters?: () => void;
  onToggleMobileSidebar?: () => void;
}

export function DriveToolbar({
  onOpenMoveModal,
  onOpenEmptyTrashConfirm,
  showFastFilters,
  onToggleFastFilters,
  onToggleMobileSidebar,
}: DriveToolbarProps) {
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
    folders,
    files,
    isSyncing,
    clearSelection,
    selectAll,
    selectByType,
    invertSelection,
    isAllSelected,
    isSomeSelected,
    selectedPdfCount,
    mergeSelectedPdfs,
    copySelectedInfoToClipboard,
    trashSelected,
    restoreSelected,
    deleteSelectedPermanently,
    triggerBatchAction,
    bulkDownloadZip,
    openPreview,
    isVaultUnlocked,
    lockVault,
    setIsVaultModalOpen,
    openVaultModal,
    setIsFolderChatOpen,
    setIsKeyboardShortcutsOpen,
  } = useDrive();

  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectDropdownOpen, setSelectDropdownOpen] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [isMergingPdfs, setIsMergingPdfs] = useState(false);

  const starredCount = items.filter((i) => i.isStarred).length;
  const radarCount = items.filter((i) => i.expiryStatus === 'expired' || i.expiryStatus === 'expiring_soon').length;
  const pdfCount = items.filter((i) => i.category === 'pdf' || i.name.toLowerCase().endsWith('.pdf')).length;
  const imageCount = items.filter((i) => i.category === 'image').length;
  const sheetCount = items.filter((i) => i.category === 'spreadsheet').length;
  const vaultCount = items.filter((i) => i.isVault).length;

  const handleCopyInfo = async () => {
    const ok = await copySelectedInfoToClipboard();
    if (ok) {
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2200);
    }
  };

  const handleMergePdfs = async () => {
    setIsMergingPdfs(true);
    try {
      await mergeSelectedPdfs();
    } finally {
      setIsMergingPdfs(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('filecraft_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  const handleAddRecentSearch = (q: string) => {
    if (!q || !q.trim()) return;
    const clean = q.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('filecraft_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRemoveRecentSearch = (q: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== q.toLowerCase());
      try {
        localStorage.setItem('filecraft_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('filecraft_recent_searches');
    } catch {}
  };

  const hasSelection = selectedIds.length > 0;

  const sortOptions: { label: string; field: DriveSortField; order: 'asc' | 'desc' }[] = [
    { label: 'Name (A to Z)', field: 'name', order: 'asc' },
    { label: 'Name (Z to A)', field: 'name', order: 'desc' },
    { label: 'Last Modified (Newest)', field: 'updatedAt', order: 'desc' },
    { label: 'Last Modified (Oldest)', field: 'updatedAt', order: 'asc' },
    { label: 'File Size (Largest)', field: 'size', order: 'desc' },
    { label: 'File Size (Smallest)', field: 'size', order: 'asc' },
    { label: 'Expiry Date (Soonest)', field: 'expiry', order: 'asc' },
    { label: 'File Category', field: 'category', order: 'asc' },
  ];

  const currentFolderCrumb = breadcrumbs[breadcrumbs.length - 1];

  return (
    <div className="w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 space-y-2 sm:space-y-2.5 shrink-0 select-none relative z-30">
      {/* Top Row: Mobile Menu + Search Bar + Action Buttons */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Mobile Sidebar Drawer Trigger Button */}
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Open Drive Navigation Menu"
            aria-label="Open Drive Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Search Bar with Predictive Recommendations & Autocomplete */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[260px] md:min-w-[300px] z-40">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onFocus={() => setIsSearchDropdownOpen(true)}
            onClick={() => setIsSearchDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddRecentSearch(searchTerm);
                setIsSearchDropdownOpen(false);
              } else if (e.key === 'Escape') {
                setIsSearchDropdownOpen(false);
              }
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchDropdownOpen(true);
            }}
            placeholder="Search files, scanned text, categories, tags (Click for suggestions)..."
            className="w-full pl-8 sm:pl-9 pr-8 sm:pr-9 py-1.5 sm:py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-inner font-medium relative z-10"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer z-20"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Transparent click-outside backdrop when search dropdown is open */}
          {isSearchDropdownOpen && (
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setIsSearchDropdownOpen(false)} 
            />
          )}

          {/* Predictive Search Recommender Dropdown */}
          <DriveSearchDropdown
            isOpen={isSearchDropdownOpen}
            onClose={() => setIsSearchDropdownOpen(false)}
            query={searchTerm}
            onSelectQuery={(q) => {
              setSearchTerm(q);
              handleAddRecentSearch(q);
              setIsSearchDropdownOpen(false);
            }}
            onSelectItem={(it) => {
              openPreview(it);
              handleAddRecentSearch(it.name);
              setIsSearchDropdownOpen(false);
            }}
            items={items}
            recentSearches={recentSearches}
            onClearRecentSearches={handleClearRecentSearches}
            onRemoveRecentSearch={handleRemoveRecentSearch}
          />
        </div>

        {/* View & Sort & AI Actions Group */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Chat with Folder / AI RAG */}
          <button
            type="button"
            onClick={() => setIsFolderChatOpen(true)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200/80 dark:border-violet-800/60 text-xs font-bold text-violet-700 dark:text-violet-300 transition-all cursor-pointer shadow-2xs"
            title="Chat with AI about files in this folder"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span className="hidden xl:inline">Folder AI Chat</span>
          </button>

          {/* Fast Filters Toggle */}
          {onToggleFastFilters && (
            <button
              type="button"
              onClick={onToggleFastFilters}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                showFastFilters
                  ? 'bg-blue-500 text-white border-blue-600 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300'
              }`}
              title="Toggle Fast Person/Vehicle Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline">Filters</span>
            </button>
          )}

          {/* Secure Vault Status Toggle */}
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (isVaultUnlocked) lockVault();
                else openVaultModal('unlock');
              }}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isVaultUnlocked
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
              }`}
              title={isVaultUnlocked ? 'Vault is Unlocked. Click to Lock Now.' : 'Unlock Secure Vault with PIN'}
            >
              {isVaultUnlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="hidden xl:inline">Vault Unlocked</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="hidden xl:inline">Vault Locked</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => openVaultModal('configure')}
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Configure Vault PIN & Security Settings"
              aria-label="Configure Vault PIN & Security Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Master Select Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSelectDropdownOpen(!selectDropdownOpen)}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                hasSelection
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300'
              }`}
              title="Select items (All, Files, Folders, Starred, PDFs, etc.)"
            >
              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline">
                {hasSelection ? `${selectedIds.length} Selected` : 'Select'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
            </button>

            {selectDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSelectDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-40 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
                    Selection Modes ({items.length} total)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      selectAll();
                      setSelectDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
                      <span>Select All</span>
                    </div>
                    <span className="text-3xs text-zinc-400 font-mono">({items.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      selectByType('files');
                      setSelectDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Files className="w-3.5 h-3.5 text-blue-500" />
                      <span>Files Only</span>
                    </div>
                    <span className="text-3xs text-zinc-400 font-mono">({files.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      selectByType('folders');
                      setSelectDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span>Folders Only</span>
                    </div>
                    <span className="text-3xs text-zinc-400 font-mono">({folders.length})</span>
                  </button>

                  {starredCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        selectByType('starred');
                        setSelectDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Starred Items</span>
                      </div>
                      <span className="text-3xs text-zinc-400 font-mono">({starredCount})</span>
                    </button>
                  )}

                  {radarCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        selectByType('radar');
                        setSelectDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Expiring / Radar</span>
                      </div>
                      <span className="text-3xs text-zinc-400 font-mono">({radarCount})</span>
                    </button>
                  )}

                  {pdfCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        selectByType('pdf');
                        setSelectDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-rose-500" />
                        <span>PDF Documents</span>
                      </div>
                      <span className="text-3xs text-zinc-400 font-mono">({pdfCount})</span>
                    </button>
                  )}

                  {imageCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        selectByType('image');
                        setSelectDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                        <span>Images</span>
                      </div>
                      <span className="text-3xs text-zinc-400 font-mono">({imageCount})</span>
                    </button>
                  )}

                  {sheetCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        selectByType('spreadsheet');
                        setSelectDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <TableIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Spreadsheets</span>
                      </div>
                      <span className="text-3xs text-zinc-400 font-mono">({sheetCount})</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    type="button"
                    onClick={() => {
                      invertSelection();
                      setSelectDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Invert Selection</span>
                  </button>

                  {hasSelection && (
                    <button
                      type="button"
                      onClick={() => {
                        clearSelection();
                        setSelectDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Clear Selection (Esc)</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Sort items"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="hidden 2xl:inline text-zinc-400 font-normal">Sort:</span>
              <span className="truncate max-w-[90px] sm:max-w-[110px] hidden lg:inline">
                {sortOptions.find((s) => s.field === sortOption.field && s.order === sortOption.order)?.label || 'Name'}
              </span>
            </button>

            {sortDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSortDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-40 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
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

          {/* Grid vs List vs Columns View Toggle */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
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
            <button
              type="button"
              onClick={() => setViewLayout('columns')}
              title="Cascading Columns View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === 'columns'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tag & Category Filter Pills */}
      {(availableTags.length > 0 || selectedTag || selectedAiCategory || searchTerm) && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-3xs font-bold text-zinc-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>AI Filters:</span>
          </span>

          {/* Active Tag Filter */}
          {selectedTag && (
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 text-white text-3xs font-bold shadow-xs cursor-pointer shrink-0"
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-3xs font-bold shadow-xs cursor-pointer shrink-0"
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
                className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-3xs font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 transition-colors cursor-pointer shrink-0"
              >
                #{t.tag} <span className="text-3xs text-zinc-400">({t.count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Row: Breadcrumbs OR Selection Actions */}
      <div className="flex items-center justify-between min-h-[32px]">
        {hasSelection ? (
          <div className="w-full flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-950 dark:text-rose-200 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-bold text-3xs">
                {selectedIds.length} Selected
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline text-3xs cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={selectAll}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline text-3xs cursor-pointer ml-0.5"
              >
                Select All ({items.length})
              </button>
              <button
                type="button"
                onClick={invertSelection}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline text-3xs cursor-pointer ml-0.5 hidden sm:inline"
              >
                Invert
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* 1-Click PDF Merge if 2+ PDFs are selected */}
              {selectedPdfCount >= 2 && viewSection !== 'trash' && (
                <button
                  type="button"
                  onClick={handleMergePdfs}
                  disabled={isMergingPdfs}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-bold text-xs shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
                  title="Merge selected PDF files into one document"
                >
                  {isMergingPdfs ? (
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Layers className="w-3.5 h-3.5" />
                  )}
                  <span>Merge {selectedPdfCount} PDFs</span>
                </button>
              )}

              {/* Copy Selected Info / Names to Clipboard */}
              <button
                type="button"
                onClick={handleCopyInfo}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                title="Copy names and details of selected items to clipboard"
              >
                {copiedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="hidden md:inline">Copy Info</span>
                  </>
                )}
              </button>

              {viewSection === 'trash' ? (
                <>
                  <button
                    type="button"
                    onClick={restoreSelected}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                    title="Restore selected items"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelectedPermanently}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                    title="Delete selected items permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Forever</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Download ZIP */}
                  <button
                    type="button"
                    onClick={() => bulkDownloadZip()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                    title="Download selected as ZIP"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="hidden md:inline">ZIP</span>
                  </button>

                  {/* Star All */}
                  <button
                    type="button"
                    onClick={() => triggerBatchAction('star')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-amber-600 dark:text-amber-400 font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                    title="Star selected items"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="hidden sm:inline">Star</span>
                  </button>

                  {/* Unstar All */}
                  <button
                    type="button"
                    onClick={() => triggerBatchAction('unstar')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-400 font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                    title="Unstar selected items"
                  >
                    <StarOff className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Unstar</span>
                  </button>

                  {/* Lock in Vault */}
                  {viewSection !== 'vault' && (
                    <button
                      type="button"
                      onClick={() => triggerBatchAction('vault')}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-amber-50 text-amber-600 dark:text-amber-400 font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                      title="Lock selected items in Secure Vault"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Vault</span>
                    </button>
                  )}

                  {/* Unlock from Vault */}
                  <button
                    type="button"
                    onClick={() => triggerBatchAction('unvault')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50 text-emerald-600 dark:text-emerald-400 font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                    title="Unlock / Remove from Secure Vault"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Unlock</span>
                  </button>

                  {/* AI Auto-Label */}
                  <button
                    type="button"
                    onClick={() => triggerAutoLabel(selectedIds)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                    title="Auto-label selected items with AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="hidden xl:inline">AI Label</span>
                  </button>

                  {/* Move */}
                  <button
                    type="button"
                    onClick={onOpenMoveModal}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                    title="Move to folder..."
                  >
                    <FolderInput className="w-3.5 h-3.5 text-blue-500" />
                    <span>Move</span>
                  </button>

                  {/* Move to Trash */}
                  <button
                    type="button"
                    onClick={trashSelected}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 text-rose-600 dark:text-rose-400 font-bold text-xs shadow-2xs cursor-pointer shrink-0"
                    title="Move selected items to Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Trash</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-zinc-500 overflow-x-auto no-scrollbar">
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
                    : viewSection === 'vault'
                    ? 'Secure Vault'
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

            {/* Subtle Non-Intrusive Syncing Indicator */}
            {isSyncing && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold animate-pulse shrink-0 ml-1">
                <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                <span>Syncing</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
