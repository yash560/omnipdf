'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveItem, FOLDER_COLORS } from '@/lib/drive/drive-types';
import { formatBytes, formatTimeAgo, getFileCraftToolsForItem } from '@/lib/drive/drive-helpers';
import { DriveContextMenu } from './DriveContextMenu';
import { DriveThumbnail } from './DriveThumbnail';
import {
  Folder,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Table,
  Film,
  FolderArchive,
  FileCode,
  File,
  Star,
  Download,
  Eye,
  Lock,
  Calendar,
  Sparkles,
  Share2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ColumnState {
  folderId: string | null;
  folderName: string;
  items: DriveItem[];
  selectedItemId: string | null;
  loading: boolean;
}

interface DriveColumnViewProps {
  onOpenRenameModal: (item: DriveItem) => void;
  onOpenMoveModal: () => void;
}

export function DriveColumnView({ onOpenRenameModal, onOpenMoveModal }: DriveColumnViewProps) {
  const {
    items,
    currentFolderId,
    breadcrumbs,
    navigateToFolder,
    openPreview,
    downloadItem,
    toggleStar,
    moveItems,
    selectedIds,
    toggleSelect,
    openShareModal,
    triggerAutoLabel,
    fetchFolderChildren,
    prefetchFolder,
    folderCache,
  } = useDrive();

  const [columns, setColumns] = useState<ColumnState[]>([]);
  const [contextItem, setContextItem] = useState<DriveItem | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | undefined>(undefined);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Root Column with Current Items
  useEffect(() => {
    const rootName = breadcrumbs[breadcrumbs.length - 1]?.name || 'My Drive';
    setColumns([
      {
        folderId: currentFolderId,
        folderName: rootName,
        items: items,
        selectedItemId: selectedIds.length === 1 ? selectedIds[0] : null,
        loading: false,
      },
    ]);
  }, [currentFolderId, items, breadcrumbs, selectedIds]);

  // Auto-scroll horizontally when columns expand
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [columns.length]);

  const handleSelectFolder = async (colIndex: number, folder: DriveItem) => {
    // Select this item in the current column
    const updated = columns.slice(0, colIndex + 1);
    updated[colIndex] = {
      ...updated[colIndex],
      selectedItemId: folder.id,
    };

    // Add loading placeholder for the next column
    const nextColIndex = colIndex + 1;
    updated[nextColIndex] = {
      folderId: folder.id,
      folderName: folder.name,
      items: folderCache[folder.id] || [],
      selectedItemId: null,
      loading: !folderCache[folder.id],
    };
    setColumns(updated);

    // Fetch children if not cached
    if (!folderCache[folder.id]) {
      const childItems = await fetchFolderChildren(folder.id);
      setColumns((prev) => {
        const next = [...prev];
        if (next[nextColIndex]) {
          next[nextColIndex] = {
            ...next[nextColIndex],
            items: childItems,
            loading: false,
          };
        }
        return next;
      });
    }
  };

  const handleSelectFile = (colIndex: number, file: DriveItem) => {
    const updated = columns.slice(0, colIndex + 1);
    updated[colIndex] = {
      ...updated[colIndex],
      selectedItemId: file.id,
    };
    toggleSelect(file.id, false);
    setColumns(updated);
  };

  const handleContextMenu = (e: React.MouseEvent, item: DriveItem) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSelect(item.id, false);
    setContextPos({ x: e.clientX, y: e.clientY });
    setContextItem(item);
  };

  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetFolderId) {
      toggleSelect(draggedId, false);
      await moveItems(targetFolderId);
    }
  };

  const getFileIcon = (cat: string) => {
    switch (cat) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'spreadsheet':
        return <Table className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'media':
        return <Film className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'archive':
        return <FolderArchive className="w-4 h-4 text-cyan-500 shrink-0" />;
      case 'code':
        return <FileCode className="w-4 h-4 text-blue-500 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-zinc-400 shrink-0" />;
    }
  };

  // Find the currently selected file in the deepest column for the Inspector pane
  const lastColumn = columns[columns.length - 1];
  const selectedInspectorItem = lastColumn?.selectedItemId
    ? lastColumn.items.find((i) => i.id === lastColumn.selectedItemId && i.type === 'file')
    : null;

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 flex w-full h-[calc(100vh-220px)] overflow-x-auto overflow-y-hidden divide-x divide-zinc-200 dark:divide-zinc-800/80 bg-white/50 dark:bg-zinc-950/50 select-none no-scrollbar rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs"
    >
      {columns.map((column, colIndex) => {
        const colFolders = column.items.filter((i) => i.type === 'folder');
        const colFiles = column.items.filter((i) => i.type === 'file');

        return (
          <div
            key={`${column.folderId || 'root'}-${colIndex}`}
            className="w-64 sm:w-72 xl:w-80 shrink-0 h-full flex flex-col bg-white dark:bg-zinc-900/40 border-r border-zinc-200/80 dark:border-zinc-800/80"
          >
            {/* Column Header */}
            <div className="px-3.5 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  {column.folderName}
                </span>
              </div>
              <span className="text-3xs font-mono px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-zinc-500 font-bold shrink-0">
                {column.items.length}
              </span>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
              {column.loading ? (
                <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                  <span className="text-xs font-semibold">Loading...</span>
                </div>
              ) : column.items.length === 0 ? (
                <div className="text-center py-12 text-xs text-zinc-400 font-medium">
                  Empty folder
                </div>
              ) : (
                <>
                  {/* Folders Group */}
                  {colFolders.map((folder) => {
                    const isSelected = column.selectedItemId === folder.id;
                    const folderColorClass = folder.color
                      ? FOLDER_COLORS[folder.color]?.textClass || 'text-amber-500'
                      : 'text-amber-500';
                    const isDragTarget = dragOverFolderId === folder.id;

                    return (
                      <div
                        key={folder.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', folder.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverFolderId(folder.id);
                        }}
                        onDragLeave={() => setDragOverFolderId(null)}
                        onDrop={(e) => handleFolderDrop(e, folder.id)}
                        onMouseEnter={() => prefetchFolder(folder.id)}
                        onClick={() => handleSelectFolder(colIndex, folder)}
                        onDoubleClick={() => navigateToFolder(folder.id)}
                        onContextMenu={(e) => handleContextMenu(e, folder)}
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          isDragTarget
                            ? 'bg-rose-500/20 border-2 border-dashed border-rose-500'
                            : isSelected
                            ? 'bg-rose-500 text-white font-bold shadow-xs'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          <Folder
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isSelected ? 'text-white' : folderColorClass
                            }`}
                          />
                          <span className="truncate">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {folder.isStarred && (
                            <Star
                              className={`w-3 h-3 ${
                                isSelected ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'
                              }`}
                            />
                          )}
                          <ChevronRight
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Divider if both exist */}
                  {colFolders.length > 0 && colFiles.length > 0 && (
                    <div className="my-1.5 border-t border-zinc-100 dark:border-zinc-800/60" />
                  )}

                  {/* Files Group */}
                  {colFiles.map((file) => {
                    const isSelected = column.selectedItemId === file.id;

                    return (
                      <div
                        key={file.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', file.id)}
                        onClick={() => handleSelectFile(colIndex, file)}
                        onDoubleClick={() => openPreview(file)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          {getFileIcon(file.category)}
                          <span className="truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-3xs opacity-80">
                          {file.isStarred && (
                            <Star
                              className={`w-3 h-3 ${
                                isSelected ? 'fill-current' : 'fill-amber-400 text-amber-400'
                              }`}
                            />
                          )}
                          {file.isVault && (
                            <Lock
                              className={`w-3 h-3 ${
                                isSelected ? 'text-current' : 'text-amber-500'
                              }`}
                            />
                          )}
                          <span className="font-mono">{formatBytes(file.size)}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Terminal Inspector / Preview Column */}
      {selectedInspectorItem && (
        <div className="w-80 sm:w-96 shrink-0 h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto p-5 space-y-5 animate-in slide-in-from-left duration-150">
          {/* File Thumbnail / Preview Hero */}
          <div className="w-full aspect-video rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
            <DriveThumbnail item={selectedInspectorItem} view="column" />

            {/* Quick Look Overlay Button */}
            <button
              type="button"
              onClick={() => openPreview(selectedInspectorItem)}
              className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold cursor-pointer z-10"
            >
              <Eye className="w-4 h-4" />
              <span>Quick Look (Space)</span>
            </button>
          </div>

          {/* Title & Primary Metadata */}
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 break-words leading-snug">
              {selectedInspectorItem.name}
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {formatBytes(selectedInspectorItem.size)} • {selectedInspectorItem.extension ? `${selectedInspectorItem.extension.toUpperCase()} Document` : selectedInspectorItem.category.toUpperCase()}
            </p>
          </div>

          {/* Quick Action Button Matrix */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openPreview(selectedInspectorItem)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => downloadItem(selectedInspectorItem)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={() => toggleStar(selectedInspectorItem.id)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  selectedInspectorItem.isStarred ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'
                }`}
              />
              <span>{selectedInspectorItem.isStarred ? 'Unstar' : 'Star'}</span>
            </button>
            <button
              type="button"
              onClick={() => openShareModal(selectedInspectorItem)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-500" />
              <span>Share</span>
            </button>
          </div>

          {/* AI Insights & Semantic Tags */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>AI Metadata & Tags</span>
              </span>
              <button
                type="button"
                onClick={() => triggerAutoLabel([selectedInspectorItem.id])}
                className="text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer"
              >
                Re-Analyze
              </button>
            </div>

            {selectedInspectorItem.tags && selectedInspectorItem.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedInspectorItem.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 text-3xs font-bold"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-3xs text-zinc-400">No semantic tags generated yet.</p>
            )}

            {(selectedInspectorItem.ocrSnippet || selectedInspectorItem.aiSummary) && (
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-3xs text-zinc-600 dark:text-zinc-300 line-clamp-4 leading-relaxed">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">Recognized Content: </span>
                {selectedInspectorItem.ocrSnippet || selectedInspectorItem.aiSummary}
              </div>
            )}
          </div>

          {/* Detailed Attributes */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Created:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {formatTimeAgo(selectedInspectorItem.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Modified:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {formatTimeAgo(selectedInspectorItem.updatedAt)}
              </span>
            </div>
            {selectedInspectorItem.expiryDate && (
              <div className="flex items-center justify-between py-1">
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Expires:</span>
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {new Date(selectedInspectorItem.expiryDate).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Vault Protected:</span>
              <span
                className={`font-bold ${
                  selectedInspectorItem.isVault
                    ? 'text-amber-500'
                    : 'text-zinc-500'
                }`}
              >
                {selectedInspectorItem.isVault ? 'Locked (PIN Required)' : 'No'}
              </span>
            </div>
          </div>

          {/* Quick FileCraft Tools Launcher */}
          {getFileCraftToolsForItem(selectedInspectorItem).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
                Open in Productivity Suite
              </div>
              <div className="space-y-1">
                {getFileCraftToolsForItem(selectedInspectorItem).map((tool) => (
                  <Link
                    key={tool.href}
                    href={`${tool.href}?file=${encodeURIComponent(selectedInspectorItem.id)}`}
                    className="flex items-center justify-between p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <span>{tool.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextItem && (
        <DriveContextMenu
          item={contextItem}
          isOpen={!!contextItem}
          onClose={() => setContextItem(null)}
          position={contextPos}
          onOpenRenameModal={onOpenRenameModal}
          onOpenMoveModal={onOpenMoveModal}
        />
      )}
    </div>
  );
}
