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
  Table as TableIcon,
  Film,
  FolderArchive,
  FileCode,
  File,
  Star,
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';

interface DriveTableProps {
  onOpenRenameModal: (item: DriveItem) => void;
  onOpenMoveModal: () => void;
}

export function DriveTable({ onOpenRenameModal, onOpenMoveModal }: DriveTableProps) {
  const {
    items,
    selectedIds,
    toggleSelect,
    navigateToFolder,
    openPreview,
    toggleStar,
    sortOption,
    setSortOption,
    setSelectedTag,
  } = useDrive();

  const [contextItem, setContextItem] = useState<DriveItem | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | undefined>(undefined);

  const handleContextMenu = (e: React.MouseEvent, item: DriveItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIds.includes(item.id)) {
      toggleSelect(item.id, false);
    }
    setContextPos({ x: e.clientX, y: e.clientY });
    setContextItem(item);
  };

  const handleSort = (field: 'name' | 'updatedAt' | 'size' | 'category') => {
    if (sortOption.field === field) {
      setSortOption({ field, order: sortOption.order === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortOption({ field, order: 'asc' });
    }
  };

  const getSmallIcon = (item: DriveItem) => {
    if (item.type === 'folder') {
      const col = FOLDER_COLORS[item.color || 'default'] || FOLDER_COLORS.default;
      return <Folder className={`w-4 h-4 fill-current ${col.textClass}`} />;
    }
    switch (item.category) {
      case 'pdf': return <FileText className="w-4 h-4 text-rose-500" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-purple-500" />;
      case 'spreadsheet': return <TableIcon className="w-4 h-4 text-emerald-500" />;
      case 'media': return <Film className="w-4 h-4 text-amber-500" />;
      case 'archive': return <FolderArchive className="w-4 h-4 text-cyan-500" />;
      case 'code': return <FileCode className="w-4 h-4 text-blue-500" />;
      default: return <File className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-800 dark:text-zinc-200">
          <thead className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800 text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <span className="sr-only">Star</span>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="px-4 py-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Name</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="hidden md:table-cell px-4 py-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Type</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('updatedAt')}
                className="hidden sm:table-cell px-4 py-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Last Modified</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('size')}
                className="px-4 py-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Size</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
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
                  onClick={(e) => toggleSelect(item.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  onDoubleClick={() => (isFolder ? navigateToFolder(item.id) : openPreview(item))}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  className={`group transition-colors select-none cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/10 dark:bg-rose-950/30'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {/* Star Toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(item.id);
                      }}
                      className="p-1 rounded-md text-zinc-300 dark:text-zinc-600 hover:text-amber-400"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          item.isStarred
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Name + Icon + Tags */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0 max-w-sm sm:max-w-md">
                      <div className="shrink-0">{getSmallIcon(item)}</div>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.name}
                        </div>
                        {item.aiSummary && (
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 italic">
                            {item.aiSummary}
                          </p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTag(tag);
                                }}
                                className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[9px] font-bold hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                              >
                                #{tag}
                              </button>
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
                  <td className="hidden sm:table-cell px-4 py-3 text-zinc-500 font-mono text-[11px]">
                    {formatTimeAgo(item.updatedAt)}
                  </td>

                  {/* Size */}
                  <td className="px-4 py-3 text-right text-zinc-500 font-mono text-[11px]">
                    {isFolder ? '—' : formatBytes(item.size)}
                  </td>

                  {/* 3-Dot Context Trigger */}
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextItem(item);
                        setContextPos({ x: e.clientX, y: e.clientY });
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
