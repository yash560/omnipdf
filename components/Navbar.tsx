'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  FileText, 
  ChevronDown, 
  Search, 
  ShieldCheck, 
  Layers, 
  Image as ImageIcon, 
  Minimize2, 
  FileEdit, 
  PenTool, 
  Lock, 
  Sparkles,
  Table,
  Video,
  Bot
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserDropdown } from './auth/UserDropdown';
import { useAuth } from '@/lib/auth/auth-context';
import { ALL_TOOLS } from '@/lib/tools-data';

export function Navbar() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const { isAuthenticated, openAuthModal } = useAuth();

  const quickSuites = [
    { name: 'PDF Studio', slug: 'edit', icon: FileEdit },
    { name: 'Image Studio', slug: 'image-converter', icon: ImageIcon },
    { name: 'Spreadsheets', slug: 'csv-json-excel', icon: Table },
    { name: 'AI Chat', slug: 'chat-file', icon: Bot },
    { name: 'Secure Share', slug: 'burn-share', icon: Lock },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Mega Menu */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-200">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                File<span className="text-rose-500">Craft</span>
              </span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 -mt-1 hidden sm:inline">
                Universal File OS
              </span>
            </div>
          </Link>

          {/* Tools Dropdown Navigation */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              onBlur={() => setTimeout(() => setToolsOpen(false), 200)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
            >
              <span>50 Tools Catalog</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Mega Dropdown */}
            {toolsOpen && (
              <div className="absolute left-0 top-full mt-2 w-[540px] p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-150 z-50">
                {ALL_TOOLS.slice(0, 10).map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/${tool.slug}`}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: tool.color }}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 transition-colors">
                        {tool.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {tool.description}
                      </div>
                    </div>
                  </Link>
                ))}
                <div className="col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-zinc-500">50 Powerhouse Tools Across 6 Suites</span>
                  <Link href="/" className="font-semibold text-rose-500 hover:underline">
                    View Complete Catalog →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick links */}
          <nav className="hidden lg:flex items-center gap-1">
            {quickSuites.map((tool) => (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className="px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg transition-colors"
              >
                {tool.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Quick Search, Privacy Badge, Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Privacy Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% Client-Side Private</span>
          </div>

          {/* Search trigger button */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-command-menu'));
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 transition-all cursor-pointer shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quick Find...</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Auth or Dropdown */}
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
            >
              <span>Sign In</span>
            </button>
          )}

          {/* Studio CTA Button */}
          <Link
            href="/edit"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>PDF Studio</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
