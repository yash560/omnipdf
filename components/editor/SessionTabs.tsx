'use client';

import { useState, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  X, 
  FolderOpen, 
  Cloud, 
  Share2, 
  History, 
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { StudioSession } from '@/types/session';
import { AutoSaveIndicator } from './AutoSaveIndicator';

interface SessionTabsProps {
  sessions: StudioSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCloseSession: (id: string) => void;
  onNewSessionUpload: (file: File) => void;
  onOpenSessionDrawer: () => void;
  onOpenShareModal: () => void;
  isSaving: boolean;
  lastSavedTime: number | null;
}

export function SessionTabs({
  sessions,
  activeSessionId,
  onSelectSession,
  onCloseSession,
  onNewSessionUpload,
  onOpenSessionDrawer,
  onOpenShareModal,
  isSaving,
  lastSavedTime,
}: SessionTabsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onNewSessionUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 text-xs overflow-x-auto no-scrollbar">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left: Document Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Drawer button for all saved sessions */}
        <button
          onClick={onOpenSessionDrawer}
          title="View All Open Sessions & Unsaved Drafts"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[11px] font-bold shadow-xs cursor-pointer shrink-0"
        >
          <FolderOpen className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden sm:inline">Sessions</span>
          <span className="px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold">
            {sessions.length}
          </span>
        </button>

        <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />

        {/* Tab Items */}
        {sessions.map((sess) => {
          const isActive = sess.id === activeSessionId;
          return (
            <div
              key={sess.id}
              onClick={() => onSelectSession(sess.id)}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 max-w-[200px] ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs border border-zinc-200/90 dark:border-zinc-800'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-rose-500' : 'text-zinc-400'}`} />

              <span className="truncate text-[11px]" title={sess.filename}>
                {sess.filename}
              </span>

              {/* Unsaved indicator bullet */}
              {sess.isUnsaved && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
              )}

              {/* Close Tab Button */}
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseSession(sess.id);
                  }}
                  title="Close document tab"
                  className="p-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* + Open New Tab Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Open another PDF in a new tab"
          className="flex items-center gap-1 p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline text-[11px] font-bold">New Tab</span>
        </button>
      </div>

      {/* Right: Autosave Status & Cloud Share */}
      <div className="flex items-center gap-2 shrink-0">
        <AutoSaveIndicator
          isSaving={isSaving}
          lastSavedTime={lastSavedTime}
          isUnsaved={activeSession?.isUnsaved}
        />

        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-[11px] shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share Session</span>
        </button>
      </div>
    </div>
  );
}
