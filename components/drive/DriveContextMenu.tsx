'use client';

import React, { useState } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveItem, DriveFolderColor, FOLDER_COLORS } from '@/lib/drive/drive-types';
import { getFileCraftToolsForItem } from '@/lib/drive/drive-helpers';
import {
  Eye,
  Download,
  Edit2,
  FolderInput,
  Copy,
  Star,
  StarOff,
  Palette,
  Sparkles,
  Trash2,
  RotateCcw,
  Wrench,
  ChevronRight,
  ExternalLink,
  Share2,
  Lock,
  Unlock,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';

interface DriveContextMenuProps {
  item: DriveItem;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  onOpenRenameModal: (item: DriveItem) => void;
  onOpenMoveModal: () => void;
}

export function DriveContextMenu({
  item,
  isOpen,
  onClose,
  position,
  onOpenRenameModal,
  onOpenMoveModal,
}: DriveContextMenuProps) {
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
  } = useDrive();

  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  if (!isOpen) return null;

  const isMulti = selectedIds.length > 1 && selectedIds.includes(item.id);
  const tools = getFileCraftToolsForItem(item);
  const isFolder = item.type === 'folder';

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        style={
          position
            ? {
                top: Math.max(12, Math.min(position.y, window.innerHeight - 380)),
                left: Math.max(12, Math.min(position.x, window.innerWidth - 264)),
              }
            : undefined
        }
        className={`${
          position ? 'fixed' : 'absolute right-2 top-8'
        } w-64 max-w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 p-1.5 text-xs text-zinc-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Multi-Selection Context Menu Mode */}
        {isMulti ? (
          <>
            <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-3xs font-extrabold uppercase text-rose-500">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{selectedIds.length} Items Selected</span>
              </span>
            </div>

            {/* Batch Download ZIP */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  bulkDownloadZip();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Download as ZIP</span>
              </button>
            )}

            {/* Batch Star */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  triggerBatchAction('star');
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Star All Selected</span>
              </button>
            )}

            {/* Batch Unstar */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  triggerBatchAction('unstar');
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <StarOff className="w-4 h-4 text-zinc-400" />
                <span>Unstar All Selected</span>
              </button>
            )}

            {/* Batch Lock in Vault */}
            {viewSection !== 'trash' && viewSection !== 'vault' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  triggerBatchAction('vault');
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-semibold cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Lock in Secure Vault</span>
              </button>
            )}

            {/* Batch Unlock from Vault */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  triggerBatchAction('unvault');
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock / Remove from Vault</span>
              </button>
            )}

            {/* Batch AI Auto-Label */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  triggerAutoLabel(selectedIds);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-semibold cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Auto-Label with AI</span>
              </button>
            )}

            {/* Batch Move */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMoveModal();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <FolderInput className="w-4 h-4 text-blue-500" />
                <span>Move to Folder...</span>
              </button>
            )}

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

            {/* Batch Trash / Restore */}
            {viewSection === 'trash' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    restoreSelected();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Selected</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    deleteSelectedPermanently();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-rose-600 dark:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected Forever</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  trashSelected();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Move Selected to Trash</span>
              </button>
            )}
          </>
        ) : (
          /* Single Item Context Menu Mode */
          <>
            {/* Quick Look Preview */}
            {!isFolder && viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openPreview(item);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-500" />
                <span>Preview (Quick Look)</span>
              </button>
            )}

            {/* In-Place Quick Tools */}
            {!isFolder && viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openQuickTools(item);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-gradient-to-r from-rose-500/10 to-indigo-500/10 hover:from-rose-500/20 hover:to-indigo-500/20 text-rose-600 dark:text-rose-400 font-bold cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                <span>
                  {item.category === 'image'
                    ? '⚡ Quick Crop & Resize...'
                    : item.category === 'pdf'
                    ? '⚡ Quick Rotate & Split...'
                    : item.category === 'spreadsheet'
                    ? '⚡ Quick Clean & Convert...'
                    : item.category === 'code' || item.category === 'document'
                    ? '⚡ Quick Edit & Format...'
                    : item.category === 'media'
                    ? '⚡ Quick Trim Media...'
                    : item.category === 'archive'
                    ? '⚡ Extract to Drive Folder...'
                    : '⚡ Quick In-Place Tools...'}
                </span>
              </button>
            )}

            {/* FileCraft Tools Submenu */}
            {tools.length > 0 && viewSection !== 'trash' && (
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setToolsMenuOpen(true)}
                  onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Wrench className="w-4 h-4" />
                    <span>Open in FileCraft Tools</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {toolsMenuOpen && (
                  <div
                    onMouseLeave={() => setToolsMenuOpen(false)}
                    className="absolute left-full top-0 -ml-1 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 space-y-0.5 z-50 animate-in fade-in slide-in-from-left-2 duration-150"
                  >
                    <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                      Tool Workspaces
                    </div>
                    {tools.map((t, idx) => (
                      <Link
                        key={idx}
                        href={t.href}
                        onClick={onClose}
                        className="w-full flex items-start gap-2 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-rose-500 shrink-0" />
                        <div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs truncate">
                            {t.label}
                          </div>
                          <div className="text-[10px] text-zinc-400 leading-tight">
                            {t.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

            {/* Download / ZIP */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  downloadItem(item);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>{isFolder ? 'Download Folder as ZIP' : 'Download File'}</span>
              </button>
            )}

            {/* Share & Collaborate */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openShareModal(item);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-rose-500" />
                <span>Share & Collaborate</span>
              </button>
            )}

            {/* Rename */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRenameModal(item);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-zinc-500" />
                <span>Rename</span>
              </button>
            )}

            {/* Move To */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (!selectedIds.includes(item.id)) {
                    toggleSelect(item.id, false);
                  }
                  onOpenMoveModal();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <FolderInput className="w-4 h-4 text-blue-500" />
                <span>Move to...</span>
              </button>
            )}

            {/* Duplicate (files only) */}
            {!isFolder && viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  duplicateItem(item.id);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                <Copy className="w-4 h-4 text-zinc-500" />
                <span>Make a Copy</span>
              </button>
            )}

            {/* Star Toggle */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  toggleStar(item.id);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
              >
                {item.isStarred ? (
                  <>
                    <StarOff className="w-4 h-4 text-zinc-400" />
                    <span>Remove from Starred</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Add to Starred</span>
                  </>
                )}
              </button>
            )}

            {/* Vault Lock / Unlock Toggle */}
            {viewSection !== 'trash' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  triggerBatchAction(item.isVault ? 'unvault' : 'vault', { itemIds: [item.id] });
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-semibold cursor-pointer"
              >
                {item.isVault ? (
                  <>
                    <Unlock className="w-4 h-4 text-emerald-500" />
                    <span>Unlock from Vault</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Lock in Secure Vault</span>
                  </>
                )}
              </button>
            )}

            {/* Folder Color Palette (Folders only) */}
            {isFolder && viewSection !== 'trash' && (
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setColorMenuOpen(true)}
                  onClick={() => setColorMenuOpen(!colorMenuOpen)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-purple-500" />
                    <span>Folder Color</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {colorMenuOpen && (
                  <div
                    onMouseLeave={() => setColorMenuOpen(false)}
                    className="absolute left-full top-0 -ml-1 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-left-2 duration-150"
                  >
                    <div className="text-[10px] font-extrabold uppercase text-zinc-400 mb-2 px-1">
                      Choose Color
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {(Object.keys(FOLDER_COLORS) as DriveFolderColor[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            changeFolderColor(item.id, c);
                            onClose();
                          }}
                          title={FOLDER_COLORS[c].label}
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
                          style={{ backgroundColor: FOLDER_COLORS[c].hex }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

            {/* Trash Actions */}
            {viewSection === 'trash' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (!selectedIds.includes(item.id)) toggleSelect(item.id, false);
                    restoreSelected();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore from Trash</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (!selectedIds.includes(item.id)) toggleSelect(item.id, false);
                    deleteSelectedPermanently();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-rose-600 dark:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Permanently</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (!selectedIds.includes(item.id)) toggleSelect(item.id, false);
                  trashSelected();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Move to Trash</span>
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
