'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveItem, DriveFolderColor, FOLDER_COLORS } from '@/lib/drive/drive-types';
import { fetchCloudItems } from '@/lib/drive/cloud-api';
import { 
  X, 
  FolderPlus, 
  Edit2, 
  FolderInput, 
  Trash2, 
  Folder, 
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  ArrowRight,
  Palette,
  Lock,
} from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

/* ==========================================================
   1. New Folder Modal
   ========================================================== */
interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewFolderModal({ isOpen, onClose }: NewFolderModalProps) {
  useBodyScrollLock(isOpen);
  const { createFolder } = useDrive();
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState<DriveFolderColor>('default');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setSelectedColor('default');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createFolder(folderName.trim(), selectedColor);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-modal-backdrop">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-modal-pop">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              New Folder
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 btn-press cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Q3 Tax Receipts, Design Assets"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-semibold shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {(Object.keys(FOLDER_COLORS) as DriveFolderColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 btn-press cursor-pointer ${
                    selectedColor === c ? 'ring-2 ring-rose-500 ring-offset-2 scale-110' : 'border-white dark:border-zinc-800'
                  }`}
                  style={{ backgroundColor: FOLDER_COLORS[c].hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim() || submitting}
              className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-extrabold shadow-sm disabled:opacity-40 btn-press cursor-pointer"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================
   2. Rename Modal
   ========================================================== */
interface RenameModalProps {
  item: DriveItem | null;
  onClose: () => void;
}

export function RenameModal({ item, onClose }: RenameModalProps) {
  useBodyScrollLock(!!item);
  const { renameItem } = useDrive();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await renameItem(item.id, name.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-modal-backdrop">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-modal-pop">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Edit2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              Rename {item.type === 'folder' ? 'Folder' : 'File'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 btn-press cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              New Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-semibold shadow-inner"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-sm disabled:opacity-40 btn-press cursor-pointer"
            >
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================
   3. Move Items Modal (Folder Selector Tree)
   ========================================================== */
interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoveModal({ isOpen, onClose }: MoveModalProps) {
  useBodyScrollLock(isOpen);
  const { selectedIds, moveItems } = useDrive();
  const [folderTree, setFolderTree] = useState<DriveItem[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadFolders() {
      if (isOpen) {
        try {
          const res = await fetchCloudItems({ parentId: null, section: 'my-drive' });
          const rootFolders = (res.items || []).filter((i) => i.type === 'folder');
          setFolderTree(rootFolders);
        } catch {
          setFolderTree([]);
        }
        setSelectedTargetId(null);
      }
    }
    loadFolders();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMove = async () => {
    setSubmitting(true);
    try {
      await moveItems(selectedTargetId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-modal-backdrop">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-modal-pop">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <FolderInput className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              Move {selectedIds.length} Item{selectedIds.length > 1 ? 's' : ''} to...
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 btn-press cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Folder Selector */}
        <div className="max-h-60 overflow-y-auto space-y-1 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setSelectedTargetId(null)}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedTargetId === null
                ? 'bg-rose-500 text-white shadow-sm'
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>📁 My Drive (Root)</span>
          </button>

          {folderTree.map((f) => {
            const isSelected = selectedTargetId === f.id;
            const isSelf = selectedIds.includes(f.id);
            if (isSelf) return null; // Don't show folder moving into itself

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedTargetId(f.id)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <Folder className="w-4 h-4 text-amber-500" />
                <span className="truncate">{f.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-extrabold shadow-sm btn-press cursor-pointer"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   4. Empty Trash Confirmation Modal
   ========================================================== */
interface EmptyTrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmptyTrashModal({ isOpen, onClose }: EmptyTrashModalProps) {
  useBodyScrollLock(isOpen);
  const { emptyTrash } = useDrive();
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleEmpty = async () => {
    setSubmitting(true);
    try {
      await emptyTrash();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-modal-backdrop">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-modal-pop">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <Trash2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">
            Empty Trash Permanently?
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            All files and folders currently in the trash will be permanently deleted from your local device storage. This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleEmpty}
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm btn-press cursor-pointer"
          >
            Empty Trash Now
          </button>
        </div>
      </div>
    </div>
  );
}
