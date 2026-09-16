'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Cpu, 
  Lock, 
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Layers,
  Image as ImageIcon,
  Table,
  Video,
  FolderArchive,
  Bot
} from 'lucide-react';
import { ALL_TOOLS } from '@/lib/tools-data';
import { ToolCard } from '@/components/ToolCard';
import { ToolCategory } from '@/types/pdf';

export default function HomePage() {
  const [selectedSuite, setSelectedSuite] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const suites = [
    { id: 'all', label: 'All Tools (50)', icon: Layers, count: ALL_TOOLS.length },
    { id: 'pdf', label: 'PDF Powerhouse', icon: FileText, count: ALL_TOOLS.filter((t) => t.suite === 'pdf' || !t.suite).length },
    { id: 'image', label: 'Image Studio', icon: ImageIcon, count: ALL_TOOLS.filter((t) => t.suite === 'image').length },
    { id: 'data', label: 'Spreadsheets & Data', icon: Table, count: ALL_TOOLS.filter((t) => t.suite === 'data').length },
    { id: 'media', label: 'Audio & Video', icon: Video, count: ALL_TOOLS.filter((t) => t.suite === 'media').length },
    { id: 'archive', label: 'Archives & Split', icon: FolderArchive, count: ALL_TOOLS.filter((t) => t.suite === 'archive').length },
    { id: 'security', label: 'Security & Dev', icon: Lock, count: ALL_TOOLS.filter((t) => t.suite === 'security').length },
    { id: 'ai', label: 'Next-Gen AI', icon: Bot, count: ALL_TOOLS.filter((t) => t.suite === 'ai').length },
  ];

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesSuite = selectedSuite === 'all' || tool.suite === selectedSuite || (selectedSuite === 'pdf' && !tool.suite);
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSuite && matchesSearch;
  });

  const faqs = [
    {
      q: 'Is FileCraft completely private and secure?',
      a: 'Yes! All core file transformations (PDF editing, image conversions, video compression, audio trimming, and data processing) run securely and privately on your device. Your documents never leave your computer.',
    },
    {
      q: 'Are there any file size caps or artificial daily limits?',
      a: 'No! Because processing utilizes high-performance on-device acceleration, you enjoy fast turnaround times with no artificial file size caps or daily credit restrictions.',
    },
    {
      q: 'How does the Burn-After-Reading Confidential Share work?',
      a: 'Your document is encrypted with military-grade privacy directly on your device before transfer. The secret decryption key is embedded in your link and is never stored. Once the recipient downloads the document, the link permanently self-destructs.',
    },
    {
      q: 'How do the AI File Intelligence tools work?',
      a: 'Our platform is powered by FileCraft Enterprise AI with multi-model intelligence and automated resilience. It analyzes complex documents, extracts structured tables into spreadsheets, and transcribes audio meeting notes into actionable summaries in seconds.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-zinc-50 via-white to-zinc-50/50 dark:from-zinc-950 dark:via-zinc-900/60 dark:to-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-rose-500/10 via-cyan-500/10 to-indigo-500/10 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-extrabold mb-6 shadow-xs animate-in fade-in slide-in-from-top-3 duration-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Universal File OS • 50+ Enterprise Tools with 100% On-Device Privacy</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[1.15] mb-6">
            Every tool you need to work with{' '}
            <span className="bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              files in one place
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            PDFs, Images, Spreadsheets, Audio/Video, Encrypted Shares, Archives, and AI Intelligence. 100% private in your browser.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative mb-8">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search all 50 file tools (e.g. merge, compress, bg-remover, csv, audio, zip)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-rose-500 dark:focus:border-rose-500 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-lg shadow-zinc-200/50 dark:shadow-black/50 outline-none transition-all"
              />
              <span className="absolute right-4 text-xs font-semibold text-zinc-400 hidden sm:inline">
                50 Tools
              </span>
            </div>
          </div>

          {/* Suite Switcher Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {suites.map((s) => {
              const Icon = s.icon;
              const isActive = selectedSuite === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSuite(s.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md scale-105'
                      : 'bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {selectedSuite === 'all'
                ? 'All 50 Powerhouse Tools'
                : `${suites.find((s) => s.id === selectedSuite)?.label} Tools`}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Showing {filteredTools.length} tool{filteredTools.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
            <Search className="w-10 h-10 text-zinc-400 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No tools found</h3>
            <p className="text-xs text-zinc-500 mt-1">Try searching for a different keyword or format.</p>
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Everything you need to know about our privacy-first file architecture.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
