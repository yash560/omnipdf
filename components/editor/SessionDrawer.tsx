'use client';

import { 
  FolderOpen, 
  X, 
  Trash2, 
  Download, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  HardDrive,
  CloudCheck,
  ArrowRight
} from 'lucide-react';
import { StudioSession } from '@/types/session';
import { formatBytes } from '@/lib/pdf/core';
import { exportWorkspaceBackup, clearAllSessionsFromDB } from '@/lib/storage/session-db';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface SessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StudioSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export function SessionDrawer({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}: SessionDrawerProps) {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const handleExportAll = async () => {
    const blob = await exportWorkspaceBackup();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filecraft_workspace_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-modal-backdrop">
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 h-full border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-drawer-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Workspace Sessions & Drafts
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {sessions.length} auto-saved sessions in local storage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.length > 0 ? (
            sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              const dateStr = new Date(sess.lastModified).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    onSelectSession(sess.id);
                    onClose();
                  }}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer btn-press ${
                    isActive
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500/60 ring-2 ring-rose-500/20 shadow-xs'
                      : 'bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {sess.filename}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                          <span>{formatBytes(sess.size)}</span>
                          <span>•</span>
                          <span>{sess.annotations?.length || 0} edits</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(sess.id);
                      }}
                      title="Delete Draft"
                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer btn-press"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last saved at {dateStr}
                    </span>
                    {isActive ? (
                      <span className="font-extrabold text-rose-500 flex items-center gap-1">
                        Active Tab <ArrowRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white font-bold">
                        Switch Session →
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-zinc-400">
              <HardDrive className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">No saved sessions</p>
              <p className="text-[11px]">Any open PDF will auto-save here automatically.</p>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 space-y-2">
          <button
            onClick={handleExportAll}
            disabled={sessions.length === 0}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer btn-press disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Workspace Backup (.json)</span>
          </button>

          {sessions.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full py-2 px-4 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors cursor-pointer btn-press"
            >
              Clear All Drafts
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
