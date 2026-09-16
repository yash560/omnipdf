'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveItem, DriveFolderColor, FOLDER_COLORS } from '@/lib/drive/drive-types';
import { formatBytes, formatTimeAgo, getFileCraftToolsForItem } from '@/lib/drive/drive-helpers';
import { DriveThumbnail } from './DriveThumbnail';
import { triggerHaptic } from '@/lib/drive/haptics';
import {
  Eye,
  Download,
  Edit2,
  FolderInput,
  Star,
  StarOff,
  Sparkles,
  Trash2,
  RotateCcw,
  Wrench,
  Share2,
  Lock,
  Unlock,
  CheckSquare,
  Info,
  Palette,
  X,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface DriveMobileActionSheetProps {
  item: DriveItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRenameModal: (item: DriveItem) => void;
  onOpenMoveModal: () => void;
  onOpenDetailsDrawer?: (item: DriveItem) => void;
}

export function DriveMobileActionSheet({
  item,
  isOpen,
  onClose,
  onOpenRenameModal,
  onOpenMoveModal,
  onOpenDetailsDrawer,
}: DriveMobileActionSheetProps) {
  const {
    viewSection,
    openPreview,
    openShareModal,
    downloadItem,
    duplicateItem,
    toggleStar,
    changeFolderColor,
    trashSelected,
    restoreSelected,
    deleteSelectedPermanently,
    toggleSelect,
    selectedIds,
    triggerBatchAction,
    triggerAutoLabel,
    bulkDownloadZip,
    openQuickTools,
    copySelectedInfoToClipboard,
  } = useDrive();

  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);

  // Close when ESC is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isMulti = selectedIds.length > 1 && selectedIds.includes(item.id);
  const isFolder = item.type === 'folder';
  const tools = getFileCraftToolsForItem(item);
  const colorConfig = FOLDER_COLORS[item.color || 'default'] || FOLDER_COLORS.default;

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY !== null) {
      const currentY = e.touches[0].clientY;
      const delta = currentY - dragStartY;
      if (delta > 0) {
        setDragCurrentY(delta);
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragCurrentY && dragCurrentY > 90) {
      triggerHaptic('light');
      onClose();
    }
    setDragStartY(null);
    setDragCurrentY(null);
  };

  const handleCopyLink = async () => {
    triggerHaptic('light');
    const shareUrl = `${window.location.origin}/share/${item.id}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      {/* Click outside to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-Up Bottom Sheet Container */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragCurrentY ? `translateY(${dragCurrentY}px)` : undefined,
          transition: dragCurrentY ? 'none' : 'transform 200ms ease-out',
        }}
        className="w-full max-h-[88vh] bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 pb-6"
      >
        {/* Grab Handle Bar for Swipe-Down */}
        <div className="w-full pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {/* Item Header Card */}
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0 overflow-hidden relative border border-zinc-200/60 dark:border-zinc-700/60">
              <DriveThumbnail item={item} view="grid" />
              {item.isVault && (
                <div className="absolute top-1 right-1 p-0.5 rounded-full bg-amber-500 text-white z-10">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                <span>{item.name}</span>
                {item.isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
              </h3>
              <p className="text-3xs text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{isFolder ? 'Folder' : formatBytes(item.size)}</span>
                <span>•</span>
                <span>{formatTimeAgo(item.updatedAt || item.createdAt)}</span>
                {item.category && <span className="capitalize px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-semibold">{item.category}</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            aria-label="Close sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
          {/* Quick Action Icon Grid */}
          <div className="grid grid-cols-4 gap-2">
            {/* Quick Look / Preview */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
                openPreview(item);
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">Open</span>
            </button>

            {/* Share Modal */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
                openShareModal(item);
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">Share</span>
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
                downloadItem(item);
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">Download</span>
            </button>

            {/* Star Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                toggleStar(item.id);
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                {item.isStarred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4 fill-amber-400" />}
              </div>
              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                {item.isStarred ? 'Unstar' : 'Star'}
              </span>
            </button>
          </div>

          {/* Dedicated In-Place Quick Studio Button (PDF, Image, CSV, Text, Audio) */}
          {item.type !== 'folder' && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
                openQuickTools(item);
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-purple-500/10 border border-rose-500/30 text-xs font-bold text-zinc-900 dark:text-zinc-100 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500 text-white shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Quick Edit Studio</div>
                  <div className="text-3xs text-zinc-500 font-normal">Rotate/Split PDF, Crop Image, Trim Media, Edit CSV</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          )}

          {/* Action List Items */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
            {/* Rename */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
                onOpenRenameModal(item);
              }}
              className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 active:bg-zinc-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Edit2 className="w-4 h-4 text-zinc-500" />
                <span>Rename</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Move to Folder */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
                if (!selectedIds.includes(item.id)) toggleSelect(item.id, false);
                onOpenMoveModal();
              }}
              className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 active:bg-zinc-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderInput className="w-4 h-4 text-blue-500" />
                <span>Move to Folder...</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* AI Auto-Label & Summary */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
                triggerAutoLabel([item.id]);
              }}
              className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 active:bg-zinc-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Auto-Label with AI</span>
              </div>
              <span className="text-3xs text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full">
                AI
              </span>
            </button>

            {/* Secure Vault Lock/Unlock */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onClose();
                  if (item.isVault) {
                    triggerBatchAction('unvault');
                  } else {
                    if (!selectedIds.includes(item.id)) toggleSelect(item.id, false);
                    triggerBatchAction('vault');
                  }
                }}
                className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 active:bg-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.isVault ? <Unlock className="w-4 h-4 text-amber-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                  <span>{item.isVault ? 'Remove from Secure Vault' : 'Lock in Secure Vault'}</span>
                </div>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              </button>
            )}

            {/* Folder Color Picker (Folders Only) */}
            {isFolder && (
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-pink-500" />
                    <span>Folder Color</span>
                  </div>
                  <span className="text-3xs text-zinc-400 capitalize">{item.color || 'default'}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {(Object.keys(FOLDER_COLORS) as DriveFolderColor[]).map((col) => {
                    const cfg = FOLDER_COLORS[col];
                    const isSelected = (item.color || 'default') === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          changeFolderColor(item.id, col);
                        }}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${cfg.bgClass} ${
                          isSelected ? 'ring-2 ring-rose-500 scale-110 shadow-xs' : 'opacity-80 hover:opacity-100'
                        }`}
                        title={col}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-current" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multi-Select Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onClose();
                toggleSelect(item.id, true);
              }}
              className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 active:bg-zinc-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4 text-rose-500" />
                <span>{selectedIds.includes(item.id) ? 'Deselect Item' : 'Select Item'}</span>
              </div>
              <span className="text-3xs text-zinc-400 font-mono">Tap & Hold</span>
            </button>
          </div>

          {/* Destructive Actions */}
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 overflow-hidden">
            {viewSection === 'trash' ? (
              <div className="divide-y divide-rose-200/40 dark:divide-rose-900/40">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('success');
                    onClose();
                    restoreSelected();
                  }}
                  className="w-full flex items-center gap-3 p-3.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore from Trash</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('error');
                    onClose();
                    deleteSelectedPermanently();
                  }}
                  className="w-full flex items-center gap-3 p-3.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning');
                  onClose();
                  if (!selectedIds.includes(item.id)) toggleSelect(item.id, false);
                  trashSelected();
                }}
                className="w-full flex items-center gap-3 p-3.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Move to Trash</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
