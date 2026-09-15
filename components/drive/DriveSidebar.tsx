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
  ChevronRight,
  PieChart
} from 'lucide-react';
import { DriveCategory } from '@/lib/drive/drive-types';
import { formatBytes } from '@/lib/drive/drive-helpers';

interface DriveSidebarProps {
  onOpenNewFolderModal: () => void;
}

export function DriveSidebar({ onOpenNewFolderModal }: DriveSidebarProps) {
  const {
    viewSection,
    selectedCategory,
    selectSection,
    uploadFiles,
    uploadDirectory,
    stats,
    isUploading,
    uploadProgress,
  } = useDrive();

  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
      e.target.value = '';
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
    }
  };

  const categoryItems: { id: DriveCategory; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'pdf', label: 'PDFs & Docs', icon: FileText, color: 'text-rose-500' },
    { id: 'image', label: 'Images & Vectors', icon: ImageIcon, color: 'text-purple-500' },
    { id: 'spreadsheet', label: 'Spreadsheets', icon: Table, color: 'text-emerald-500' },
    { id: 'media', label: 'Audio & Video', icon: Film, color: 'text-amber-500' },
    { id: 'archive', label: 'ZIP Archives', icon: FolderArchive, color: 'text-cyan-500' },
    { id: 'code', label: 'Code & Scripts', icon: FileCode, color: 'text-blue-500' },
  ];

  const totalUsed = stats?.totalBytes || 0;
  // Estimate ~50GB browser origin quota or standard reference
  const maxQuota = 50 * 1024 * 1024 * 1024;
  const quotaPercent = Math.min(100, Math.max(1, Math.round((totalUsed / maxQuota) * 100)));

  return (
    <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between p-4 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80">
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

      <div className="space-y-6">
        {/* "+ New" Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNewDropdownOpen(!newDropdownOpen)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-extrabold text-sm shadow-lg shadow-black/10 transition-all cursor-pointer group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Item</span>
          </button>

          {newDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNewDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-40 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setNewDropdownOpen(false);
                    onOpenNewFolderModal();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <span>New Folder</span>
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setNewDropdownOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>Upload Files</span>
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
                  <span>Upload Entire Folder</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Upload Status Card if active */}
        {isUploading && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1.5 animate-pulse">
            <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-400 text-[11px]">
              <span>Ingesting Files to Drive...</span>
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
            onClick={() => selectSection('my-drive')}
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
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${viewSection === 'my-drive' ? 'bg-black/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                {stats.totalFiles}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => selectSection('starred')}
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
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${viewSection === 'starred' ? 'bg-black/20 text-white' : 'bg-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                {stats.starredCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => selectSection('recent')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              viewSection === 'recent'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Recent</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectSection('trash')}
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
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${viewSection === 'trash' ? 'bg-black/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                {stats.trashCount}
              </span>
            )}
          </button>
        </nav>

        {/* Categories Section */}
        <div className="space-y-2 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
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
                  onClick={() => selectSection('category', cat.id)}
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
                    <span className="text-[10px] font-mono text-zinc-400">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Storage & Zero-Knowledge Guarantee Footer */}
      <div className="pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
        {/* Storage Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-rose-500" />
              <span>Offline Storage</span>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">{formatBytes(totalUsed)}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-purple-600 rounded-full"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400 leading-tight">
            100% Client-side IndexedDB. Zero cloud uploads.
          </p>
        </div>

        {/* Security Badge */}
        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Local Device Encrypted</span>
        </div>
      </div>
    </aside>
  );
}
