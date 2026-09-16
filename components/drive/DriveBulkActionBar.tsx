'use client';

import React from 'react';
import { Download, FolderInput, Tag, Lock, Star, Trash2, X, CheckSquare, Sparkles } from 'lucide-react';
import { DriveItem } from '@/lib/drive/drive-types';

interface DriveBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDownloadZip: () => void;
  onBulkMove: () => void;
  onBulkTag: () => void;
  onBulkVault: () => void;
  onBulkStar: () => void;
  onBulkTrash: () => void;
}

export const DriveBulkActionBar: React.FC<DriveBulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDownloadZip,
  onBulkMove,
  onBulkTag,
  onBulkVault,
  onBulkStar,
  onBulkTrash,
}) => {
  if (selectedCount < 2) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-6 duration-200 max-w-[95vw]">
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-xl border border-white/10 shadow-2xl text-white overflow-x-auto no-scrollbar">
        {/* Selection Count */}
        <div className="flex items-center gap-2 pr-3 border-r border-zinc-700/60 text-xs font-semibold">
          <CheckSquare className="w-4 h-4 text-rose-400" />
          <span>{selectedCount} selected</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onBulkDownloadZip}
            className="p-2 hover:bg-white/10 rounded-xl transition text-zinc-300 hover:text-white"
            title="Download all as ZIP"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onBulkMove}
            className="p-2 hover:bg-white/10 rounded-xl transition text-zinc-300 hover:text-white"
            title="Move to folder"
          >
            <FolderInput className="w-4 h-4" />
          </button>

          <button
            onClick={onBulkTag}
            className="p-2 hover:bg-white/10 rounded-xl transition text-zinc-300 hover:text-white"
            title="Bulk tag / category"
          >
            <Tag className="w-4 h-4" />
          </button>

          <button
            onClick={onBulkVault}
            className="p-2 hover:bg-white/10 rounded-xl transition text-amber-400 hover:text-amber-300"
            title="Move to Secure Vault"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={onBulkStar}
            className="p-2 hover:bg-white/10 rounded-xl transition text-amber-300 hover:text-amber-200"
            title="Star all"
          >
            <Star className="w-4 h-4" />
          </button>

          <button
            onClick={onBulkTrash}
            className="p-2 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition"
            title="Move all to Trash"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="ml-2 p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition"
          title="Deselect all (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
