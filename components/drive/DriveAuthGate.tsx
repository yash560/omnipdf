'use client';

import React from 'react';
import { HardDrive, Cloud, Lock, ShieldCheck, Sparkles, FolderLock, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export function DriveAuthGate() {
  const { openAuthModal } = useAuth();

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-radial from-rose-500/5 via-zinc-50 dark:via-zinc-950 to-zinc-100 dark:to-black">
      <div className="max-w-xl w-full text-center space-y-8 p-8 sm:p-12 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl backdrop-blur-xl">
        {/* Glowing Cloud Drive Icon */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-rose-500/30 to-blue-500/30 blur-xl animate-pulse" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Cloud className="w-10 h-10 stroke-[2]" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-xs font-bold text-blue-600 dark:text-blue-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Cloud Workspace</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Your Personal Cloud Drive
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Sign in to access your synchronized cloud files, nested folders, full ZIP downloads, and AI file assistants across all your devices.
          </p>
        </div>

        {/* Cloud Features Pills */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <Cloud className="w-4 h-4 text-blue-500" />
              <span>Multi-Device Cloud</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Files sync automatically to your account in real-time.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% Encrypted</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Zero unauthorized access with private token vaults.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => openAuthModal('login')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <span>Sign In to Cloud Drive</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={() => openAuthModal('register')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition-all cursor-pointer"
          >
            <span>Create Free Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
