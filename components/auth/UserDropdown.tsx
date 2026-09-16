'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  Crown, 
  LogOut, 
  ChevronDown, 
  FolderLock, 
  HardDrive, 
  Sparkles, 
  PenTool, 
  Settings,
  ShieldCheck,
  LifeBuoy,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export function UserDropdown() {
  const { user, logout, isPro } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const storageUsedMb = (user.usage.storageBytes / (1024 * 1024)).toFixed(1);
  const maxStorageMb = (user.usage.maxStorageBytes / (1024 * 1024)).toFixed(0);
  const storagePercent = Math.min(
    100,
    Math.round((user.usage.storageBytes / Math.max(1, user.usage.maxStorageBytes)) * 100)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
      >
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col text-left pr-1">
          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 leading-tight">
            <span className="truncate max-w-[90px]">{user.name.split(' ')[0]}</span>
            {isPro && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
          </div>
          <span className="text-[10px] text-zinc-400 capitalize">{user.plan} Tier</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                <span className="truncate">{user.name}</span>
                {isPro && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[9px] font-mono font-bold uppercase">
                    PRO
                  </span>
                )}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
            </div>
          </Link>

          {/* Storage Quota Progress */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-zinc-400" />
                <span>Cloud Storage</span>
              </span>
              <span>{storageUsedMb} MB / {maxStorageMb} MB</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                style={{ width: `${Math.max(4, storagePercent)}%` }}
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1 text-xs">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 font-semibold transition-colors"
            >
              <User className="w-4 h-4 text-rose-500" />
              <span>My Profile & Usage</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 font-semibold transition-colors"
            >
              <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Settings & Controls</span>
            </Link>

            <Link
              href="/drive"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 font-semibold transition-colors"
            >
              <HardDrive className="w-4 h-4 text-blue-500" />
              <span>FileCraft Cloud Drive</span>
            </Link>

            <Link
              href="/support"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 font-semibold transition-colors"
            >
              <LifeBuoy className="w-4 h-4 text-purple-500" />
              <span>Help & Support Center</span>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
