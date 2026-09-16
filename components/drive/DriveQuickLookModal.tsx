'use client';

import React, { useState, useEffect } from 'react';
import { DriveItem } from '@/lib/drive/drive-types';
import { getCloudFileBlob } from '@/lib/drive/cloud-api';
import { getFileBlob } from '@/lib/drive/drive-db';
import { formatBytes, getFileCraftToolsForItem } from '@/lib/drive/drive-helpers';
import { useAI } from '@/lib/ai/ai-context';
import { useDrive } from '@/lib/drive/drive-context';
import { DriveArchiveViewer } from './DriveArchiveViewer';
import { DriveSpreadsheetViewer } from './DriveSpreadsheetViewer';
import { DriveCodeViewer } from './DriveCodeViewer';
import { DriveMediaPlayer } from './DriveMediaPlayer';
import { 
  X, 
  Download, 
  Sparkles, 
  ExternalLink, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Share2,
  Wrench,
  Crop
} from 'lucide-react';
import Link from 'next/link';
import { DriveRelatedItems } from './DriveRelatedItems';

interface DriveQuickLookModalProps {
  item: DriveItem | null;
  onClose: () => void;
  onOpenShare?: (item: DriveItem) => void;
}

export function DriveQuickLookModal({ item, onClose, onOpenShare }: DriveQuickLookModalProps) {
  const { openDrawer, setActiveFile } = useAI();
  const { openQuickTools } = useDrive();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [showRelated, setShowRelated] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let isMounted = true;

    async function loadContent() {
      if (!item || item.type === 'folder') return;
      setLoading(true);
      setTextContent(null);
      setBlob(null);

      try {
        const fetchedBlob = (await getCloudFileBlob(item.id)) || (await getFileBlob(item.id));
        if (!fetchedBlob) return;

        if (isMounted) setBlob(fetchedBlob);
        url = URL.createObjectURL(fetchedBlob);
        if (isMounted) setBlobUrl(url);

        // If code or text, parse text content
        if (
          item.category === 'code' || 
          item.category === 'document' || 
          item.mimeType.startsWith('text/') ||
          ['json', 'yaml', 'yml', 'md', 'ts', 'tsx', 'js', 'jsx', 'py', 'sql', 'css', 'html', 'rs', 'go', 'sh', 'txt'].includes(item.extension)
        ) {
          const text = await fetchedBlob.text();
          if (isMounted) setTextContent(text);
        }
      } catch (err) {
        console.error('Failed to load QuickLook content:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadContent();

    return () => {
      isMounted = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const tools = getFileCraftToolsForItem(item);

  const handleLaunchAI = () => {
    setActiveFile({
      name: item.name,
      size: item.size,
      textContent: textContent || undefined,
      previewUrl: blobUrl || undefined,
    });
    openDrawer();
  };

  const isZipArchive = ['zip', 'jar', 'tar', 'gz', 'rar'].includes(item.extension) || item.category === 'archive';
  const isSpreadsheet = ['xlsx', 'xls', 'csv', 'tsv'].includes(item.extension) || item.category === 'spreadsheet';
  const isCodeOrText = textContent !== null || item.category === 'code';

  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY !== null) {
      const delta = e.touches[0].clientY - dragStartY;
      if (delta > 0) {
        setDragCurrentY(delta);
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragCurrentY && dragCurrentY > 100) {
      onClose();
    }
    setDragStartY(null);
    setDragCurrentY(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragCurrentY ? `translateY(${dragCurrentY}px)` : undefined,
          transition: dragCurrentY ? 'none' : 'transform 200ms ease-out',
        }}
        className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-150"
      >
        {/* Mobile Swipe-Down Handle */}
        <div className="sm:hidden w-full pt-2.5 pb-1 flex justify-center bg-zinc-50 dark:bg-zinc-950/80 cursor-grab">
          <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {/* Header Bar */}
        <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                {item.name}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {formatBytes(item.size)} • {item.category.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Ask AI */}
            <button
              type="button"
              onClick={handleLaunchAI}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Copilot</span>
            </button>

            {/* Related Files */}
            <button
              type="button"
              onClick={() => setShowRelated(!showRelated)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showRelated
                  ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${showRelated ? 'text-white' : 'text-amber-500'}`} />
              <span>Related</span>
            </button>

            {/* In-Place Quick Tools Launcher */}
            <button
              type="button"
              onClick={() => {
                onClose();
                openQuickTools(item);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>
                {item.category === 'image'
                  ? 'Crop & Edit'
                  : item.category === 'pdf'
                  ? 'Rotate & Split'
                  : item.category === 'spreadsheet'
                  ? 'Clean & Convert'
                  : item.category === 'code' || item.category === 'document'
                  ? 'Edit Text'
                  : item.category === 'media'
                  ? 'Trim Media'
                  : item.category === 'archive'
                  ? 'Extract'
                  : 'Quick Tools'}
              </span>
            </button>

            {/* Share */}
            {onOpenShare && (
              <button
                type="button"
                onClick={() => onOpenShare(item)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Share</span>
              </button>
            )}

            {/* Direct Tool Launch */}
            {tools.length > 0 && (
              <Link
                href={tools[0].href}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-extrabold shadow-xs transition-all"
              >
                <span>{tools[0].label}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Download */}
            {blobUrl && (
              <a
                href={blobUrl}
                download={item.name}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                title="Download File"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Canvas Area with Optional Related Sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 overflow-hidden flex items-center justify-center relative">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400 text-xs">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold">Streaming Cloud File Preview...</span>
              </div>
            ) : isZipArchive && blob ? (

            // 1. In-browser ZIP / Archive Explorer
            <div className="w-full h-full">
              <DriveArchiveViewer blob={blob} />
            </div>
          ) : isSpreadsheet && blob ? (
            // 2. Interactive Spreadsheet Grid
            <div className="w-full h-full">
              <DriveSpreadsheetViewer blob={blob} fileName={item.name} />
            </div>
          ) : item.category === 'media' && blobUrl ? (
            // 3. 4K / HD Video or Audio Player with speed controls & range seeking
            <div className="w-full h-full">
              <DriveMediaPlayer
                src={blobUrl}
                type={item.mimeType.startsWith('video/') ? 'video' : 'audio'}
                name={item.name}
              />
            </div>
          ) : isCodeOrText && textContent !== null ? (
            // 4. Code / Text / Markdown Syntax Viewer
            <div className="w-full h-full">
              <DriveCodeViewer code={textContent} language={item.extension || 'plaintext'} />
            </div>
          ) : item.category === 'image' && blobUrl ? (
            // 5. Image Preview with zoom & rotation
            <div className="w-full h-full flex flex-col items-center justify-center p-4 relative overflow-auto">
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 text-white">
                <button
                  onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
                  className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono px-1 font-bold">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(3.0, z + 0.2))}
                  className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onClose();
                    openQuickTools(item, 'crop');
                  }}
                  className="p-1.5 hover:bg-rose-500/80 rounded-xl transition-colors text-rose-400 hover:text-white flex items-center gap-1 font-bold text-xs"
                  title="Crop & Edit Image"
                >
                  <Crop className="w-4 h-4" />
                  <span>Crop</span>
                </button>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobUrl}
                alt={item.name}
                className="max-h-[70vh] object-contain rounded-2xl shadow-2xl transition-transform duration-150"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              />
            </div>
          ) : item.category === 'pdf' && blobUrl ? (
            // 6. PDF Interactive Canvas Frame
            <iframe
              src={blobUrl}
              title={item.name}
              className="w-full h-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white"
            />
          ) : (
            // 7. Binary Fallback
            <div className="text-center p-8 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-zinc-200 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center shadow-inner">
                <FileText className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200">
                  Binary File Preview
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Download this file or launch it directly inside the specialized FileCraft studio tools.
                </p>
              </div>
              {blobUrl && (
                <a
                  href={blobUrl}
                  download={item.name}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {item.name}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Optional Collapsible Related Items Drawer */}
        {showRelated && (
          <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 overflow-y-auto shrink-0 animate-in slide-in-from-right-4 duration-150">
            <DriveRelatedItems item={item} />
          </div>
        )}
      </div>

        {/* Footer Toolbar: Quick Launch Options */}
        {tools.length > 0 && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap pl-2 mr-1">
              Open In Tool:
            </span>
            {tools.map((t, idx) => (
              <Link
                key={idx}
                href={t.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs whitespace-nowrap transition-all"
              >
                <span>{t.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

