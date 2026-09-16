'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FolderLock, 
  Crown, 
  Sparkles, 
  FileText, 
  HardDrive, 
  Share2, 
  Clock, 
  ArrowRight, 
  Trash2, 
  Plus, 
  Layers, 
  Scissors, 
  Minimize2, 
  FileEdit,
  PenTool,
  Lock,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { StudioSession } from '@/types/session';
import { getAllSessionsFromDB, deleteSessionFromDB } from '@/lib/storage/session-db';

export default function DashboardPage() {
  const { user, isPro, isAuthenticated, openAuthModal } = useAuth();
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const stored = await getAllSessionsFromDB();
        setSessions(stored);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteSessionFromDB(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center mb-4 border border-rose-500/20">
          <FolderLock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">
          Sign In to Access Your Cloud Workspace
        </h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
          Access all your synchronized documents, encrypted share links, and unlimited AI vision tools across all your devices.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-sm shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
        >
          Sign In to FileCraft
        </button>
      </div>
    );
  }

  const storageUsedMb = user ? (user.usage.storageBytes / (1024 * 1024)).toFixed(1) : '14.5';
  const maxStorageMb = user ? (user.usage.maxStorageBytes / (1024 * 1024)).toFixed(0) : '1000';

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* User Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold uppercase border border-amber-300/30 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                <span>{user?.plan || 'Pro'} Cloud Plan</span>
              </span>
              <span className="text-xs text-zinc-400">Enterprise Private Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Yash Jain'}!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Your documents are synchronized and secured with client-side encryption. You have full access to the complete Document Productivity Suite and Enterprise Intelligence.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <Link
              href={sessions.length > 0 ? `/edit?session=${sessions[0].id}` : '/edit?new=true'}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
            >
              <FileEdit className="w-4 h-4" />
              <span>Open PDF Studio</span>
            </Link>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-bold">
            <span>Documents Stored</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {sessions.length + (user?.usage.documentsCount || 0)}
          </div>
          <div className="text-[11px] text-zinc-400">Synced across your devices</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-bold">
            <span>AI Queries Used</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {user?.usage.aiQueriesUsed || 128}
          </div>
          <div className="text-[11px] text-emerald-500 font-bold">Enterprise Intelligence Active</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-bold">
            <span>Cloud Storage</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {storageUsedMb} <span className="text-xs font-medium text-zinc-400">/ {maxStorageMb} MB</span>
          </div>
          <div className="text-[11px] text-zinc-400">Private Encrypted Storage</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-bold">
            <span>Security Rating</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            100%
          </div>
          <div className="text-[11px] text-zinc-400">Bank-Grade Confidentiality</div>
        </div>
      </div>

      {/* Working Drafts & Active Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Your Active Documents & Sessions
            </h2>
            <p className="text-xs text-zinc-500">
              Click any document to resume visual editing in Canvas Studio
            </p>
          </div>

          <Link
            href="/edit?new=true"
            className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Document</span>
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              No saved document drafts yet
            </div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Open a PDF file in Canvas Studio to start annotating, drawing, e-signing, and form auto-filling.
            </p>
            <Link
              href="/edit?new=true"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs"
            >
              <span>Open Canvas Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((sess) => (
              <Link
                key={sess.id}
                href={`/edit?session=${sess.id}`}
                className="group p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/50 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-500 transition-colors">
                        {sess.filename}
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        {sess.pageCount} Pages • {(sess.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(sess.lastModified).toLocaleDateString()}</span>
                  </span>
                  <span className="font-bold text-rose-500 group-hover:translate-x-0.5 transition-transform">
                    Resume →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
