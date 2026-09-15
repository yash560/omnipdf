'use client';

import React, { useState, useEffect } from 'react';
import { DriveProvider, useDrive } from '@/lib/drive/drive-context';
import { DriveSidebar } from '@/components/drive/DriveSidebar';
import { DriveToolbar } from '@/components/drive/DriveToolbar';
import { DriveGrid } from '@/components/drive/DriveGrid';
import { DriveTable } from '@/components/drive/DriveTable';
import { DriveQuickLookModal } from '@/components/drive/DriveQuickLookModal';
import { DriveDetailsDrawer } from '@/components/drive/DriveDetailsDrawer';
import {
  NewFolderModal,
  RenameModal,
  MoveModal,
  EmptyTrashModal,
} from '@/components/drive/DriveModals';
import { DriveItem } from '@/lib/drive/drive-types';
import { 
  HardDrive, 
  Upload, 
  FolderPlus, 
  FileText, 
  Sparkles, 
  Inbox,
  Lock,
  ArrowRight
} from 'lucide-react';

function DriveWorkspaceInner() {
  const {
    items,
    folders,
    files,
    loading,
    viewLayout,
    viewSection,
    selectedCategory,
    previewItem,
    closePreview,
    uploadFiles,
    uploadDirectory,
    trashSelected,
    selectAll,
    clearSelection,
  } = useDrive();

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<DriveItem | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);
  const [isDragOverScreen, setIsDragOverScreen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        trashSelected();
      } else if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        selectAll();
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trashSelected, selectAll, clearSelection]);

  // Global Drag & Drop to Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverScreen(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOverScreen(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverScreen(false);

    if (e.dataTransfer.items) {
      const itemsList = Array.from(e.dataTransfer.items);
      const filesToUpload: File[] = [];

      for (const it of itemsList) {
        if (it.kind === 'file') {
          const f = it.getAsFile();
          if (f) filesToUpload.push(f);
        }
      }

      if (filesToUpload.length > 0) {
        await uploadFiles(filesToUpload);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full overflow-hidden relative bg-zinc-50 dark:bg-zinc-950 font-sans"
    >
      {/* Drag & Drop Fullscreen Overlay */}
      {isDragOverScreen && (
        <div className="absolute inset-0 z-50 bg-rose-500/90 dark:bg-rose-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4 p-8 pointer-events-none animate-in fade-in duration-150">
          <div className="w-20 h-20 rounded-3xl bg-white/20 border-2 border-white/40 flex items-center justify-center animate-bounce">
            <Upload className="w-10 h-10" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight mb-1">
              Drop Files to Ingest into FileCraft Drive
            </h2>
            <p className="text-sm text-rose-100 font-medium">
              Files will be stored privately in local IndexedDB. Zero cloud uploads.
            </p>
          </div>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <DriveSidebar onOpenNewFolderModal={() => setNewFolderOpen(true)} />

      {/* Main Drive Workspace Canvas */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white dark:bg-zinc-900/60">
        <DriveToolbar
          onOpenMoveModal={() => setMoveModalOpen(true)}
          onOpenEmptyTrashConfirm={() => setEmptyTrashConfirmOpen(true)}
        />

        {/* Scrollable Items Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-zinc-400 py-24">
              <span className="w-6 h-6 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold">Synchronizing Local Drive...</span>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-5 py-24">
              <div className="w-18 h-18 rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 shadow-inner">
                <Inbox className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  {viewSection === 'trash'
                    ? 'Trash is Empty'
                    : viewSection === 'starred'
                    ? 'No Starred Items Yet'
                    : viewSection === 'recent'
                    ? 'No Recent Documents'
                    : selectedCategory
                    ? `No ${selectedCategory.toUpperCase()} Files Found`
                    : 'Your Drive is Ready'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {viewSection === 'trash'
                    ? 'Deleted files and folders will appear here until permanently emptied.'
                    : 'Drag & drop any files anywhere on the screen, or click the buttons below to get started.'}
                </p>
              </div>

              {viewSection !== 'trash' && (
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewFolderOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 text-amber-500" />
                    <span>Create Folder</span>
                  </button>
                </div>
              )}
            </div>
          ) : viewLayout === 'grid' ? (
            <DriveGrid
              onOpenRenameModal={(it) => setRenameItem(it)}
              onOpenMoveModal={() => setMoveModalOpen(true)}
            />
          ) : (
            <DriveTable
              onOpenRenameModal={(it) => setRenameItem(it)}
              onOpenMoveModal={() => setMoveModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Right Metadata Inspector Drawer */}
      <DriveDetailsDrawer />

      {/* Modals & Dialogs */}
      <NewFolderModal
        isOpen={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
      />

      <RenameModal
        item={renameItem}
        onClose={() => setRenameItem(null)}
      />

      <MoveModal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
      />

      <EmptyTrashModal
        isOpen={emptyTrashConfirmOpen}
        onClose={() => setEmptyTrashConfirmOpen(false)}
      />

      {/* Quick Look Preview Modal */}
      <DriveQuickLookModal
        item={previewItem}
        onClose={closePreview}
      />
    </div>
  );
}

export default function DrivePage() {
  return (
    <DriveProvider>
      <DriveWorkspaceInner />
    </DriveProvider>
  );
}
