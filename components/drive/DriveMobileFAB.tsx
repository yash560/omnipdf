'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { triggerHaptic } from '@/lib/drive/haptics';
import {
  Plus,
  Upload,
  FolderPlus,
  Sparkles,
  CheckSquare,
  Clock,
  X,
  Camera,
  Layers,
} from 'lucide-react';

interface DriveMobileFABProps {
  onOpenNewFolderModal: () => void;
}

export function DriveMobileFAB({ onOpenNewFolderModal }: DriveMobileFABProps) {
  const {
    uploadFiles,
    setIsFolderChatOpen,
    setIsExpiryRadarOpen,
    selectAll,
    selectedIds,
    openSmartUpload,
  } = useDrive();

  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Close when tapping outside or pressing ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerHaptic('success');
      await uploadFiles(Array.from(e.target.files));
      e.target.value = '';
      setIsOpen(false);
    }
  };

  const toggleFAB = () => {
    triggerHaptic(isOpen ? 'light' : 'medium');
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hidden File & Camera Input Elements */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-2xs lg:hidden animate-modal-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Action Menu Buttons */}
      <div className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-2.5 lg:hidden select-none">
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5 mb-1 animate-floating-dock">
            {/* Smart Studio / Multi-Upload */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsOpen(false);
                openSmartUpload('files');
              }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xl text-xs font-black btn-press cursor-pointer"
            >
              <span>Smart Upload & Merge</span>
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </button>

            {/* Document Camera Scanner */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsOpen(false);
                openSmartUpload('camera');
              }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 btn-press cursor-pointer"
            >
              <span>Scan Documents</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
            </button>

            {/* Upload Files */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                fileInputRef.current?.click();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 btn-press cursor-pointer"
            >
              <span>Upload Files</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
            </button>

            {/* New Folder */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsOpen(false);
                onOpenNewFolderModal();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 btn-press cursor-pointer"
            >
              <span>New Folder</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FolderPlus className="w-4 h-4" />
              </div>
            </button>

            {/* Folder AI Chat */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsOpen(false);
                setIsFolderChatOpen(true);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 btn-press cursor-pointer"
            >
              <span>Folder AI Chat</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Master FAB Button */}
        <button
          type="button"
          onClick={toggleFAB}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-[transform,background-color,box-shadow] duration-200 active:scale-90 cursor-pointer ${
            isOpen
              ? 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rotate-45'
              : 'bg-gradient-to-tr from-rose-600 to-rose-500 shadow-rose-500/30 hover:scale-105'
          }`}
          title="Quick Actions"
          aria-label="Quick Actions"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </>
  );
}
