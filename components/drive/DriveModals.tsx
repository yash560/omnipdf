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
   3. Move Items Modal — Enhanced Recursive Folder Picker
   ========================================================== */

// ── Internal: one folder node in the pick tree ─────────────
interface MovePickerNodeProps {
  folder: DriveItem;
  depth: number;
  selectedIds: string[];           // items being moved (block self-move)
  selectedTargetId: string | null;
  onSelect: (id: string, path: string[]) => void;
  pathSoFar: string[];
}

function MovePickerNode({
  folder,
  depth,
  selectedIds,
  selectedTargetId,
  onSelect,
  pathSoFar,
}: MovePickerNodeProps) {
  const { fetchFolderChildren, folderCache } = useDrive();
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Skip vault folders and the folders being moved (no self-move)
  if (folder.isVault || selectedIds.includes(folder.id)) return null;

  const isSelected = selectedTargetId === folder.id;
  const folderColorClass = folder.color
    ? FOLDER_COLORS[folder.color]?.textClass ?? 'text-amber-500'
    : 'text-amber-500';

  const handleToggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      setIsExpanded(true);
      const cached = folderCache[folder.id];
      if (cached) {
        setChildren(cached.filter((i) => i.type === 'folder'));
      } else {
        setLoading(true);
        const items = await fetchFolderChildren(folder.id);
        setChildren(items.filter((i) => i.type === 'folder'));
        setLoading(false);
      }
    } else {
      setIsExpanded(false);
    }
  };

  const myPath = [...pathSoFar, folder.name];

  return (
    <div className="select-none">
      {/* Row */}
      <div
        onClick={() => onSelect(folder.id, myPath)}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        className={`group flex items-center gap-1.5 py-2 pr-2.5 rounded-xl cursor-pointer transition-all duration-100 ${
          isSelected
            ? 'bg-purple-500 text-white shadow-md'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
        }`}
      >
        {/* Expand chevron */}
        <button
          type="button"
          onClick={handleToggleExpand}
          className={`shrink-0 p-0.5 rounded-md transition-colors cursor-pointer ${
            isSelected
              ? 'hover:bg-white/20 text-white'
              : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          {loading ? (
            <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin inline-block" />
          ) : isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Folder icon */}
        {isExpanded ? (
          <FolderOpen className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : folderColorClass}`} />
        ) : (
          <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : folderColorClass}`} />
        )}

        {/* Name */}
        <span className="truncate text-xs font-semibold flex-1 min-w-0">{folder.name}</span>

        {/* Vault badge */}
        {folder.isVault && (
          <Lock className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white/70' : 'text-amber-500'}`} />
        )}

        {/* Check tick */}
        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
      </div>

      {/* Children */}
      {isExpanded && (
        <div className="ml-4 border-l border-zinc-200 dark:border-zinc-700/60">
          {children.length === 0 && !loading ? (
            <p className="pl-4 py-1.5 text-xs text-zinc-400 italic">Empty folder</p>
          ) : (
            children.map((sub) => (
              <MovePickerNode
                key={sub.id}
                folder={sub}
                depth={depth + 1}
                selectedIds={selectedIds}
                selectedTargetId={selectedTargetId}
                onSelect={onSelect}
                pathSoFar={myPath}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────
interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoveModal({ isOpen, onClose }: MoveModalProps) {
  useBodyScrollLock(isOpen);
  const { selectedIds, items, moveItems, fetchFolderChildren, createFolder, folderCache } = useDrive();

  const [rootFolders, setRootFolders] = useState<DriveItem[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);  // breadcrumb
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingRoot, setLoadingRoot] = useState(false);

  // New Folder inline flow
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load root folders on open ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setSelectedTargetId(null);
    setSelectedPath([]);
    setSearchQuery('');
    setNewFolderMode(false);
    setNewFolderName('');

    async function loadRoot() {
      const cached = folderCache['root'];
      if (cached) {
        setRootFolders(cached.filter((i) => i.type === 'folder'));
        return;
      }
      setLoadingRoot(true);
      const fetched = await fetchFolderChildren(null);
      setRootFolders(fetched.filter((i) => i.type === 'folder'));
      setLoadingRoot(false);
    }
    loadRoot();
  }, [isOpen, fetchFolderChildren, folderCache]);

  // ── Auto-focus search when it appears ─────────────────
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => searchRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ── Keyboard: Escape to close ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ── Items being moved (for the preview strip) ─────────
  const movingItems = items.filter((i) => selectedIds.includes(i.id));
  const previewNames = movingItems.slice(0, 2).map((i) => i.name);
  const extraCount = movingItems.length - previewNames.length;

  // ── Flat search mode: filter ALL root folders by name ─
  const searchActive = searchQuery.trim().length > 0;
  const searchTerm = searchQuery.toLowerCase();
  const filteredRoot = searchActive
    ? rootFolders.filter((f) => f.name.toLowerCase().includes(searchTerm))
    : rootFolders;

  // ── Handler: node selection ────────────────────────────
  const handleSelect = useCallback((id: string, path: string[]) => {
    setSelectedTargetId(id);
    setSelectedPath(path);
  }, []);

  // ── Handler: select root ───────────────────────────────
  const handleSelectRoot = () => {
    setSelectedTargetId(null);
    setSelectedPath([]);
  };

  // ── Handler: create new folder inline ─────────────────
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || creatingFolder) return;
    setCreatingFolder(true);
    try {
      const newFolder = await createFolder(newFolderName.trim());
      // Refresh root list
      const refreshed = await fetchFolderChildren(null);
      setRootFolders(refreshed.filter((i) => i.type === 'folder'));
      // Auto-select the new folder
      setSelectedTargetId(newFolder.id);
      setSelectedPath([newFolder.name]);
      setNewFolderMode(false);
      setNewFolderName('');
    } finally {
      setCreatingFolder(false);
    }
  };

  // ── Handler: confirm move ──────────────────────────────
  const handleMove = async () => {
    setSubmitting(true);
    try {
      await moveItems(selectedTargetId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // ── Destination label ──────────────────────────────────
  const destinationLabel =
    selectedTargetId === null
      ? 'My Drive (root)'
      : selectedPath.join(' / ') || 'Selected folder';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-modal-pop max-h-[90dvh] sm:max-h-[600px] overflow-hidden">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
              <FolderInput className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
                Move {selectedIds.length} Item{selectedIds.length > 1 ? 's' : ''}
              </h3>
              {/* Item preview strip */}
              {previewNames.length > 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                  {previewNames.join(', ')}{extraCount > 0 ? `, +${extraCount} more` : ''}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 btn-press cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Search Bar ───────────────────────────────────── */}
        <div className="px-5 pb-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 focus-within:ring-2 focus-within:ring-purple-500 transition-shadow">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── Folder Tree ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-0.5">

          {/* Root option */}
          {!searchActive && (
            <div
              onClick={handleSelectRoot}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100 ${
                selectedTargetId === null
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <Folder className={`w-4 h-4 shrink-0 ${selectedTargetId === null ? 'text-white' : 'text-zinc-500'}`} />
              <span className="text-xs font-bold flex-1">My Drive (Root)</span>
              {selectedTargetId === null && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
            </div>
          )}

          {/* Divider */}
          {!searchActive && rootFolders.length > 0 && (
            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
          )}

          {/* Loading skeleton */}
          {loadingRoot && (
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-400">
              <span className="w-3.5 h-3.5 rounded-full border border-purple-500 border-t-transparent animate-spin shrink-0" />
              Loading folders...
            </div>
          )}

          {/* No folders / search empty state */}
          {!loadingRoot && filteredRoot.length === 0 && (
            <div className="py-6 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Folder className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-xs text-zinc-400">
                {searchActive ? `No folders match "${searchQuery}"` : 'No folders yet'}
              </p>
              {!searchActive && (
                <button
                  type="button"
                  onClick={() => setNewFolderMode(true)}
                  className="text-xs text-purple-500 font-semibold hover:underline cursor-pointer"
                >
                  Create one
                </button>
              )}
            </div>
          )}

          {/* Recursive folder tree */}
          {filteredRoot.map((folder) => (
            <MovePickerNode
              key={folder.id}
              folder={folder}
              depth={0}
              selectedIds={selectedIds}
              selectedTargetId={selectedTargetId}
              onSelect={handleSelect}
              pathSoFar={[]}
            />
          ))}
        </div>

        {/* ── Inline New Folder Form ────────────────────────── */}
        {newFolderMode && (
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 shrink-0">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">New Folder Name</p>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') { setNewFolderMode(false); setNewFolderName(''); }
                }}
                placeholder="e.g. Q4 Documents"
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creatingFolder}
                className="px-3 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-bold btn-press cursor-pointer shrink-0"
              >
                {creatingFolder ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                ) : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setNewFolderMode(false); setNewFolderName(''); }}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Destination Banner + Footer ───────────────────── */}
        <div className="px-5 pt-3 pb-5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          {/* Destination path */}
          <div className="flex items-center gap-1.5 mb-3 px-3 py-2 rounded-xl bg-purple-500/8 dark:bg-purple-500/10 border border-purple-500/20">
            <ArrowRight className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
              <span className="text-zinc-400 font-normal">Moving to: </span>
              <span className="text-purple-600 dark:text-purple-400">{destinationLabel}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* New Folder trigger */}
            {!newFolderMode && (
              <button
                type="button"
                onClick={() => setNewFolderMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                New Folder
              </button>
            )}

            <div className="flex-1" />

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
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm btn-press cursor-pointer transition-colors"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  Move Here
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
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
