'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  FileText, 
  ChevronDown, 
  Search, 
  Image as ImageIcon, 
  FileEdit, 
  Sparkles,
  Table,
  HardDrive,
  Menu,
  X,
  Bot,
  LifeBuoy
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserDropdown } from './auth/UserDropdown';
import { useAuth } from '@/lib/auth/auth-context';
import { useAI } from '@/lib/ai/ai-context';
import { ALL_TOOLS } from '@/lib/tools-data';

export function Navbar() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isAuthenticated, openAuthModal } = useAuth();
  const { openDrawer } = useAI();

  const primarySuites = [
    { name: 'Drive', slug: 'drive', icon: HardDrive, highlight: true },
    { name: 'PDF Studio', slug: 'edit', icon: FileEdit },
    { name: 'Image Studio', slug: 'image-converter', icon: ImageIcon },
    { name: 'Spreadsheets', slug: 'csv-json-excel', icon: Table },
    { name: 'AI Studio', slug: 'chat-file', icon: Bot },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Left: Brand Logo & Catalog Dropdown */}
          <div className="flex items-center gap-2 sm:gap-5 min-w-0 shrink-0">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col shrink-0">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                  File<span className="text-rose-500">Craft</span>
                </span>
                <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 -mt-1 hidden sm:inline tracking-wider uppercase">
                  Universal File OS
                </span>
              </div>
            </Link>

            {/* Tools Mega Menu Dropdown */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setToolsOpen(!toolsOpen)}
                onBlur={() => setTimeout(() => setToolsOpen(false), 200)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              >
                <span>50 Tools Catalog</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Dropdown */}
              {toolsOpen && (
                <div className="absolute left-0 top-full mt-2 w-[520px] p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-150 z-50">
                  {ALL_TOOLS.slice(0, 10).map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/${tool.slug}`}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors group"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: tool.color }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 transition-colors truncate">
                          {tool.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {tool.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs">
                    <span className="text-[11px] text-zinc-400">50 Powerhouse Client-Side Tools</span>
                    <Link href="/" className="font-bold text-rose-500 hover:underline text-xs">
                      View All 50 Tools →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suites Links */}
            <nav className="hidden md:flex items-center gap-1">
              {primarySuites.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.slug}
                    href={`/${tool.slug}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      tool.highlight
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold'
                        : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tool.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/support"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-purple-500" />
                <span>Support</span>
              </Link>
            </nav>
          </div>

          {/* Right: Quick Search, Theme Toggle, Auth, Mobile Menu */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* AI Copilot Button */}
            <button
              type="button"
              onClick={openDrawer}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 hover:from-rose-500/20 hover:to-indigo-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold text-xs transition-all cursor-pointer shadow-2xs shrink-0"
              title="Open FileCraft AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-command-menu'));
              }}
              className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Search tools & files (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Find</span>
              <kbd className="hidden sm:inline px-1 py-0.2 text-[9px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
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
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shrink-0"
              >
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-150">
          <div className="fixed top-14 left-0 right-0 max-h-[85vh] bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 shadow-2xl overflow-y-auto space-y-4 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                FileCraft Studios & Workspace
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Featured AI Copilot Card */}
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                openDrawer();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-500/30 font-bold text-xs text-purple-700 dark:text-purple-300 shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">FileCraft AI Copilot</div>
                  <div className="text-[10px] text-zinc-500 font-normal">Chat with files, summaries, tables & OCR</div>
                </div>
              </div>
              <span className="text-3xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                Open
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {primarySuites.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.slug}
                    href={`/${tool.slug}`}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 font-bold text-xs text-zinc-900 dark:text-zinc-100 hover:border-rose-500 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-rose-500" />
                    <span>{tool.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/support"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 font-bold text-xs text-zinc-900 dark:text-zinc-100 hover:border-rose-500 transition-colors"
              >
                <LifeBuoy className="w-4 h-4 text-purple-500" />
                <span>Support</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 block px-1">
                Popular Tools
              </span>
              <div className="grid grid-cols-2 gap-2">
                {ALL_TOOLS.slice(0, 8).map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/${tool.slug}`}
                    onClick={() => setMobileNavOpen(false)}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate hover:text-rose-500"
                  >
                    {tool.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end text-xs text-zinc-500">
              <Link
                href="/"
                onClick={() => setMobileNavOpen(false)}
                className="font-bold text-rose-500 hover:underline"
              >
                All 50 Tools →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
