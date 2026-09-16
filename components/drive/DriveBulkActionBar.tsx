'use client';

import React from 'react';
import {
  Download,
  FolderInput,
  Tag,
  Lock,
  Unlock,
  Star,
  StarOff,
  Trash2,
  RotateCcw,
  X,
  CheckSquare,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  Layers,
  FileStack
} from 'lucide-react';
import { DriveViewSection } from '@/lib/drive/drive-types';

interface DriveBulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  selectedPdfCount?: number;
  isMergingPdfs?: boolean;
  copiedFeedback?: boolean;
  viewSection?: DriveViewSection;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onInvertSelection?: () => void;
  onBulkCopyInfo?: () => void;
  onBulkMergePdfs?: () => void;
  onBulkDownloadZip: () => void;
  onBulkMove: () => void;
  onBulkTag: () => void;
  onBulkVault: () => void;
  onBulkUnvault?: () => void;
  onBulkStar: () => void;
  onBulkUnstar?: () => void;
  onBulkAutoLabel?: () => void;
  onBulkTrash: () => void;
  onBulkRestore?: () => void;
  onBulkDeletePermanent?: () => void;
}

export const DriveBulkActionBar: React.FC<DriveBulkActionBarProps> = ({
  selectedCount,
  totalCount,
  selectedPdfCount = 0,
  isMergingPdfs = false,
  copiedFeedback = false,
  viewSection = 'my-drive',
  onClearSelection,
  onSelectAll,
  onInvertSelection,
  onBulkCopyInfo,
  onBulkMergePdfs,
  onBulkDownloadZip,
  onBulkMove,
  onBulkTag,
  onBulkVault,
  onBulkUnvault,
  onBulkStar,
  onBulkUnstar,
  onBulkAutoLabel,
  onBulkTrash,
  onBulkRestore,
  onBulkDeletePermanent,
}) => {
  if (selectedCount < 1) return null;

  const isTrashView = viewSection === 'trash';
  const isVaultView = viewSection === 'vault';

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200 max-w-[96vw] sm:max-w-4xl w-max">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-2xl bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-xl border border-white/10 shadow-2xl text-white">
        {/* Selection Count Pill & Quick Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 pr-2.5 sm:pr-3 border-r border-zinc-700/60 text-xs font-semibold shrink-0">
          <CheckSquare className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="whitespace-nowrap font-bold">
            {selectedCount} <span className="hidden md:inline">selected</span>
          </span>

          {onSelectAll && totalCount && selectedCount < totalCount && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer ml-1"
              title={`Select all ${totalCount} items`}
            >
              All
            </button>
          )}

          {onInvertSelection && (
            <button
              type="button"
              onClick={onInvertSelection}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
              title="Invert current selection"
            >
              Invert
            </button>
          )}
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* 1-Click PDF Merge if 2+ PDFs Selected */}
          {selectedPdfCount >= 2 && !isTrashView && onBulkMergePdfs && (
            <button
              type="button"
              onClick={onBulkMergePdfs}
              disabled={isMergingPdfs}
              className="px-2.5 py-1.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer shrink-0 disabled:opacity-50"
              title="Merge selected PDF files into one single document"
            >
              {isMergingPdfs ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              <span>Merge {selectedPdfCount} PDFs</span>
            </button>
          )}

          {/* Copy Names & Info to Clipboard */}
          {onBulkCopyInfo && (
            <button
              type="button"
              onClick={onBulkCopyInfo}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition text-zinc-300 hover:text-white cursor-pointer flex items-center gap-1"
              title="Copy details of selected items to clipboard"
            >
              {copiedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-bold hidden sm:inline">Copied!</span>
                </>
              ) : (
                <Copy className="w-4 h-4 text-zinc-300" />
              )}
            </button>
          )}

          {/* Download ZIP */}
          {!isTrashView && (
            <button
              type="button"
              onClick={onBulkDownloadZip}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition text-zinc-300 hover:text-white cursor-pointer"
              title="Download selected items as ZIP"
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Star & Unstar Buttons */}
          {!isTrashView && (
            <>
              <button
                type="button"
                onClick={onBulkStar}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition text-amber-300 hover:text-amber-200 cursor-pointer"
                title="Star selected items"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={onBulkUnstar}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title="Unstar selected items"
              >
                <StarOff className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Secure Vault: Lock & Unlock (Unvault) */}
          {!isTrashView && (
            <>
              {isVaultView ? (
                <button
                  type="button"
                  onClick={onBulkUnvault}
                  className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Unlock / Move out of Secure Vault"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Unlock / Remove</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onBulkVault}
                    className="p-1.5 sm:p-2 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded-xl transition cursor-pointer"
                    title="Lock in Secure Vault"
                  >
                    <Lock className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onBulkUnvault}
                    className="p-1.5 sm:p-2 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 rounded-xl transition cursor-pointer"
                    title="Unlock / Remove from Secure Vault"
                  >
                    <Unlock className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}

          {/* AI Auto-Labeler */}
          {!isTrashView && (
            <button
              type="button"
              onClick={onBulkAutoLabel}
              className="p-1.5 sm:p-2 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 rounded-xl transition cursor-pointer"
              title="Auto-label selected with AI"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* Move to Folder */}
          {!isTrashView && (
            <button
              type="button"
              onClick={onBulkMove}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition text-blue-400 hover:text-blue-300 cursor-pointer"
              title="Move selected to folder..."
            >
              <FolderInput className="w-4 h-4" />
            </button>
          )}

          {/* Bulk Tag, Category & Expiry Editor */}
          {!isTrashView && (
            <button
              type="button"
              onClick={onBulkTag}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition text-rose-400 hover:text-rose-300 cursor-pointer"
              title="Edit tags, category & expiry date"
            >
              <Tag className="w-4 h-4" />
            </button>
          )}

          {/* Trash / Restore / Delete Actions */}
          {isTrashView ? (
            <>
              {onBulkRestore && (
                <button
                  type="button"
                  onClick={onBulkRestore}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Restore all selected from trash"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              )}
              {onBulkDeletePermanent && (
                <button
                  type="button"
                  onClick={onBulkDeletePermanent}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Permanently delete forever"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Forever</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onBulkTrash}
              className="p-1.5 sm:p-2 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition cursor-pointer"
              title="Move selected to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="ml-1 sm:ml-2 p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer shrink-0"
          title="Clear Selection (Esc)"
          aria-label="Clear Selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

