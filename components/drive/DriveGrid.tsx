'use client';

import React, { useState } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveItem, FOLDER_COLORS } from '@/lib/drive/drive-types';
import { formatBytes, formatTimeAgo } from '@/lib/drive/drive-helpers';
import { DriveContextMenu } from './DriveContextMenu';
import { DriveMobileActionSheet } from './DriveMobileActionSheet';
import { DriveSwipeableItem } from './DriveSwipeableItem';
import { DriveThumbnail } from './DriveThumbnail';
import { triggerHaptic } from '@/lib/drive/haptics';
import { Tooltip } from './DriveTooltip';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Table,
  Film,
  FolderArchive,
  FileCode,
  File,
  Star,
  MoreVertical,
  Download,
  Eye,
  Lock,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface DriveGridProps {
  onOpenRenameModal: (item: DriveItem) => void;
  onOpenMoveModal: () => void;
}

export function DriveGrid({ onOpenRenameModal, onOpenMoveModal }: DriveGridProps) {
  const {
    folders,
    files,
    selectedIds,
    toggleSelect,
    selectByType,
    navigateToFolder,
    openPreview,
    openShareModal,
    toggleStar,
    trashSelected,
    moveItems,
    setSelectedTag,
  } = useDrive();

  const [contextItem, setContextItem] = useState<DriveItem | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | undefined>(undefined);
  const [mobileSheetItem, setMobileSheetItem] = useState<DriveItem | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const areAllFoldersSelected = folders.length > 0 && folders.every((f) => selectedIds.includes(f.id));
  const areAllFilesSelected = files.length > 0 && files.every((f) => selectedIds.includes(f.id));

  const handleToggleAllFolders = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (areAllFoldersSelected) {
      folders.forEach((f) => {
        if (selectedIds.includes(f.id)) toggleSelect(f.id, true);
      });
    } else {
      selectByType('folders');
    }
  };

  const handleToggleAllFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (areAllFilesSelected) {
      files.forEach((f) => {
        if (selectedIds.includes(f.id)) toggleSelect(f.id, true);
      });
    } else {
      selectByType('files');
    }
  };

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

  const handleDragStart = (e: React.DragEvent, item: DriveItem) => {
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(folderId);
  };

  const handleFolderDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetFolderId) {
      if (!selectedIds.includes(draggedId)) {
        toggleSelect(draggedId, false);
      }
      await moveItems(targetFolderId);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap px-0.5">
            <span className="text-3xs sm:text-2xs font-extrabold uppercase tracking-wider text-zinc-400">
              Folders ({folders.length})
            </span>
            <button
              type="button"
              onClick={handleToggleAllFolders}
              className="text-3xs sm:text-2xs font-bold text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
            >
              {areAllFoldersSelected ? 'Deselect All Folders' : 'Select All Folders'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3.5">
            {folders.map((folder) => {
              const isSelected = selectedIds.includes(folder.id);
              const colorConfig = FOLDER_COLORS[folder.color || 'default'] || FOLDER_COLORS.default;
              const isDragTarget = dragOverFolderId === folder.id;

              return (
                <DriveSwipeableItem
                  key={folder.id}
                  item={folder}
                  onShare={() => openShareModal(folder)}
                  onTrash={() => {
                    trashSelected(folder.id);
                  }}
                  onLongPress={() => handleOpenItemOptions(folder)}
                  onOpenOptions={() => handleOpenItemOptions(folder)}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, folder)}
                    onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                    onDragLeave={handleFolderDragLeave}
                    onDrop={(e) => handleFolderDrop(e, folder.id)}
                    onClick={(e) => toggleSelect(folder.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                    onDoubleClick={() => navigateToFolder(folder.id)}
                    onContextMenu={(e) => handleOpenItemOptions(folder, e)}
                    className={`group relative p-2 sm:p-3.5 rounded-2xl border transition-all select-none cursor-pointer flex items-center justify-between gap-1.5 sm:gap-3 ${
                      isDragTarget
                        ? 'border-rose-500 bg-rose-500/10 ring-4 ring-rose-500/30 scale-[1.02] shadow-xl'
                        : isSelected
                        ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/25 ring-2 ring-rose-500/20 shadow-md'
                        : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                      {/* Checkbox for Folder */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          toggleSelect(folder.id, true);
                        }}
                        className={`p-0.5 sm:p-1 rounded-md transition-opacity cursor-pointer ${
                          isSelected
                            ? 'opacity-100'
                            : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-zinc-100/80 dark:bg-zinc-800/80 sm:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm accent-rose-500 cursor-pointer pointer-events-none"
                        />
                      </div>

                      <div className={`p-1.5 sm:p-2 rounded-xl ${colorConfig.bgClass} ${colorConfig.textClass} shrink-0`}>
                        <Folder className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                      </div>
                      <div className="min-w-0" onClick={() => {
                        // On single touch on mobile inside folder name, navigate to folder
                        if (typeof window !== 'undefined' && window.innerWidth < 640) {
                          navigateToFolder(folder.id);
                        }
                      }}>
                        <div className="font-bold text-[11px] sm:text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-500 transition-colors">
                          {folder.name}
                        </div>
                        <div className="text-[9px] sm:text-3xs text-zinc-400 font-mono">
                          {folder.itemCount !== undefined ? `${folder.itemCount} items` : 'Folder'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      {folder.isVault && (
                        <Tooltip content="Protected in Secure PIN Vault" side="top">
                          <div className="p-0.5 sm:p-1 text-amber-500" aria-label="Secure Vault Protected">
                            <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                        </Tooltip>
                      )}
                      <Tooltip content="Folder Actions (Rename, Move, Share, Delete)" side="top">
                        <button
                          type="button"
                          onClick={(e) => handleOpenItemOptions(folder, e)}
                          className="p-1 sm:p-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-zinc-100/80 dark:bg-zinc-800/80 sm:bg-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
                          aria-label="Folder Options"
                        >
                          <MoreVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </DriveSwipeableItem>
              );
            })}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap px-0.5">
            <span className="text-3xs sm:text-2xs font-extrabold uppercase tracking-wider text-zinc-400">
              Files ({files.length})
            </span>
            <button
              type="button"
              onClick={handleToggleAllFiles}
              className="text-3xs sm:text-2xs font-bold text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
            >
              {areAllFilesSelected ? 'Deselect All Files' : 'Select All Files'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-4">
            {files.map((file) => {
              const isSelected = selectedIds.includes(file.id);

              return (
                <DriveSwipeableItem
                  key={file.id}
                  item={file}
                  onStar={() => toggleStar(file.id)}
                  onShare={() => openShareModal(file)}
                  onTrash={() => {
                    trashSelected(file.id);
                  }}
                  onLongPress={() => handleOpenItemOptions(file)}
                  onOpenOptions={() => handleOpenItemOptions(file)}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, file)}
                    onClick={(e) => toggleSelect(file.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                    onDoubleClick={() => openPreview(file)}
                    onContextMenu={(e) => handleOpenItemOptions(file, e)}
                    className={`group relative rounded-2xl border transition-all select-none cursor-pointer flex flex-col overflow-hidden ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/20 ring-2 ring-rose-500/20 shadow-md'
                        : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-sm'
                    }`}
                  >
                    {/* Thumbnail / Icon Box */}
                    <div 
                      onClick={(e) => {
                        // On touch / single tap on thumbnail area, open preview
                        if (typeof window !== 'undefined' && window.innerWidth < 640) {
                          e.stopPropagation();
                          openPreview(file);
                        }
                      }}
                      className="w-full aspect-[4/3] bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800/60 relative group overflow-hidden"
                    >
                      <DriveThumbnail item={file} view="grid" />

                      {/* Star Button */}
                      <Tooltip content={file.isStarred ? 'Remove from Starred' : 'Add to Starred'} side="right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('selection');
                            toggleStar(file.id);
                          }}
                          className={`absolute top-1.5 sm:top-2 left-1.5 sm:left-2 p-1 sm:p-1.5 rounded-xl transition-all z-20 ${
                            file.isStarred
                              ? 'opacity-100 bg-amber-500/20 text-amber-500 shadow-2xs'
                              : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-400 hover:text-amber-400 shadow-2xs'
                          }`}
                          aria-label={file.isStarred ? 'Unstar' : 'Star'}
                        >
                          <Star className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${file.isStarred ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
                        </button>
                      </Tooltip>

                      {/* Selection Checkbox on File Card */}
                      <Tooltip content={isSelected ? 'Deselect file' : 'Select file'} side="right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('selection');
                            toggleSelect(file.id, true);
                          }}
                          className={`absolute top-1.5 sm:top-2 left-7 sm:left-10 p-1 sm:p-1.5 rounded-xl transition-all z-20 ${
                            isSelected
                              ? 'opacity-100 bg-rose-500/20 border border-rose-500/40 shadow-2xs'
                              : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-500 shadow-2xs'
                          }`}
                          aria-label="Select File"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm accent-rose-500 cursor-pointer pointer-events-none block"
                          />
                        </button>
                      </Tooltip>

                      {/* Status Badges: Vault & Expiry */}
                      <div className="absolute top-1.5 sm:top-2 right-7 sm:right-10 flex items-center gap-1 z-10">
                        {file.isVault && (
                          <Tooltip content="Protected in Secure PIN Vault" side="left">
                            <span className="p-0.5 sm:p-1 rounded-md bg-amber-500/20 text-amber-500 shadow-xs flex items-center justify-center">
                              <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                          </Tooltip>
                        )}
                        {file.expiryStatus === 'expired' && (
                          <Tooltip content="⚠️ Document has expired / renewal is overdue" side="left">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                          </Tooltip>
                        )}
                        {file.expiryStatus === 'expiring_soon' && (
                          <Tooltip content="⚠️ Document expiring soon (<30 days)" side="left">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                          </Tooltip>
                        )}
                      </div>

                      {/* 3-Dot Action Button */}
                      <Tooltip content="More actions (Tools, Share, Rename, Trash)" side="left">
                        <button
                          type="button"
                          onClick={(e) => handleOpenItemOptions(file, e)}
                          className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 sm:p-1.5 rounded-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xs transition-all cursor-pointer z-20"
                          aria-label="File Options"
                        >
                          <MoreVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </Tooltip>

                      {/* Quick Preview Hover Pill (Desktop) */}
                      <div className="hidden sm:flex absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2">
                        <Tooltip content="Open Quick Look Preview" shortcut="Space" side="top">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPreview(file);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white text-zinc-900 text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform"
                          >
                            <Eye className="w-3.5 h-3.5 text-rose-500" />
                            <span>Preview</span>
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* File Metadata Footer */}
                    <div className="p-2 sm:p-3 space-y-1 sm:space-y-1.5">
                      <div className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {file.name}
                      </div>

                      {/* Match snippet */}
                      {file.ocrSnippet && (
                        <div className="text-[9px] sm:text-3xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium truncate">
                          Excerpt: &ldquo;{file.ocrSnippet}&rdquo;
                        </div>
                      )}

                      {file.aiSummary && !file.ocrSnippet && (
                        <p className="text-[9px] sm:text-3xs text-zinc-500 dark:text-zinc-400 line-clamp-1 italic">
                          {file.aiSummary}
                        </p>
                      )}

                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {file.tags.slice(0, 2).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(tag);
                              }}
                              className="px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[8px] sm:text-[9px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-rose-500 hover:text-white transition"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[9px] sm:text-3xs text-zinc-400 font-mono pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                        <span>{formatBytes(file.size)}</span>
                        <span>{formatTimeAgo(file.updatedAt || file.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </DriveSwipeableItem>
              );
            })}
          </div>
        </div>
      )}

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
