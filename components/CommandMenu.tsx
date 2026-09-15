'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, ArrowRight, X } from 'lucide-react';
import { PDF_TOOLS } from '@/lib/tools-data';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-menu', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-menu', handleCustomOpen);
    };
  }, []);

  const filteredTools = PDF_TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description.toLowerCase().includes(query.toLowerCase()) ||
      tool.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (slug: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/${slug}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search PDF tools (e.g. merge, compress, sign, ocr, split)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleSelect(tool.slug)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: tool.color }}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {tool.name}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              No matching PDF tools found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Navigate with mouse or Enter</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
