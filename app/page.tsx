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
  ChevronDown
} from 'lucide-react';
import { PDF_TOOLS } from '@/lib/tools-data';
import { ToolCard } from '@/components/ToolCard';
import { ToolCategory } from '@/types/pdf';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const categories: { id: ToolCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All Tools', count: PDF_TOOLS.length },
    { id: 'organize', label: 'Organize', count: PDF_TOOLS.filter((t) => t.category === 'organize').length },
    { id: 'optimize', label: 'Optimize', count: PDF_TOOLS.filter((t) => t.category === 'optimize').length },
    { id: 'edit', label: 'Edit & Studio', count: PDF_TOOLS.filter((t) => t.category === 'edit').length },
    { id: 'security', label: 'Security & Sign', count: PDF_TOOLS.filter((t) => t.category === 'security').length },
    { id: 'convert', label: 'Convert', count: PDF_TOOLS.filter((t) => t.category === 'convert').length },
    { id: 'smart', label: 'Smart AI & OCR', count: PDF_TOOLS.filter((t) => t.category === 'smart').length },
  ];

  const filteredTools = PDF_TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const faqs = [
    {
      q: 'Is OmniPDF completely private and secure?',
      a: 'Yes! OmniPDF runs 100% client-side in your browser using modern WebAssembly and local JavaScript engines. Your PDF files, images, signatures, and data are NEVER uploaded to any remote server or cloud database.',
    },
    {
      q: 'Are there any file size limits or daily quotas?',
      a: 'No! Because all processing happens directly on your device hardware, there are no artificial 25MB file caps or daily credit restrictions. You can merge, split, and edit as many gigabytes as your device memory allows.',
    },
    {
      q: 'How does the interactive PDF Editor work?',
      a: 'Our Canvas Studio renders PDF vector pages using PDF.js and layers an interactive SVG/HTML canvas overlay on top. When you add text, signatures, shapes, or redactions, our exporter bakes them natively into the PDF stream at razor-sharp vector resolution.',
    },
    {
      q: 'Can I perform OCR on scanned paper documents?',
      a: 'Yes! Our built-in OCR tool runs Tesseract.js inside a dedicated browser Web Worker to extract text and recognize characters from scanned PDF documents with high confidence.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-zinc-50 via-white to-zinc-50/50 dark:from-zinc-950 dark:via-zinc-900/60 dark:to-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80">
        {/* Subtle background ambient gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-blue-500/10 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-extrabold mb-6 shadow-xs animate-in fade-in slide-in-from-top-3 duration-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero-Upload & 100% Client-Side Private PDF Powerhouse</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[1.15] mb-6">
            Every tool you need to work with{' '}
            <span className="bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 bg-clip-text text-transparent">
              PDFs in one place
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Merge, split, compress, edit, e-sign, rotate, watermark, and OCR PDF documents with zero file limits and lightning speed.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative mb-8">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search PDF tools (e.g. merge, split, compress, edit, sign)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-rose-500 dark:focus:border-rose-500 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-lg shadow-zinc-200/50 dark:shadow-black/50 outline-none transition-all"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                <kbd className="hidden sm:inline px-2 py-1 text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md scale-105'
                      : 'bg-white dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                      isSelected
                        ? 'bg-white/20 dark:bg-zinc-900/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Tools Catalog Grid */}
      <section className="py-12 sm:py-16 bg-zinc-50/50 dark:bg-zinc-950/40 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {selectedCategory === 'all'
                  ? 'All PDF Tools'
                  : categories.find((c) => c.id === selectedCategory)?.label}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Showing {filteredTools.length} powerful document utilities
              </p>
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Grid */}
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 p-8">
              <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                No tools found matching &quot;{searchQuery}&quot;
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Try searching for another keyword or browse by category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Studio Promo Banner */}
      <section className="py-12 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-neutral-900 p-8 sm:p-12 text-white overflow-hidden shadow-2xl border border-zinc-800">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Power Tool</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Experience the Full Interactive Canvas PDF Studio
              </h2>

              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                Add text boxes, draw freehand vector ink, place signatures, highlight contracts, insert shapes, and blackout confidential data directly on your live document.
              </p>

              <Link
                href="/edit"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-sm font-extrabold shadow-xl shadow-rose-500/25 hover:shadow-2xl transition-all active:scale-95"
              >
                <span>Launch PDF Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Ambient art backdrop */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-500/10 via-amber-500/10 to-transparent pointer-events-none hidden md:block" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Everything you need to know about OmniPDF&apos;s privacy and capabilities
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-rose-500' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
