'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  FileText, 
  ArrowRight, 
  X, 
  Folder, 
  FolderOpen, 
  Sparkles, 
  Lock, 
  Unlock, 
  Clock, 
  Copy, 
  Download, 
  Eye, 
  Bot, 
  FileEdit, 
  UploadCloud, 
  FileSpreadsheet, 
  FileCode, 
  FileArchive, 
  Video, 
  Music, 
  Image as ImageIcon, 
  ShieldCheck, 
  CornerDownLeft,
  ChevronRight,
  Filter,
  Check,
  User,
  Settings,
  LifeBuoy
} from 'lucide-react';
import { ALL_TOOLS } from '@/lib/tools-data';
import { useAuth } from '@/lib/auth/auth-context';
import { DriveItem, DriveCategory } from '@/lib/drive/drive-types';
import { formatBytes, formatTimeAgo } from '@/lib/drive/drive-helpers';
import { DriveQuickLookModal } from './drive/DriveQuickLookModal';
import { FileCraftLogo } from '@/components/brand/FileCraftLogo';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type SearchTabType = 'all' | 'files' | 'folders' | 'tools' | 'ocr' | 'actions' | 'vault';

interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  badge?: string;
  action: () => void;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  useBodyScrollLock(open);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTabType>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [driveResults, setDriveResults] = useState<DriveItem[]>([]);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);

  const { isAuthenticated, user, openAuthModal } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Check vault unlock status from session storage
  const isVaultUnlocked = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const unlockUntil = sessionStorage.getItem('filecraft_vault_unlocked_until');
    return Boolean(unlockUntil && parseInt(unlockUntil, 10) > Date.now());
  }, [open]);

  // Handle keyboard shortcuts (Cmd+K, Esc, Open event)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (previewItem) {
          setPreviewItem(null);
        } else {
          setOpen(false);
        }
      }
    };

    const handleCustomOpen = (e?: any) => {
      setOpen(true);
      if (e?.detail?.query) {
        setQuery(e.detail.query);
      }
      if (e?.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-menu', handleCustomOpen as EventListener);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-menu', handleCustomOpen as EventListener);
    };
  }, [previewItem]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setDriveResults([]);
      setPreviewItem(null);
    }
  }, [open]);

  // Debounced Cloud Drive search
  useEffect(() => {
    if (!open) return;

    if (!isAuthenticated || !query.trim()) {
      setDriveResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('omnipdf_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams();
        params.set('q', query.trim());
        params.set('limit', '25');
        if (isVaultUnlocked) params.set('isVaultUnlocked', 'true');

        if (activeTab === 'folders') params.set('type', 'folders');
        else if (activeTab === 'files') params.set('type', 'files');
        else if (activeTab === 'ocr') params.set('type', 'ocr');
        else if (activeTab === 'vault') params.set('type', 'vault');

        const res = await fetch(`/api/drive/search?${params.toString()}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setDriveResults(data.items || []);
        }
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, open, isAuthenticated, activeTab, isVaultUnlocked]);

  // Quick Action items
  const quickActions: QuickActionItem[] = useMemo(() => {
    const actions: QuickActionItem[] = [
      {
        id: 'action-drive',
        title: 'Open FileCraft Cloud Drive',
        subtitle: 'Browse all 293+ personal & family documents, scans, and folders',
        icon: FolderOpen,
        iconColor: '#3b82f6',
        badge: 'Cloud OS',
        action: () => {
          setOpen(false);
          router.push('/drive');
        },
      },
      {
        id: 'action-ai-chat',
        title: 'Chat with Documents (Universal AI)',
        subtitle: 'Ask multi-document questions across PDFs, policies, and contracts',
        icon: Bot,
        iconColor: '#a855f7',
        badge: 'Gemini 2.5',
        action: () => {
          setOpen(false);
          router.push('/chat-file');
        },
      },
      {
        id: 'action-expiry-radar',
        title: 'Document Expiry & Renewal Radar',
        subtitle: 'Review 31 tracked policy cycles, PUCs, tax dates, and passports',
        icon: Clock,
        iconColor: '#f59e0b',
        badge: 'Renewal Radar',
        action: () => {
          setOpen(false);
          router.push('/drive?tab=expiry');
        },
      },
      {
        id: 'action-vault',
        title: isVaultUnlocked ? 'Lock Secure Personal Vault' : 'Unlock PIN Secure Personal Vault',
        subtitle: isVaultUnlocked ? 'Veil 54 sensitive cards, IDs, and passbooks' : 'Enter 4-digit PIN to unveil 54 protected documents',
        icon: isVaultUnlocked ? Unlock : Lock,
        iconColor: '#ef4444',
        badge: isVaultUnlocked ? 'Unlocked' : 'PIN Vault',
        action: () => {
          setOpen(false);
          router.push('/drive?tab=vault');
        },
      },
      {
        id: 'action-clean-dups',
        title: 'Scan & Clean Duplicate Documents',
        subtitle: 'Find identical scan copies and free up cloud storage',
        icon: Copy,
        iconColor: '#10b981',
        badge: 'Storage Saver',
        action: () => {
          setOpen(false);
          router.push('/drive?tab=duplicates');
        },
      },
      {
        id: 'action-pdf-studio',
        title: 'Launch PDF Studio Editor',
        subtitle: 'Sign, redact, annotate, fill forms, and export vector PDFs',
        icon: FileEdit,
        iconColor: '#ec4899',
        badge: 'Studio',
        action: () => {
          setOpen(false);
          router.push('/edit');
        },
      },
      {
        id: 'action-profile',
        title: 'My Profile & Storage Usage',
        subtitle: 'View user identity, active plan perks, and cloud storage meters',
        icon: User,
        iconColor: '#f43f5e',
        badge: 'Account',
        action: () => {
          setOpen(false);
          router.push('/profile');
        },
      },
      {
        id: 'action-settings',
        title: 'Settings & Workspace Preferences',
        subtitle: 'Configure dark/light theme, Vault PIN rules, AI models, and passwords',
        icon: Settings,
        iconColor: '#64748b',
        badge: 'Preferences',
        action: () => {
          setOpen(false);
          router.push('/settings');
        },
      },
      {
        id: 'action-support',
        title: 'Help, Support & Founder Desk',
        subtitle: 'WhatsApp live chat, ticket submission, and searchable FAQs',
        icon: LifeBuoy,
        iconColor: '#8b5cf6',
        badge: 'Support',
        action: () => {
          setOpen(false);
          router.push('/support');
        },
      },
    ];

    if (!query.trim()) return actions;

    const q = query.toLowerCase();
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.badge?.toLowerCase().includes(q)
    );
  }, [query, isVaultUnlocked, router]);

  // Filtered Tools
  const filteredTools = useMemo(() => {
    if (activeTab === 'folders' || activeTab === 'vault' || activeTab === 'ocr') return [];
    if (!query.trim()) return ALL_TOOLS.slice(0, 8);

    const q = query.toLowerCase();
    return ALL_TOOLS.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q) ||
        tool.suite?.toLowerCase().includes(q) ||
        (tool.badge && tool.badge.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [query, activeTab]);

  // Drive Folders vs Files
  const driveFolders = useMemo(() => {
    return driveResults.filter((i) => i.type === 'folder');
  }, [driveResults]);

  const driveFiles = useMemo(() => {
    return driveResults.filter((i) => i.type === 'file');
  }, [driveResults]);

  // Unified items list for keyboard navigation
  const flatSelectableItems = useMemo(() => {
    const list: { type: 'action' | 'folder' | 'file' | 'tool'; data: any }[] = [];

    // 1. Actions
    if (activeTab === 'all' || activeTab === 'actions') {
      quickActions.forEach((a) => list.push({ type: 'action', data: a }));
    }

    // 2. Folders
    if (activeTab === 'all' || activeTab === 'folders') {
      driveFolders.forEach((f) => list.push({ type: 'folder', data: f }));
    }

    // 3. Files
    if (activeTab === 'all' || activeTab === 'files' || activeTab === 'ocr' || activeTab === 'vault') {
      driveFiles.forEach((f) => list.push({ type: 'file', data: f }));
    }

    // 4. Tools
    if (activeTab === 'all' || activeTab === 'tools') {
      filteredTools.forEach((t) => list.push({ type: 'tool', data: t }));
    }

    return list;
  }, [activeTab, quickActions, driveFolders, driveFiles, filteredTools]);

  // Arrow key & Enter execution handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < flatSelectableItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatSelectableItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatSelectableItems[activeIndex];
      if (current) {
        handleExecute(current);
      }
    } else if (e.key === ' ' && e.target === inputRef.current && query.trim() === '') {
      // Space on highlighted file
      const current = flatSelectableItems[activeIndex];
      if (current && current.type === 'file') {
        e.preventDefault();
        setPreviewItem(current.data);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const tabs: SearchTabType[] = ['all', 'files', 'folders', 'tools', 'ocr', 'actions', 'vault'];
      const currentIndex = tabs.indexOf(activeTab);
      const nextTab = e.shiftKey
        ? tabs[(currentIndex - 1 + tabs.length) % tabs.length]
        : tabs[(currentIndex + 1) % tabs.length];
      setActiveTab(nextTab);
      setActiveIndex(0);
    }
  };

  const handleExecute = (item: { type: string; data: any }) => {
    setOpen(false);
    if (item.type === 'action') {
      item.data.action();
    } else if (item.type === 'tool') {
      router.push(`/${item.data.slug}`);
    } else if (item.type === 'folder') {
      router.push(`/drive/folder/${item.data.id}`);
    } else if (item.type === 'file') {
      router.push(
        item.data.parentId
          ? `/drive/folder/${item.data.parentId}?preview=${item.data.id}`
          : `/drive?preview=${item.data.id}`
      );
    }
  };

  // Helper for file type icons
  const getFileCategoryIcon = (category: DriveCategory = 'other', name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (category === 'pdf' || ext === 'pdf') return { icon: FileText, color: 'text-rose-500', bg: 'bg-rose-500/10' };
    if (category === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) return { icon: ImageIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (category === 'spreadsheet' || ['xlsx', 'xls', 'csv'].includes(ext)) return { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-500/10' };
    if (category === 'media' || ['mp4', 'webm', 'mov'].includes(ext)) return { icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10' };
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return { icon: Music, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (category === 'archive' || ['zip', 'tar', 'gz', 'rar'].includes(ext)) return { icon: FileArchive, color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (category === 'code' || ['json', 'ts', 'js', 'html', 'css'].includes(ext)) return { icon: FileCode, color: 'text-cyan-500', bg: 'bg-cyan-500/10' };
    return { icon: FileText, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
  };

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-16 p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-modal-backdrop overflow-hidden"
        onClick={() => setOpen(false)}
      >
        <div
          className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2.5 text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
              <FileCraftLogo size="xs" variant="icon" animated={false} />
              <span>Global Omnisearch</span>
              <span className="text-zinc-400 font-normal">|</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">All Types &amp; Scans</span>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{user?.email || 'Cloud Synced'}</span>
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold transition-colors"
                >
                  Sign In for Cloud Drive
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Search className="w-5 h-5 text-rose-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search all files, scanned text, folders, categories, tags, or 50+ tools..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              className="w-full bg-transparent text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none font-medium"
            />
            {isSearching ? (
              <span className="w-4 h-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" />
            ) : query ? (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
              >
                Clear
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-700">
                ESC
              </kbd>
            )}
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: '🌐 All Types' },
              { id: 'files', label: `📄 Files (${driveFiles.length})` },
              { id: 'folders', label: `📂 Folders (${driveFolders.length})` },
              { id: 'tools', label: `🛠️ Tools (${filteredTools.length})` },
              { id: 'ocr', label: '🔍 Scanned Text' },
              { id: 'actions', label: '⚡ Actions' },
              { id: 'vault', label: isVaultUnlocked ? '🔓 Vault (Active)' : '🔒 Vault (Locked)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as SearchTabType);
                  setActiveIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Results Body */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-4">
            {/* 1. Quick Action Results */}
            {(activeTab === 'all' || activeTab === 'actions') && quickActions.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>⚡ Quick Actions & Life Ops</span>
                  <span className="text-3xs lowercase font-mono">press enter to launch</span>
                </div>
                {quickActions.map((action) => {
                  const itemIndex = flatSelectableItems.findIndex(
                    (it) => it.type === 'action' && it.data.id === action.id
                  );
                  const isSelected = itemIndex === activeIndex;
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.id}
                      onClick={() => handleExecute({ type: 'action', data: action })}
                      onMouseEnter={() => setActiveIndex(itemIndex)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer group ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-xs'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                          style={{ backgroundColor: action.iconColor }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {action.title}
                            </span>
                            {action.badge && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                {action.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {action.subtitle}
                          </p>
                        </div>
                      </div>
                      <CornerDownLeft className={`w-3.5 h-3.5 text-rose-500 shrink-0 ml-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. Folders Results */}
            {(activeTab === 'all' || activeTab === 'folders') && driveFolders.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-500 dark:text-blue-400 flex items-center justify-between">
                  <span>📂 Cloud Folders ({driveFolders.length})</span>
                  <span className="text-3xs lowercase font-mono">click to jump inside</span>
                </div>
                {driveFolders.map((folder) => {
                  const itemIndex = flatSelectableItems.findIndex(
                    (it) => it.type === 'folder' && it.data.id === folder.id
                  );
                  const isSelected = itemIndex === activeIndex;

                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleExecute({ type: 'folder', data: folder })}
                      onMouseEnter={() => setActiveIndex(itemIndex)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-xs'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Folder className="w-4 h-4 fill-blue-500/30" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {folder.name}
                            </span>
                            <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                              Folder
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono truncate">
                            {folder.relativePath || `/${folder.name}`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Files & OCR Results */}
            {(activeTab === 'all' || activeTab === 'files' || activeTab === 'ocr' || activeTab === 'vault') && driveFiles.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400 flex items-center justify-between">
                  <span>📄 Cloud Documents & Scans ({driveFiles.length})</span>
                  <span className="text-3xs lowercase font-mono">space for quick look</span>
                </div>
                {driveFiles.map((file) => {
                  const itemIndex = flatSelectableItems.findIndex(
                    (it) => it.type === 'file' && it.data.id === file.id
                  );
                  const isSelected = itemIndex === activeIndex;
                  const catCfg = getFileCategoryIcon(file.category, file.name);
                  const Icon = catCfg.icon;

                  return (
                    <div
                      key={file.id}
                      onClick={() => handleExecute({ type: 'file', data: file })}
                      onMouseEnter={() => setActiveIndex(itemIndex)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer group ${
                        isSelected
                          ? 'bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-xs'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-xl ${catCfg.bg} flex items-center justify-center ${catCfg.color} shrink-0 shadow-xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {file.name}
                            </span>
                            {file.isVault && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                <Lock className="w-2.5 h-2.5" /> Vault
                              </span>
                            )}
                            {file.expiryStatus === 'expired' && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                                Expired
                              </span>
                            )}
                            {file.expiryStatus === 'expiring_soon' && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                Expiring Soon
                              </span>
                            )}
                          </div>

                          {/* Path & Metadata */}
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <span className="truncate">{file.relativePath || file.name}</span>
                          </div>

                          {/* Highlighted Match Snippet */}
                          {file.ocrSnippet && (
                            <div className="mt-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-sans flex items-center gap-1.5 max-w-lg">
                              <Search className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate">Excerpt: &ldquo;{file.ocrSnippet}&rdquo;</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Action buttons */}
                      <div className="flex items-center gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Quick Look (Space)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(file);
                          }}
                          className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Chat with AI"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            router.push(`/chat-file?fileId=${file.id}`);
                          }}
                          className="p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. Powerhouse Tools */}
            {(activeTab === 'all' || activeTab === 'tools') && filteredTools.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>🛠️ FileCraft Specialized Tools ({filteredTools.length})</span>
                  <span className="text-3xs lowercase font-mono">100% in-browser</span>
                </div>
                {filteredTools.map((tool) => {
                  const itemIndex = flatSelectableItems.findIndex(
                    (it) => it.type === 'tool' && it.data.id === tool.id
                  );
                  const isSelected = itemIndex === activeIndex;

                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleExecute({ type: 'tool', data: tool })}
                      onMouseEnter={() => setActiveIndex(itemIndex)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer group ${
                        isSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 shadow-xs'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: tool.color }}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {tool.name}
                            </span>
                            <span className="px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {tool.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty States & Suggested Queries */}
            {!query.trim() && (
              <div className="pt-2 px-2 space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                  💡 Popular Quick Search Queries
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Amaze RC & Insurance',
                    'Yash Salary Slips',
                    'Dad Aadhaar Card',
                    'Property Tax 202 Ishan Park',
                    'Offer Letters',
                    'Pulsar 150 Policy',
                    'Shreya Passport',
                    'Compress PDF',
                    'Background Remover',
                    'Split PDF',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Fallback */}
            {query.trim() && flatSelectableItems.length === 0 && !isSearching && (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  No matches found for &ldquo;{query}&rdquo;
                </div>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Try searching by person name, vehicle model, insurance number, or switch tabs above.
                </p>
              </div>
            )}
          </div>

          {/* Footer Shortcuts Guide */}
          <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded font-mono text-[10px]">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded font-mono text-[10px]">↵</kbd>
                <span>Open</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded font-mono text-[10px]">Space</kbd>
                <span>Quick Look</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded font-mono text-[10px]">Tab</kbd>
                <span>Change Tab</span>
              </span>
            </div>
            <span className="font-mono text-3xs text-zinc-500">
              {flatSelectableItems.length} total results
            </span>
          </div>
        </div>
      </div>

      {/* Instant Quick Look Modal Overlay */}
      {previewItem && (
        <DriveQuickLookModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </>
  );
}
