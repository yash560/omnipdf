'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutGrid, ArrowLeft, ArrowRight, RotateCw, Trash2, Plus, FileText } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile, PageThumbnail } from '@/types/pdf';
import { renderAllPageThumbnails, downloadBytes } from '@/lib/pdf/core';
import { organizePdf, PageAction } from '@/lib/pdf/organize';

export default function OrganizePage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [pages, setPages] = useState<(PageThumbnail & { originalIndex: number })[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadThumbnails() {
      if (files.length > 0 && files[0].arrayBuffer) {
        setLoadingPages(true);
        try {
          const thumbs = await renderAllPageThumbnails(files[0].arrayBuffer, 100, 0.4);
          if (!isMounted) return;
          setPages(
            thumbs.map((t, idx) => ({
              ...t,
              originalIndex: idx,
              rotation: 0,
            }))
          );
        } catch (err) {
          console.error('Error loading pages:', err);
        }
        setLoadingPages(false);
      } else {
        setPages([]);
      }
    }
    loadThumbnails();
    return () => {
      isMounted = false;
    };
  }, [files]);

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      alert('Cannot delete the last remaining page.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const insertBlankPage = (afterIndex: number) => {
    const newPage = {
      pageNumber: pages.length + 1,
      dataUrl: '',
      rotation: 0,
      originalIndex: -1, // -1 signals blank page
    };
    const updated = [...pages];
    updated.splice(afterIndex + 1, 0, newPage);
    setPages(updated);
  };

  const movePage = (fromIdx: number, toIdx: number) => {
    const updated = [...pages];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setPages(updated);
  };

  const handleSave = async () => {
    if (!files[0]?.arrayBuffer) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(20);
      setStatusText('Reorganizing and rendering pages...');

      const actions: PageAction[] = pages.map((p) => ({
        sourcePageIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const organized = await organizePdf(files[0].arrayBuffer, actions);
      setProgress(100);
      setResultBytes(organized);
      setIsProcessing(false);
      setStatusText('Organized PDF Ready!');
    } catch (err) {
      console.error('Organize error:', err);
      alert('Failed to save organized PDF.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes) {
      const outName = files[0].name.replace(/\.pdf$/i, '') + '_organized.pdf';
      downloadBytes(resultBytes, outName);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPages([]);
    setResultBytes(null);
    setModalOpen(false);
    setProgress(0);
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <LayoutGrid className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Organize PDF Pages
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Drag to reorder, delete unnecessary pages, rotate 90°, or insert blank pages.
            </p>
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            multiple={false}
            primaryColor="#f59e0b"
            title="Select PDF file to organize"
            subtitle="or drop a PDF document here to manage all its pages"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <span className="truncate max-w-xs">{files[0].name}</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
                {pages.length} Pages
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => insertBlankPage(pages.length - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Blank Page</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <span>Save Organized PDF</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grid of Pages */}
          {loadingPages ? (
            <div className="py-24 text-center text-zinc-400">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-xs font-bold">Rendering page thumbnails...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pages.map((p, idx) => (
                <div
                  key={`${p.originalIndex}-${idx}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                    if (!isNaN(fromIdx) && fromIdx !== idx) movePage(fromIdx, idx);
                  }}
                  className="group relative flex flex-col p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-amber-400 transition-all cursor-grab active:cursor-grabbing"
                >
                  {/* Page number pill */}
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <span className="text-[11px] font-extrabold text-zinc-400">
                      Page {idx + 1}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => rotatePage(idx)}
                        title="Rotate 90°"
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deletePage(idx)}
                        title="Delete Page"
                        className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-full aspect-[3/4] bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 flex items-center justify-center relative">
                    {p.originalIndex === -1 ? (
                      <div className="flex flex-col items-center gap-1 text-zinc-400 text-xs font-bold">
                        <span>Blank Page</span>
                      </div>
                    ) : p.dataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.dataUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-contain transition-transform duration-200"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                    ) : (
                      <span className="text-[10px] text-zinc-400">Loading...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        resultFilename={files[0]?.name.replace(/\.pdf$/i, '') + '_organized.pdf'}
        resultBytes={resultBytes}
        resultSize={resultBytes?.byteLength}
        originalSize={files[0]?.size}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Organizing PDF Pages"
      />
    </div>
  );
}
