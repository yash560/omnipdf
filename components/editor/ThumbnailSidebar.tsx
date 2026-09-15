'use client';

import { PageThumbnail } from '@/types/pdf';
import { RotateCw, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ThumbnailSidebarProps {
  thumbnails: PageThumbnail[];
  currentPage: number; // 1-indexed
  onSelectPage: (pageNumber: number) => void;
  onRotatePage: (pageNumber: number) => void;
  onDeletePage: (pageNumber: number) => void;
}

export function ThumbnailSidebar({
  thumbnails,
  currentPage,
  onSelectPage,
  onRotatePage,
  onDeletePage,
}: ThumbnailSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 flex flex-col items-center">
        <button
          onClick={() => setCollapsed(false)}
          title="Expand Pages Sidebar"
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Pages ({thumbnails.length})
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          title="Collapse Sidebar"
          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnails Scroll List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {thumbnails.map((t) => {
          const isActive = currentPage === t.pageNumber;
          return (
            <div
              key={t.pageNumber}
              onClick={() => onSelectPage(t.pageNumber)}
              className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-500/20 shadow-md'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-400'
              }`}
            >
              {/* Top Page Number & Actions */}
              <div className="w-full flex items-center justify-between mb-1.5 px-1">
                <span className="text-[11px] font-extrabold text-zinc-500 dark:text-zinc-400">
                  Page {t.pageNumber}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotatePage(t.pageNumber);
                    }}
                    title="Rotate Page"
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                  {thumbnails.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(t.pageNumber);
                      }}
                      title="Delete Page"
                      className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Box */}
              <div className="w-full aspect-[3/4] bg-white dark:bg-zinc-950 rounded-lg overflow-hidden border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center relative shadow-xs">
                {t.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.dataUrl}
                    alt={`Page ${t.pageNumber}`}
                    className="w-full h-full object-contain transition-transform duration-200"
                    style={{ transform: `rotate(${t.rotation || 0}deg)` }}
                  />
                ) : (
                  <div className="text-[10px] text-zinc-400">Loading...</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
