'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveItem, FOLDER_COLORS } from '@/lib/drive/drive-types';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Lock,
  Plus,
} from 'lucide-react';

interface DriveFolderTreeNodeProps {
  folder: DriveItem;
  depth: number;
  onNavigate?: () => void;
  onOpenNewFolderModal?: () => void;
}

function DriveFolderTreeNode({
  folder,
  depth,
  onNavigate,
  onOpenNewFolderModal,
}: DriveFolderTreeNodeProps) {
  const {
    currentFolderId,
    navigateToFolder,
    fetchFolderChildren,
    prefetchFolder,
    moveItems,
    toggleSelect,
    folderCache,
  } = useDrive();

  const [isExpanded, setIsExpanded] = useState(false);
  const [subFolders, setSubFolders] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const isCurrentActive = currentFolderId === folder.id;
  const folderColorClass = folder.color
    ? FOLDER_COLORS[folder.color]?.textClass || 'text-amber-500'
    : 'text-amber-500';

  // If expanded, fetch or get from cache
  const handleToggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      setIsExpanded(true);
      if (folderCache[folder.id]) {
        const cached = folderCache[folder.id].filter((i) => i.type === 'folder');
        setSubFolders(cached);
      } else {
        setLoading(true);
        const children = await fetchFolderChildren(folder.id);
        setSubFolders(children.filter((i) => i.type === 'folder'));
        setLoading(false);
      }
    } else {
      setIsExpanded(false);
    }
  };

  const handleSelectFolder = () => {
    navigateToFolder(folder.id);
    if (onNavigate) onNavigate();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== folder.id) {
      toggleSelect(draggedId, false);
      await moveItems(folder.id);
    }
  };

  return (
    <div className="select-none text-xs">
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', folder.id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => prefetchFolder(folder.id)}
        onClick={handleSelectFolder}
        style={{ paddingLeft: `${Math.max(4, depth * 12)}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-xl cursor-pointer transition-all ${
          isDragOver
            ? 'bg-rose-500/20 border border-dashed border-rose-500 text-rose-600'
            : isCurrentActive
            ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0">
          <button
            type="button"
            onClick={handleToggleExpand}
            className="p-0.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer shrink-0"
          >
            {loading ? (
              <span className="w-3 h-3 rounded-full border border-rose-500 border-t-transparent animate-spin inline-block" />
            ) : isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {isExpanded ? (
            <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isCurrentActive ? 'text-rose-500' : folderColorClass}`} />
          ) : (
            <Folder className={`w-3.5 h-3.5 shrink-0 ${isCurrentActive ? 'text-rose-500' : folderColorClass}`} />
          )}

          <span className="truncate">{folder.name}</span>
        </div>

        {folder.isVault && (
          <Lock className="w-3 h-3 text-amber-500 shrink-0 ml-1 opacity-70" />
        )}
      </div>

      {/* Render Subfolders */}
      {isExpanded && subFolders.length > 0 && (
        <div className="space-y-0.5 mt-0.5 border-l border-zinc-200/60 dark:border-zinc-800/60 ml-2">
          {subFolders.map((sub) => (
            <DriveFolderTreeNode
              key={sub.id}
              folder={sub}
              depth={depth + 1}
              onNavigate={onNavigate}
              onOpenNewFolderModal={onOpenNewFolderModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DriveFolderTreeProps {
  onNavigate?: () => void;
  onOpenNewFolderModal?: () => void;
}

export function DriveFolderTree({ onNavigate, onOpenNewFolderModal }: DriveFolderTreeProps) {
  const { fetchFolderChildren, folderCache, items, currentFolderId } = useDrive();
  const [rootFolders, setRootFolders] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRootFolders() {
      if (folderCache['root']) {
        const cached = folderCache['root'].filter((i) => i.type === 'folder');
        setRootFolders(cached);
      } else {
        setLoading(true);
        const allRoot = await fetchFolderChildren(null);
        if (isMounted) {
          setRootFolders(allRoot.filter((i) => i.type === 'folder'));
          setLoading(false);
        }
      }
    }
    loadRootFolders();
    return () => {
      isMounted = false;
    };
  }, [fetchFolderChildren, folderCache, currentFolderId]);

  if (loading && rootFolders.length === 0) {
    return (
      <div className="py-2 px-3 text-3xs text-zinc-400 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full border border-rose-500 border-t-transparent animate-spin" />
        <span>Loading folders...</span>
      </div>
    );
  }

  if (rootFolders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0.5 py-1">
      {rootFolders.map((folder) => (
        <DriveFolderTreeNode
          key={folder.id}
          folder={folder}
          depth={1}
          onNavigate={onNavigate}
          onOpenNewFolderModal={onOpenNewFolderModal}
        />
      ))}
    </div>
  );
}
