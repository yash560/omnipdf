'use client';

import React, { useState, useRef } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { 
  Plus, 
  HardDrive, 
  Star, 
  Clock, 
  Trash2, 
  FolderPlus, 
  Upload, 
  FolderUp, 
  FileText, 
  Image as ImageIcon, 
  Table, 
  Film, 
  FileCode, 
  FolderArchive, 
  ShieldCheck, 
  Sparkles,
  PieChart,
  Users,
  Lock,
  Calendar,
  Copy,
  Shield,
  HelpCircle,
  Layers,
  Settings,
  X
} from 'lucide-react';
import { DriveCategory } from '@/lib/drive/drive-types';
import { formatBytes } from '@/lib/drive/drive-helpers';

interface DriveSidebarProps {
  onOpenNewFolderModal: () => void;
  onOpenDossiersModal?: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export function DriveSidebar({ 
  onOpenNewFolderModal, 
  onOpenDossiersModal,
  isMobileDrawer = false,
  onCloseMobileDrawer
}: DriveSidebarProps) {
  const {
    viewSection,
    selectedCategory,
    selectSection,
    uploadFiles,
    uploadDirectory,
    stats,
    isUploading,
    uploadProgress,
    isVaultUnlocked,
    setIsVaultModalOpen,
    openVaultModal,
    setIsExpiryRadarOpen,
    setIsDedupModalOpen,
    setIsKeyboardShortcutsOpen,
  } = useDrive();

  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
      e.target.value = '';
      if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).map((f) => ({
        path: (f as any).webkitRelativePath || f.name,
        file: f,
      }));
      await uploadDirectory(filesArray);
      e.target.value = '';
      if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
    }
  };

  const categoryItems: { id: DriveCategory; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'pdf', label: 'PDFs & Docs', icon: FileText, color: 'text-rose-500' },
    { id: 'image', label: 'Images & Scans', icon: ImageIcon, color: 'text-purple-500' },
    { id: 'spreadsheet', label: 'Spreadsheets', icon: Table, color: 'text-emerald-500' },
    { id: 'media', label: 'Audio & Video', icon: Film, color: 'text-amber-500' },
    { id: 'archive', label: 'ZIP Archives', icon: FolderArchive, color: 'text-cyan-500' },
    { id: 'code', label: 'Code & Scripts', icon: FileCode, color: 'text-blue-500' },
  ];

  const handleNavClick = (action: () => void) => {
    action();
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const totalUsed = stats?.totalBytes || 0;
  const maxQuota = 100 * 1024 * 1024 * 1024; // 100 GB cloud tier
  const quotaPercent = Math.min(100, Math.max(1, Math.round((totalUsed / maxQuota) * 100)));

  return (
    <aside
      className={
        isMobileDrawer
          ? 'w-full h-full flex flex-col justify-between p-4 bg-white dark:bg-zinc-950 overflow-y-auto'
          : 'hidden lg:flex w-64 xl:w-72 shrink-0 flex-col justify-between p-4 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 h-full overflow-y-auto select-none'
      }
    >
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFolderChange}
      />

      <div className="space-y-4">
        {/* Mobile Header with Close Button */}
        {isMobileDrawer && (
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white text-xs font-black shadow-xs">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                FileCraft Drive
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* New Item Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNewDropdownOpen(!newDropdownOpen)}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>New Upload</span>
          </button>

          {/* New Item Menu Popover */}
          {newDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setNewDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setNewDropdownOpen(false);
                    onOpenNewFolderModal();
                    if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <span>New Folder</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewDropdownOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>Upload Files (2GB+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewDropdownOpen(false);
                    folderInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <FolderUp className="w-4 h-4 text-purple-500" />
                  <span>Upload Entire Folder Tree</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Upload Status Card */}
        {isUploading && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1.5 animate-pulse">
            <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-400 text-3xs">
              <span>Ingesting Files to Cloud...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-rose-200 dark:bg-rose-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Primary Navigation Sections */}
        <nav className="space-y-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleNavClick(() => selectSection('my-drive'))}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              viewSection === 'my-drive'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4" />
              <span>My Drive</span>
            </div>
            {stats && stats.totalFiles > 0 && (
              <span className={`text-3xs font-mono px-2 py-0.5 rounded-full ${viewSection === 'my-drive' ? 'bg-black/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                {stats.totalFiles}
              </span>
            )}
          </button>

          {/* Secure Vault Item */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => handleNavClick(() => selectSection('vault'))}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                viewSection === 'vault'
                  ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {isVaultUnlocked ? (
                  <Shield className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-500" />
                )}
                <span>Secure Vault</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-3xs font-mono px-2 py-0.5 rounded-full ${
                  viewSection === 'vault' 
                    ? 'bg-black/20 text-white' 
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                }`}>
                  {isVaultUnlocked ? 'Unlocked' : 'PIN'}
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openVaultModal('configure');
              }}
              title="Configure Vault PIN & Auto-Lock Settings"
              aria-label="Configure Vault PIN & Auto-Lock Settings"
              className={`absolute right-14 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all cursor-pointer ${
                viewSection === 'vault'
                  ? 'text-white/80 hover:text-white hover:bg-white/20'
                  : 'text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 opacity-60 group-hover:opacity-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expiry Radar Item */}
          <button
            type="button"
            onClick={() => handleNavClick(() => setIsExpiryRadarOpen(true))}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Expiry Radar</span>
            </div>
            {stats && (stats.expiringCount || stats.expiredCount) ? (
              <span className="text-3xs font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold">
                {stats.expiredCount ? `${stats.expiredCount} Due` : 'Active'}
              </span>
            ) : null}
          </button>

          {/* Smart Dossiers */}
          {onOpenDossiersModal && (
            <button
              type="button"
              onClick={() => handleNavClick(onOpenDossiersModal)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Smart Dossiers</span>
              </div>
              <span className="text-3xs font-mono px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold">
                Auto
              </span>
            </button>
          )}

          {/* Duplicate Cleaner */}
          <button
            type="button"
            onClick={() => handleNavClick(() => setIsDedupModalOpen(true))}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <Copy className="w-4 h-4 text-blue-400" />
              <span>Clean Duplicates</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick(() => selectSection('starred'))}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              viewSection === 'starred'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Starred</span>
            </div>
            {stats && stats.starredCount > 0 && (
              <span className={`text-3xs font-mono px-2 py-0.5 rounded-full ${viewSection === 'starred' ? 'bg-black/20 text-white' : 'bg-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                {stats.starredCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick(() => selectSection('shared'))}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              viewSection === 'shared'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Shared with Me</span>
            </div>
            {stats && (stats.sharedWithMeCount || 0) > 0 && (
              <span className={`text-3xs font-mono px-2 py-0.5 rounded-full ${viewSection === 'shared' ? 'bg-black/20 text-white' : 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'}`}>
                {stats.sharedWithMeCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick(() => selectSection('trash'))}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              viewSection === 'trash'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-zinc-400" />
              <span>Trash</span>
            </div>
            {stats && stats.trashCount > 0 && (
              <span className={`text-3xs font-mono px-2 py-0.5 rounded-full ${viewSection === 'trash' ? 'bg-black/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                {stats.trashCount}
              </span>
            )}
          </button>
        </nav>

        {/* Categories Section */}
        <div className="space-y-2 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div className="px-3.5 text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
            Categories
          </div>
          <div className="space-y-0.5">
            {categoryItems.map((cat) => {
              const Icon = cat.icon;
              const isSelected = viewSection === 'category' && selectedCategory === cat.id;
              const count = stats?.categoryCount[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleNavClick(() => selectSection('category', cat.id))}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold border border-zinc-300 dark:border-zinc-700'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                    <span>{cat.label}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-3xs font-mono text-zinc-400">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Storage & Shortcuts Footer */}
      <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
        {/* Storage Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-rose-500" />
              <span>Cloud Storage</span>
            </div>
            <span className="font-mono text-3xs text-zinc-500">{formatBytes(totalUsed)}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-purple-600 rounded-full"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          <p className="text-3xs text-zinc-400 leading-tight">
            MongoDB GridFS Multi-Device Storage.
          </p>
        </div>

        {/* Shortcuts Button */}
        <button
          onClick={() => setIsKeyboardShortcutsOpen(true)}
          className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-3xs text-zinc-500 dark:text-zinc-400 transition"
        >
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span>Keyboard Shortcuts</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-3xs">?</kbd>
        </button>
      </div>
    </aside>
  );
}
