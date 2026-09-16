'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveItem, FOLDER_COLORS } from '@/lib/drive/drive-types';
import { formatBytes, formatTimeAgo } from '@/lib/drive/drive-helpers';
import { DriveContextMenu } from './DriveContextMenu';
import { DriveMobileActionSheet } from './DriveMobileActionSheet';
import { DriveThumbnail } from './DriveThumbnail';
import { triggerHaptic } from '@/lib/drive/haptics';
import { Tooltip } from './DriveTooltip';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Film,
  FolderArchive,
  FileCode,
  File,
  Star,
  MoreVertical,
  ArrowUpDown,
  Lock,
  Calendar,
  AlertCircle,
  CheckSquare,
  Square,
  MinusSquare,
  ChevronDown,
  Check,
  RotateCcw,
  Files,
  FolderOpen
} from 'lucide-react';

interface DriveTableProps {
  onOpenRenameModal: (item: DriveItem) => void;
  onOpenMoveModal: () => void;
}

export function DriveTable({ onOpenRenameModal, onOpenMoveModal }: DriveTableProps) {
  const {
    items,
    folders,
    files,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    selectByType,
    invertSelection,
    isAllSelected,
    isSomeSelected,
    navigateToFolder,
    openPreview,
    toggleStar,
    sortOption,
    setSortOption,
    setSelectedTag,
  } = useDrive();

  const [contextItem, setContextItem] = useState<DriveItem | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | undefined>(undefined);
  const [mobileSheetItem, setMobileSheetItem] = useState<DriveItem | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleOpenItemOptions = (item: DriveItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      triggerHaptic('light');
      setMobileSheetItem(item);
    } else {
      if (!selectedIds.includes(item.id)) {
        toggleSelect(item.id, false);
      }
      setContextPos(e ? { x: e.clientX, y: e.clientY } : undefined);
      setContextItem(item);
    }
  };

  const handleTouchStart = (item: DriveItem) => {
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      setMobileSheetItem(item);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSort = (field: 'name' | 'updatedAt' | 'size' | 'category' | 'expiry') => {
    triggerHaptic('selection');
    if (sortOption.field === field) {
      setSortOption({ field, order: sortOption.order === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortOption({ field, order: 'asc' });
    }
  };

  const starredCount = items.filter((i) => i.isStarred).length;

  return (
    <div 
      data-lenis-prevent
      className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs"
    >
      <div 
        className="overflow-x-auto" 
        style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full text-left text-xs text-zinc-800 dark:text-zinc-200 min-w-[580px]">
          <thead className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800 text-3xs font-extrabold uppercase tracking-wider text-zinc-400 select-none">
            <tr>
              {/* Master Tri-State Checkbox Column */}
              <th className="w-10 px-3 py-3 text-center relative">
                <div className="flex items-center justify-center gap-1">
                  <Tooltip content={isAllSelected ? 'Deselect All' : 'Select All'} shortcut="⌘A" side="bottom">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={() => {
                        triggerHaptic('selection');
                        if (isAllSelected || isSomeSelected) {
                          clearSelection();
                        } else {
                          selectAll();
                        }
                      }}
                      aria-label={isAllSelected ? 'Deselect All' : 'Select All'}
                      className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-500"
                    />
                  </Tooltip>
                  <Tooltip content="Selection options" side="bottom">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeaderMenuOpen(!headerMenuOpen);
                      }}
                      className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                      aria-label="Selection Options"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </Tooltip>
                </div>

                {headerMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setHeaderMenuOpen(false)} />
                    <div className="absolute left-2 top-10 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-40 p-1.5 text-left font-sans normal-case animate-dropdown origin-top-left">
                      <button
                        type="button"
                        onClick={() => {
                          selectAll();
                          setHeaderMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                      >
                        <span>Select All</span>
                        <span className="text-3xs text-zinc-400 font-mono">({items.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          selectByType('files');
                          setHeaderMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                      >
                        <span>Files Only</span>
                        <span className="text-3xs text-zinc-400 font-mono">({files.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          selectByType('folders');
                          setHeaderMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                      >
                        <span>Folders Only</span>
                        <span className="text-3xs text-zinc-400 font-mono">({folders.length})</span>
                      </button>

                      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                      <button
                        type="button"
                        onClick={() => {
                          invertSelection();
                          setHeaderMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Invert Selection</span>
                      </button>
                    </div>
                  </>
                )}
              </th>

              {/* Star Column */}
              <th className="w-8 px-2 py-3 text-center">
                <Tooltip content="Starred files and folders" side="bottom">
                  <Star className="w-3.5 h-3.5 text-zinc-400 inline" />
                </Tooltip>
              </th>

              {/* Name Column */}
              <th
                onClick={() => handleSort('name')}
                className="px-4 py-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <Tooltip content="Sort by file/folder name" side="bottom">
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </Tooltip>
              </th>

              {/* Category / Type Column */}
              <th
                onClick={() => handleSort('category')}
                className="hidden md:table-cell px-4 py-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <Tooltip content="Sort by file category" side="bottom">
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </Tooltip>
              </th>

              {/* Last Modified Column */}
              <th
                onClick={() => handleSort('updatedAt')}
                className="hidden sm:table-cell px-4 py-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <Tooltip content="Sort by last modified date" side="bottom">
                  <div className="flex items-center gap-1.5">
                    <span>Last Modified</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </Tooltip>
              </th>

              {/* Size Column */}
              <th
                onClick={() => handleSort('size')}
                className="px-4 py-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors text-right"
              >
                <Tooltip content="Sort by storage size" side="bottom">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Size</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </Tooltip>
              </th>

              {/* Actions Column */}
              <th className="w-10 px-4 py-3 text-center">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isFolder = item.type === 'folder';

              return (
                <tr
                  key={item.id}
                  onTouchStart={() => handleTouchStart(item)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onClick={(e) => toggleSelect(item.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  onDoubleClick={() => (isFolder ? navigateToFolder(item.id) : openPreview(item))}
                  onContextMenu={(e) => handleOpenItemOptions(item, e)}
                  className={`group transition-colors select-none cursor-pointer active:bg-zinc-100/80 dark:active:bg-zinc-800/80 ${
                    isSelected
                      ? 'bg-rose-500/10 dark:bg-rose-950/30'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip content={isSelected ? 'Deselect item' : 'Select item'} side="right">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          triggerHaptic('selection');
                          toggleSelect(item.id, true);
                        }}
                        aria-label={isSelected ? 'Deselect item' : 'Select item'}
                        className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-500"
                      />
                    </Tooltip>
                  </td>

                  {/* Star Toggle */}
                  <td className="px-2 py-3 text-center">
                    <Tooltip content={item.isStarred ? 'Remove from Starred' : 'Add to Starred'} side="top">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          toggleStar(item.id);
                        }}
                        aria-label={item.isStarred ? 'Unstar item' : 'Star item'}
                        className="p-1 rounded-md text-zinc-300 dark:text-zinc-600 hover:text-amber-400 cursor-pointer"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            item.isStarred
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400'
                          }`}
                        />
                      </button>
                    </Tooltip>
                  </td>

                  {/* Name + Icon + Tags + Status */}
                  <td 
                    className="px-4 py-3"
                    onClick={() => {
                      // On single touch on mobile inside row name, open folder or preview
                      if (typeof window !== 'undefined' && window.innerWidth < 640) {
                        if (isFolder) navigateToFolder(item.id);
                        else openPreview(item);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 max-w-sm sm:max-w-md">
                      <div className="shrink-0 relative">
                        <DriveThumbnail item={item} view="table" />
                        {item.isVault && (
                          <Tooltip content="Protected in Secure PIN Vault" side="top">
                            <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-500 text-white z-10 shadow-xs">
                              <Lock className="w-2 h-2" />
                            </div>
                          </Tooltip>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.expiryStatus === 'expired' && (
                            <Tooltip content="⚠️ Document has expired / renewal is overdue" side="top">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 cursor-help">
                                Expired
                              </span>
                            </Tooltip>
                          )}
                          {item.expiryStatus === 'expiring_soon' && (
                            <Tooltip content={`⚠️ Document expiring soon (${item.expiryDaysLeft} days remaining)`} side="top">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-help">
                                {item.expiryDaysLeft}d
                              </span>
                            </Tooltip>
                          )}
                        </div>

                        {item.ocrSnippet && (
                          <div className="text-3xs text-emerald-600 dark:text-emerald-400 font-medium truncate bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5 max-w-xs">
                            Excerpt: &ldquo;{item.ocrSnippet}&rdquo;
                          </div>
                        )}

                        {item.aiSummary && !item.ocrSnippet && (
                          <p className="text-3xs text-zinc-500 dark:text-zinc-400 line-clamp-1 italic">
                            {item.aiSummary}
                          </p>
                        )}

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <Tooltip key={tag} content={`Filter files with #${tag}`} side="top">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTag(tag);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[9px] font-bold hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  #{tag}
                                </button>
                              </Tooltip>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-[9px] text-zinc-400 font-bold self-center">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category Type */}
                  <td className="hidden md:table-cell px-4 py-3 text-zinc-500 capitalize">
                    {isFolder ? 'Folder' : item.category}
                  </td>

                  {/* Date Modified */}
                  <td className="hidden sm:table-cell px-4 py-3 text-zinc-500 font-mono text-3xs">
                    {formatTimeAgo(item.updatedAt || item.createdAt)}
                  </td>

                  {/* Size */}
                  <td className="px-4 py-3 text-right text-zinc-500 font-mono text-3xs">
                    {isFolder ? '—' : formatBytes(item.size)}
                  </td>

                  {/* 3-Dot Context Trigger */}
                  <td className="px-4 py-3 text-center">
                    <Tooltip content="More actions (Tools, Share, Rename, Trash)" side="left">
                      <button
                        type="button"
                        onClick={(e) => handleOpenItemOptions(item, e)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label="Item Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Desktop Context Menu */}
      {contextItem && (
        <DriveContextMenu
          item={contextItem}
          isOpen={Boolean(contextItem)}
          position={contextPos}
          onClose={() => setContextItem(null)}
          onOpenRenameModal={() => onOpenRenameModal(contextItem)}
          onOpenMoveModal={onOpenMoveModal}
        />
      )}

      {/* Mobile Action Bottom Sheet */}
      {mobileSheetItem && (
        <DriveMobileActionSheet
          item={mobileSheetItem}
          isOpen={Boolean(mobileSheetItem)}
          onClose={() => setMobileSheetItem(null)}
          onOpenRenameModal={(item) => onOpenRenameModal(item)}
          onOpenMoveModal={onOpenMoveModal}
        />
      )}
    </div>
  );
}
