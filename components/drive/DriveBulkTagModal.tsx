'use client';

import React, { useState } from 'react';
import { DriveCategory } from '@/lib/drive/drive-types';
import { Tag, Calendar, Folder, X, Plus, Sparkles, Check } from 'lucide-react';

interface DriveBulkTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApply: (params: {
    tags?: string[];
    category?: DriveCategory;
    expiryDate?: number | null;
  }) => void;
}

const POPULAR_TAGS = [
  'identity',
  'invoice',
  'tax',
  'salary',
  'vehicle',
  'contract',
  'receipt',
  'insurance',
  'medical',
  'property',
  'education',
  'bank',
  'statement',
  'confidential',
];

const CATEGORIES: { value: DriveCategory; label: string; icon: string }[] = [
  { value: 'document', label: 'Document (PDF/Docs)', icon: '📄' },
  { value: 'spreadsheet', label: 'Spreadsheet (Excel/CSV)', icon: '📊' },
  { value: 'image', label: 'Image (PNG/JPG)', icon: '🖼️' },
  { value: 'media', label: 'Media (Video/Audio)', icon: '🎬' },
  { value: 'code', label: 'Code & Scripts', icon: '💻' },
  { value: 'archive', label: 'Archive (ZIP/TAR)', icon: '📦' },
];

export function DriveBulkTagModal({
  isOpen,
  onClose,
  selectedCount,
  onApply,
}: DriveBulkTagModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DriveCategory | ''>('');
  const [expiryDateString, setExpiryDateString] = useState('');
  const [clearExpiry, setClearExpiry] = useState(false);

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd?: string) => {
    const raw = tagToAdd || tagInput;
    const clean = raw.trim().replace(/^#+/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    if (!tagToAdd) setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let expiryDate: number | null | undefined = undefined;
    if (clearExpiry) {
      expiryDate = null;
    } else if (expiryDateString) {
      expiryDate = new Date(expiryDateString).getTime();
    }

    onApply({
      tags: tags.length > 0 ? tags : undefined,
      category: selectedCategory ? selectedCategory : undefined,
      expiryDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                Bulk Edit Metadata
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                Applying updates to {selectedCount} selected items
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Tags Section */}
          <div className="space-y-2">
            <label className="font-extrabold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-rose-500" />
                <span>Apply Tags</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">Press enter to add</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">#</span>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. invoice2026, medical..."
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Added Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-xs"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-800 dark:hover:text-rose-200 cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Quick Add Suggestions */}
            <div className="pt-1">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Popular Suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {POPULAR_TAGS.map((t) => {
                  const isAdded = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => (isAdded ? handleRemoveTag(t) : handleAddTag(t))}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer ${
                        isAdded
                          ? 'bg-rose-500 text-white border-rose-600'
                          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/60'
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />

          {/* Category Section */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-500" />
              <span>Change File Category (Optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? '' : cat.value)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />

          {/* Expiry Date Section */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Set Document Expiry / Renewal Date</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={expiryDateString}
                disabled={clearExpiry}
                onChange={(e) => {
                  setExpiryDateString(e.target.value);
                  setClearExpiry(false);
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => {
                  setClearExpiry(!clearExpiry);
                  if (!clearExpiry) setExpiryDateString('');
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer shrink-0 ${
                  clearExpiry
                    ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                Clear Expiry
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300 text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to {selectedCount} Items</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
