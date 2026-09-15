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
  Eye
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
    navigateToFolder,
    openPreview,
    toggleStar,
    moveItems,
  } = useDrive();

  const [contextItem, setContextItem] = useState<DriveItem | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | undefined>(undefined);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

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
    <div className="space-y-8">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Folders ({folders.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {folders.map((f) => {
              const isSelected = selectedIds.includes(f.id);
              const colorConfig = FOLDER_COLORS[f.color || 'default'] || FOLDER_COLORS.default;
              const isDragTarget = dragOverFolderId === f.id;

              return (
                <div
                  key={f.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, f)}
                  onDragOver={(e) => handleFolderDragOver(e, f.id)}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={(e) => handleFolderDrop(e, f.id)}
                  onClick={(e) => toggleSelect(f.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  onDoubleClick={() => navigateToFolder(f.id)}
                  onContextMenu={(e) => handleContextMenu(e, f)}
                  className={`group relative p-3 rounded-2xl border transition-all select-none cursor-pointer flex items-center justify-between gap-2.5 ${
                    isDragTarget
                      ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30 scale-105'
                      : isSelected
                      ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/20 ring-2 ring-rose-500/20 shadow-md'
                      : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${colorConfig.bgClass} ${colorConfig.textClass}`}>
                      <Folder className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {f.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {f.isStarred && (
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextItem(f);
                        setContextPos({ x: e.clientX, y: e.clientY });
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
          <div className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Files ({files.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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
                  <div className="p-3">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate mb-1">
                      {file.name}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span>{formatBytes(file.size)}</span>
                      <span>{formatTimeAgo(file.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Context Menu Modal Portal */}
      {contextItem && (
        <DriveContextMenu
          item={contextItem}
          isOpen={Boolean(contextItem)}
          onClose={() => setContextItem(null)}
          position={contextPos}
          onOpenRenameModal={onOpenRenameModal}
          onOpenMoveModal={onOpenMoveModal}
        />
      )}
    </div>
  );
}
