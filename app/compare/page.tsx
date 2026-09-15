'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Columns2, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { StagedFile } from '@/types/pdf';
import { FileDropzone } from '@/components/FileDropzone';
import { getPdfJs, safeCloneBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function ComparePage() {
  const [file1, setFile1] = useState<StagedFile[]>([]);
  const [file2, setFile2] = useState<StagedFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.0);

  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function renderComparison() {
      const pdfjs = await getPdfJs();
      if (!pdfjs) return;

      if (file1.length > 0 && file1[0].arrayBuffer && canvasRef1.current) {
        try {
          const doc1 = await pdfjs.getDocument({ data: safeCloneBytes(file1[0].arrayBuffer) }).promise;
          if (isMounted) setTotalPages(doc1.numPages);
          if (currentPage <= doc1.numPages) {
            const page = await doc1.getPage(currentPage);
            const viewport = page.getViewport({ scale: zoom * 1.2 });
            const canvas = canvasRef1.current;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
            }
          }
        } catch (err) {
          console.error('Error rendering Doc 1:', err);
        }
      }

      if (file2.length > 0 && file2[0].arrayBuffer && canvasRef2.current) {
        try {
          const doc2 = await pdfjs.getDocument({ data: safeCloneBytes(file2[0].arrayBuffer) }).promise;
          if (currentPage <= doc2.numPages) {
            const page = await doc2.getPage(currentPage);
            const viewport = page.getViewport({ scale: zoom * 1.2 });
            const canvas = canvasRef2.current;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
            }
          }
        } catch (err) {
          console.error('Error rendering Doc 2:', err);
        }
      }
    }

    renderComparison();
    return () => {
      isMounted = false;
    };
  }, [file1, file2, currentPage, zoom]);

  const hasBothFiles = file1.length > 0 && file2.length > 0;

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
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Columns2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Compare PDF Documents (Diff)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Inspect two revisions of a PDF document side-by-side with synchronized zooming and page turning.
            </p>
          </div>
        </div>
      </div>

      {!hasBothFiles ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File 1 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mb-4">
              Document A (Original Revision)
            </h3>
            <FileDropzone
              files={file1}
              onFilesChange={setFile1}
              multiple={false}
              primaryColor="#ea580c"
              title="Select Original PDF"
              subtitle="Drop original PDF file"
            />
          </div>

          {/* File 2 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mb-4">
              Document B (Modified Revision)
            </h3>
            <FileDropzone
              files={file2}
              onFilesChange={setFile2}
              multiple={false}
              primaryColor="#ea580c"
              title="Select Modified PDF"
              subtitle="Drop revised PDF file"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setFile1([]);
                setFile2([]);
              }}
              className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
            >
              Reset Comparison
            </button>
          </div>

          {/* Side by Side Viewport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-zinc-100 dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-auto">
            {/* Left */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-zinc-500 mb-2 truncate max-w-sm">
                Document A: {file1[0]?.name}
              </span>
              <div className="bg-white shadow-xl rounded overflow-hidden">
                <canvas ref={canvasRef1} className="block" />
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-zinc-500 mb-2 truncate max-w-sm">
                Document B: {file2[0]?.name}
              </span>
              <div className="bg-white shadow-xl rounded overflow-hidden">
                <canvas ref={canvasRef2} className="block" />
              </div>
            </div>
          </div>

          {/* AI Assistant Banner */}
          <ToolAIAssistantBanner
            suite="pdf"
            toolSlug="compare"
            fileName={`${file1[0]?.name} vs ${file2[0]?.name}`}
            fileContext={`Comparing PDF Documents:\nDocument A: ${file1[0]?.name} (${(file1[0]?.size / 1024).toFixed(0)} KB)\nDocument B: ${file2[0]?.name} (${(file2[0]?.size / 1024).toFixed(0)} KB)\nCurrent Page: ${currentPage} of ${totalPages}`}
          />
        </div>
      )}
    </div>
  );
}
