'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DriveProvider, useDrive } from '@/lib/drive/drive-context';
import { DriveSidebar } from '@/components/drive/DriveSidebar';
import { DriveToolbar } from '@/components/drive/DriveToolbar';
import { DriveFastFilters } from '@/components/drive/DriveFastFilters';
import { DriveGrid } from '@/components/drive/DriveGrid';
import { DriveTable } from '@/components/drive/DriveTable';
import { DriveQuickLookModal } from '@/components/drive/DriveQuickLookModal';
import { DriveDetailsDrawer } from '@/components/drive/DriveDetailsDrawer';
import { DriveUploadManager } from '@/components/drive/DriveUploadManager';
import { DriveShareModal } from '@/components/drive/DriveShareModal';
import { DriveAuthGate } from '@/components/drive/DriveAuthGate';
import { DriveVaultModal } from '@/components/drive/DriveVaultModal';
import { DriveFolderChatModal } from '@/components/drive/DriveFolderChatModal';
import { DriveExpiryRadarModal } from '@/components/drive/DriveExpiryRadarModal';
import { DriveDedupModal } from '@/components/drive/DriveDedupModal';
import { DriveKeyboardShortcutsModal } from '@/components/drive/DriveKeyboardShortcutsModal';
import { DriveBulkActionBar } from '@/components/drive/DriveBulkActionBar';
import {
  NewFolderModal,
  RenameModal,
  MoveModal,
  EmptyTrashModal,
} from '@/components/drive/DriveModals';
import { DriveItem } from '@/lib/drive/drive-types';
import { 
  Cloud, 
  Upload, 
  FolderPlus, 
  FileText, 
  Sparkles, 
  Inbox,
  Lock,
  ArrowRight,
  Users
} from 'lucide-react';

// Helper to recursively traverse dropped files and nested folder trees
async function traverseFileSystemEntry(
  entry: any,
  path = ''
): Promise<{ path: string; file: File }[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file(
        (file: File) => {
          resolve([{ path: path ? `${path}/${file.name}` : file.name, file }]);
        },
        () => resolve([])
      );
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const entries: any[] = [];

    const readBatch = async (): Promise<any[]> => {
      return new Promise((resolve) => {
        dirReader.readEntries(
          (batch: any[]) => {
            if (!batch || batch.length === 0) {
              resolve(entries);
            } else {
              entries.push(...batch);
              readBatch().then(resolve);
            }
          },
          () => resolve(entries)
        );
      });
    };

    const allEntries = await readBatch();
    const currentPath = path ? `${path}/${entry.name}` : entry.name;
    const results = await Promise.all(
      allEntries.map((subEntry) => traverseFileSystemEntry(subEntry, currentPath))
    );
    return results.flat();
  }
  return [];
}

function DriveWorkspaceInner() {
  const {
    items,
    folders,
    files,
    loading,
    authRequired,
    viewLayout,
    viewSection,
    selectedCategory,
    previewItem,
    openPreview,
    closePreview,
    shareModalItem,
    closeShareModal,
    loadItems,
    uploadFiles,
    uploadDirectory,
    trashSelected,
    selectAll,
    clearSelection,
    selectedIds,
    toggleSelect,
    breadcrumbs,
    navigateToFolder,
    setSearchTerm,

    // Vault
    isVaultUnlocked,
    unlockVault,
    isVaultModalOpen,
    setIsVaultModalOpen,

    // Modals
    isFolderChatOpen,
    setIsFolderChatOpen,
    isExpiryRadarOpen,
    setIsExpiryRadarOpen,
    isDedupModalOpen,
    setIsDedupModalOpen,
    isKeyboardShortcutsOpen,
    setIsKeyboardShortcutsOpen,

    // Fast Filters
    activePerson,
    setActivePerson,
    activeVehicle,
    setActiveVehicle,
    selectedAiCategory,
    setSelectedAiCategory,

    // Batch Actions
    triggerBatchAction,
    bulkDownloadZip,
  } = useDrive();

  const searchParams = useSearchParams();

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<DriveItem | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);
  const [isDragOverScreen, setIsDragOverScreen] = useState(false);
  const [showFastFilters, setShowFastFilters] = useState(true);

  // Listen for query params from Global Search / Deep Links
  useEffect(() => {
    if (!searchParams) return;
    const folderParam = searchParams.get('folder');
    const previewParam = searchParams.get('preview');
    const tabParam = searchParams.get('tab');
    const qParam = searchParams.get('q');

    if (folderParam) {
      navigateToFolder(folderParam);
    }
    if (tabParam === 'expiry') {
      setIsExpiryRadarOpen(true);
    } else if (tabParam === 'vault') {
      setIsVaultModalOpen(true);
    } else if (tabParam === 'duplicates') {
      setIsDedupModalOpen(true);
    }
    if (qParam) {
      setSearchTerm(qParam);
    }
    if (previewParam && items.length > 0) {
      const match = items.find((it) => it.id === previewParam);
      if (match) {
        openPreview(match);
      }
    }
  }, [searchParams, items, navigateToFolder, openPreview, setSearchTerm, setIsExpiryRadarOpen, setIsVaultModalOpen, setIsDedupModalOpen]);

  // Global Keyboard Shortcuts (Space for Quick Look, Cmd+A, Del, ?, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === ' ' && selectedIds.length > 0) {
        // Spacebar -> Instant Quick Look Preview
        e.preventDefault();
        const selected = items.find((i) => i.id === selectedIds[0]);
        if (selected) {
          openPreview(selected);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        trashSelected();
      } else if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        selectAll();
      } else if (e.key === 'Escape') {
        clearSelection();
        closePreview();
        setIsFolderChatOpen(false);
        setIsExpiryRadarOpen(false);
        setIsDedupModalOpen(false);
        setIsKeyboardShortcutsOpen(false);
        setIsVaultModalOpen(false);
      } else if (e.key === '?') {
        setIsKeyboardShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIds,
    items,
    trashSelected,
    selectAll,
    clearSelection,
    openPreview,
    closePreview,
    setIsFolderChatOpen,
    setIsExpiryRadarOpen,
    setIsDedupModalOpen,
    setIsKeyboardShortcutsOpen,
    setIsVaultModalOpen,
  ]);

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

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const itemsList = Array.from(e.dataTransfer.items);
      const directoryEntries: { path: string; file: File }[] = [];
      const flatFiles: File[] = [];

      for (const it of itemsList) {
        if (typeof (it as any).webkitGetAsEntry === 'function') {
          const entry = (it as any).webkitGetAsEntry();
          if (entry) {
            if (entry.isDirectory) {
              const nested = await traverseFileSystemEntry(entry);
              directoryEntries.push(...nested);
              continue;
            } else if (entry.isFile) {
              const f = it.getAsFile();
              if (f) flatFiles.push(f);
              continue;
            }
          }
        }

        if (it.kind === 'file') {
          const f = it.getAsFile();
          if (f) flatFiles.push(f);
        }
      }

      if (directoryEntries.length > 0) {
        await uploadDirectory(directoryEntries);
      }
      if (flatFiles.length > 0) {
        await uploadFiles(flatFiles);
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  if (authRequired) {
    return <DriveAuthGate />;
  }

  const currentFolderCrumb = breadcrumbs[breadcrumbs.length - 1];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full overflow-hidden relative bg-zinc-50 dark:bg-zinc-950 font-sans"
    >
      {/* Drag & Drop Fullscreen Overlay */}
      {isDragOverScreen && (
        <div className="absolute inset-0 z-50 bg-rose-600/90 dark:bg-rose-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4 p-8 pointer-events-none animate-in fade-in duration-150">
          <div className="w-20 h-20 rounded-3xl bg-white/20 border-2 border-white/40 flex items-center justify-center animate-bounce">
            <Upload className="w-10 h-10" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight mb-1">
              Drop Files & Folders to Upload to FileCraft Cloud Drive
            </h2>
            <p className="text-sm text-rose-100 font-medium">
              Files and nested directory structures will be synchronized securely via 2MB chunked streams.
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
          showFastFilters={showFastFilters}
          onToggleFastFilters={() => setShowFastFilters(!showFastFilters)}
        />

        {/* Fast Filters Bar */}
        {showFastFilters && (
          <DriveFastFilters
            activePerson={activePerson}
            onSelectPerson={setActivePerson}
            activeVehicle={activeVehicle}
            onSelectVehicle={setActiveVehicle}
            activeCategory={selectedAiCategory || undefined}
            onSelectCategory={(cat) => setSelectedAiCategory(cat || null)}
            onClearAll={() => {
              setActivePerson(undefined);
              setActiveVehicle(undefined);
              setSelectedAiCategory(null);
            }}
          />
        )}

        {/* Scrollable Items Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-zinc-400 py-24">
              <span className="w-6 h-6 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold">Synchronizing Cloud Drive...</span>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-5 py-24">
              <div className="w-18 h-18 rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 shadow-inner">
                {viewSection === 'shared' ? (
                  <Users className="w-9 h-9 text-purple-500" />
                ) : viewSection === 'vault' ? (
                  <Lock className="w-9 h-9 text-amber-500" />
                ) : (
                  <Inbox className="w-9 h-9" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  {viewSection === 'trash'
                    ? 'Trash is Empty'
                    : viewSection === 'starred'
                    ? 'No Starred Items Yet'
                    : viewSection === 'recent'
                    ? 'No Recent Documents'
                    : viewSection === 'shared'
                    ? 'No Shared Items Yet'
                    : viewSection === 'vault'
                    ? 'Secure Vault is Empty'
                    : selectedCategory
                    ? `No ${selectedCategory.toUpperCase()} Files Found`
                    : 'Your Cloud Drive is Ready'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {viewSection === 'trash'
                    ? 'Deleted files and folders will appear here until permanently emptied.'
                    : viewSection === 'shared'
                    ? 'Files and folders shared with you by teammates or collaborators will appear here.'
                    : viewSection === 'vault'
                    ? 'Move sensitive files (passports, cards, tax documents) to the Secure Vault for PIN protection.'
                    : 'Drag & drop any files or folders anywhere on the screen, or click the button below to start.'}
                </p>
              </div>

              {viewSection !== 'trash' && viewSection !== 'shared' && (
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

      {/* Floating 2GB+ Resumable Upload Manager */}
      <DriveUploadManager />

      {/* Floating Multi-Select Bulk Action Dock */}
      <DriveBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={clearSelection}
        onBulkDownloadZip={bulkDownloadZip}
        onBulkMove={() => setMoveModalOpen(true)}
        onBulkTag={() => {
          const tag = prompt('Enter tag to apply to all selected items:');
          if (tag) triggerBatchAction('tag', { tags: [tag.trim()] });
        }}
        onBulkVault={() => triggerBatchAction('vault')}
        onBulkStar={() => triggerBatchAction('star')}
        onBulkTrash={trashSelected}
      />

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

      {/* Multi-Account Share & Collaboration Modal */}
      <DriveShareModal
        item={shareModalItem}
        onClose={closeShareModal}
        onItemUpdated={() => {
          loadItems();
        }}
      />

      {/* Quick Look Preview Modal */}
      <DriveQuickLookModal
        item={previewItem}
        onClose={closePreview}
      />

      {/* PIN-Protected Secure Vault Keypad Modal */}
      <DriveVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        hasPin={true}
        onSuccess={() => {
          unlockVault();
          loadItems();
        }}
      />

      {/* "Chat with Folder" Multi-Document AI RAG Modal */}
      <DriveFolderChatModal
        isOpen={isFolderChatOpen}
        onClose={() => setIsFolderChatOpen(false)}
        folderName={currentFolderCrumb?.name || 'My Drive'}
        items={items}
      />

      {/* Document Expiry Radar Modal */}
      <DriveExpiryRadarModal
        isOpen={isExpiryRadarOpen}
        onClose={() => setIsExpiryRadarOpen(false)}
        items={items}
        onSelectItem={(it) => openPreview(it)}
      />

      {/* Duplicate Document Cleaner Modal */}
      <DriveDedupModal
        isOpen={isDedupModalOpen}
        onClose={() => setIsDedupModalOpen(false)}
        onRefreshItems={loadItems}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <DriveKeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />
    </div>
  );
}

export default function DrivePage() {
  return (
    <DriveProvider>
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400">
          <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mb-2" />
          <span className="text-xs font-bold">Loading FileCraft Drive...</span>
        </div>
      }>
        <DriveWorkspaceInner />
      </Suspense>
    </DriveProvider>
  );
}
