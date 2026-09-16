'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutGrid, ArrowLeft, Download, RotateCw, Trash2, Copy, MoveLeft, MoveRight, Plus, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { assembleMasterPdf, LightboxPageItem, SourceDocument } from '@/lib/pdf/multi-organize';
import { getPdfJs, renderAllPageThumbnails, downloadBytes, safeCloneBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function MultiOrganizePage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [lightboxPages, setLightboxPages] = useState<LightboxPageItem[]>([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadReady, setDownloadReady] = useState<Uint8Array | null>(null);

  // When files change, render thumbnails for all pages across all documents
  useEffect(() => {
    let isMounted = true;
    async function loadAllThumbnails() {
      if (files.length === 0) {
        setLightboxPages([]);
        return;
      }

      setLoadingThumbs(true);
      const allPages: LightboxPageItem[] = [];

      for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const file = files[fIdx];
        if (!file.arrayBuffer) continue;

        try {
          const thumbs = await renderAllPageThumbnails(file.arrayBuffer, 50, 0.35);
          if (!isMounted) return;

          thumbs.forEach((t) => {
            allPages.push({
              id: `page_${file.id}_${t.pageNumber}`,
              sourceDocId: file.id,
              sourceDocName: file.name,
              pageIndex: t.pageNumber - 1,
              displayPageNumber: t.pageNumber,
              rotation: 0,
              thumbnailDataUrl: t.dataUrl,
            });
          });
        } catch (err) {
          console.error(`Error loading thumbnails for ${file.name}:`, err);
        }
      }

      if (isMounted) {
        setLightboxPages(allPages);
        setLoadingThumbs(false);
      }
    }

    loadAllThumbnails();
    return () => {
      isMounted = false;
    };
  }, [files]);

  const handleRotate = (id: string) => {
    setLightboxPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDelete = (id: string) => {
    setLightboxPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDuplicate = (item: LightboxPageItem, idx: number) => {
    const copy: LightboxPageItem = {
      ...item,
      id: `${item.id}_copy_${Date.now()}`,
    };
    const next = [...lightboxPages];
    next.splice(idx + 1, 0, copy);
    setLightboxPages(next);
  };

  const handleMove = (idx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= lightboxPages.length) return;

    const next = [...lightboxPages];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    setLightboxPages(next);
  };

  const handleAssembleMasterPdf = async () => {
    if (files.length === 0 || lightboxPages.length === 0) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(20);
      setStatusText('Assembling master document pages...');

      const sources: SourceDocument[] = files.map((f) => ({
        id: f.id,
        name: f.name,
        data: f.arrayBuffer!,
      }));

      const masterBytes = await assembleMasterPdf(sources, lightboxPages);
      setDownloadReady(masterBytes);
      setProgress(100);
      setStatusText('Master PDF Assembled Successfully!');
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Assemble error:', err);
      alert(err.message || 'Failed to assemble master PDF.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (!downloadReady) return;
    downloadBytes(downloadReady, `Master_Assembled_${lightboxPages.length}_Pages_${Date.now()}.pdf`);
  };

  const handleReset = () => {
    setFiles([]);
    setLightboxPages([]);
    setDownloadReady(null);
    setModalOpen(false);
    setProgress(0);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Multi-Document Lightbox Reorganizer
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Master Lightbox
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Drop 2-10 documents simultaneously. Reorder, rotate, delete, and duplicate pages across files into 1 master PDF.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 space-y-6">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          multiple={true}
          primaryColor="#f59e0b"
          title="Select multiple PDF documents"
          subtitle="or drag and drop 2 to 10 PDF files here"
        />

        {loadingThumbs && (
          <div className="text-center py-8 text-xs font-bold text-zinc-500 animate-pulse">
            Rendering high-res page thumbnails across all documents...
          </div>
        )}

        {lightboxPages.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Master Lightbox Grid ({lightboxPages.length} Pages)
                </h3>
                <p className="text-xs text-zinc-500">
                  Pages will be assembled in the exact sequence shown below.
                </p>
              </div>

              <button
                onClick={handleAssembleMasterPdf}
                disabled={isProcessing}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Assemble Master PDF ({lightboxPages.length} Pages)</span>
              </button>
            </div>

            {/* Lightbox Pages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {lightboxPages.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col items-center"
                >
                  {/* Sequence Badge */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate max-w-[80px]" title={item.sourceDocName}>
                      {item.sourceDocName}
                    </span>
                  </div>

                  {/* Thumbnail Image with Rotation */}
                  <div className="relative w-full aspect-[3/4] bg-white rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                    {item.thumbnailDataUrl ? (
                      <img
                        src={item.thumbnailDataUrl}
                        alt={`Page ${item.displayPageNumber}`}
                        style={{ transform: `rotate(${item.rotation}deg)` }}
                        className="max-w-full max-h-full object-contain transition-transform"
                      />
                    ) : (
                      <div className="text-xs text-zinc-400 font-bold">Page {item.displayPageNumber}</div>
                    )}
                  </div>

                  {/* Action Controls Bar */}
                  <div className="mt-3 flex items-center gap-1">
                    <button
                      onClick={() => handleMove(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 cursor-pointer"
                      title="Move Left"
                    >
                      <MoveLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRotate(item.id)}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(item, idx)}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'right')}
                      disabled={idx === lightboxPages.length - 1}
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 cursor-pointer"
                      title="Move Right"
                    >
                      <MoveRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="pdf"
          toolSlug="multi-organize"
          fileName={`${files.length} PDF Documents`}
          fileContext={`Master Lightbox with ${lightboxPages.length} assembled pages.`}
        />
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen && isProcessing}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Assembling Master PDF Document"
      />
    </div>
  );
}
