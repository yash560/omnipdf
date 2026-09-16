'use client';

import React, { useState } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveItem, FOLDER_COLORS } from '@/lib/drive/drive-types';
import { formatBytes, formatTimeAgo } from '@/lib/drive/drive-helpers';
import { DriveContextMenu } from './DriveContextMenu';
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
    toggleStar,
    moveItems,
    setSelectedTag,
  } = useDrive();

  const [contextItem, setContextItem] = useState<DriveItem | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | undefined>(undefined);
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

  const handleContextMenu = (e: React.MouseEvent, item: DriveItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIds.includes(item.id)) {
      toggleSelect(item.id, false);
    }
    setContextPos({ x: e.clientX, y: e.clientY });
    setContextItem(item);
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

  const getFileIcon = (cat: string) => {
    switch (cat) {
      case 'pdf': return <FileText className="w-8 h-8 text-rose-500" />;
      case 'image': return <ImageIcon className="w-8 h-8 text-purple-500" />;
      case 'spreadsheet': return <Table className="w-8 h-8 text-emerald-500" />;
      case 'media': return <Film className="w-8 h-8 text-amber-500" />;
      case 'archive': return <FolderArchive className="w-8 h-8 text-cyan-500" />;
      case 'code': return <FileCode className="w-8 h-8 text-blue-500" />;
      default: return <File className="w-8 h-8 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
              Folders ({folders.length})
            </span>
            <button
              type="button"
              onClick={handleToggleAllFolders}
              className="text-3xs font-bold text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
            >
              {areAllFoldersSelected ? 'Deselect All Folders' : 'Select All Folders'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5">
            {folders.map((folder) => {
              const isSelected = selectedIds.includes(folder.id);
              const colorConfig = FOLDER_COLORS[folder.color || 'default'] || FOLDER_COLORS.default;
              const isDragTarget = dragOverFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, folder)}
                  onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                  onClick={(e) => toggleSelect(folder.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  onDoubleClick={() => navigateToFolder(folder.id)}
                  onContextMenu={(e) => handleContextMenu(e, folder)}
                  className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all select-none cursor-pointer flex items-center justify-between gap-3 ${
                    isDragTarget
                      ? 'border-rose-500 bg-rose-500/10 ring-4 ring-rose-500/30 scale-[1.02] shadow-xl'
                      : isSelected
                      ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/25 ring-2 ring-rose-500/20 shadow-md'
                      : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Checkbox for Folder */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(folder.id, true);
                      }}
                      className={`p-1 rounded-md transition-opacity cursor-pointer ${
                        isSelected
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded-sm accent-rose-500 cursor-pointer pointer-events-none"
                      />
                    </div>

                    <div className={`p-2 rounded-xl ${colorConfig.bgClass} ${colorConfig.textClass} shrink-0`}>
                      <Folder className="w-5 h-5 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-500 transition-colors">
                        {folder.name}
                      </div>
                      <div className="text-3xs text-zinc-400 font-mono">
                        {folder.itemCount !== undefined ? `${folder.itemCount} items` : 'Folder'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {folder.isVault && (
                      <div className="p-1 text-amber-500" title="Secure Vault Protected">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextItem(folder);
                        setContextPos({ x: e.clientX, y: e.clientY });
                      }}
                      className="p-1 rounded-lg sm:opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity cursor-pointer"
                      title="Folder Options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
              Files ({files.length})
            </span>
            <button
              type="button"
              onClick={handleToggleAllFiles}
              className="text-3xs font-bold text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
            >
              {areAllFilesSelected ? 'Deselect All Files' : 'Select All Files'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {files.map((file) => {
              const isSelected = selectedIds.includes(file.id);

              return (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, file)}
                  onClick={(e) => toggleSelect(file.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  onDoubleClick={() => openPreview(file)}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  className={`group relative rounded-2xl border transition-all select-none cursor-pointer flex flex-col overflow-hidden ${
                    isSelected
                      ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/20 ring-2 ring-rose-500/20 shadow-md'
                      : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  {/* Thumbnail / Icon Box */}
                  <div className="w-full aspect-[4/3] bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-center p-4 border-b border-zinc-100 dark:border-zinc-800/60 relative group">
                    {getFileIcon(file.category)}

                    {/* Star Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(file.id);
                      }}
                      className={`absolute top-2 left-2 p-1 rounded-lg transition-opacity ${
                        file.isStarred
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
                    </button>

                    {/* Selection Checkbox on File Card */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(file.id, true);
                      }}
                      className={`absolute top-2 left-8 p-1 rounded-lg transition-opacity ${
                        isSelected
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                      title="Select File"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded-sm accent-rose-500 cursor-pointer pointer-events-none"
                      />
                    </button>

                    {/* Status Badges: Vault & Expiry */}
                    <div className="absolute top-2 right-8 flex items-center gap-1">
                      {file.isVault && (
                        <span className="p-1 rounded-md bg-amber-500/20 text-amber-500 shadow-xs" title="Protected in Secure Vault">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                      {file.expiryStatus === 'expired' && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" title="Expired / Renewal Due" />
                      )}
                      {file.expiryStatus === 'expiring_soon' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" title="Expiring Soon" />
                      )}
                    </div>

                    {/* 3-Dot Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextItem(file);
                        setContextPos({ x: e.clientX, y: e.clientY });
                      }}
                      className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Preview Hover Pill */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                    </div>
                  </div>

                  {/* File Metadata Footer */}
                  <div className="p-3 space-y-1.5">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {file.name}
                    </div>

                    {/* OCR match snippet */}
                    {file.ocrSnippet && (
                      <div className="text-3xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono truncate">
                        OCR: {file.ocrSnippet}
                      </div>
                    )}

                    {file.aiSummary && !file.ocrSnippet && (
                      <p className="text-3xs text-zinc-500 dark:text-zinc-400 line-clamp-1 italic">
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
                            className="px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[9px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-rose-500 hover:text-white transition"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-3xs text-zinc-400 font-mono pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                      <span>{formatBytes(file.size)}</span>
                      <span>{formatTimeAgo(file.updatedAt || file.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Context Menu */}
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
    </div>
  );
}
