'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Crop, ArrowLeft, Download, RotateCw, CheckCircle2, Sparkles, Sliders, Layers } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { cropPdf } from '@/lib/pdf/crop';
import { getPdfJs, downloadBytes, safeCloneBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function CropPdfPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageWidth, setPageWidth] = useState(595);
  const [pageHeight, setPageHeight] = useState(842);

  // Margins in percentage (0 to 50)
  const [marginTop, setMarginTop] = useState(5);
  const [marginBottom, setMarginBottom] = useState(5);
  const [marginLeft, setMarginLeft] = useState(5);
  const [marginRight, setMarginRight] = useState(5);

  const [applyToAll, setApplyToAll] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadReady, setDownloadReady] = useState<Uint8Array | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Load PDF when file is selected
  useEffect(() => {
    let isMounted = true;
    async function loadPdf() {
      if (files.length === 0 || !files[0].arrayBuffer) {
        pdfDocRef.current = null;
        return;
      }

      try {
        const pdfjs = await getPdfJs();
        if (!pdfjs) return;

        const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(files[0].arrayBuffer) }).promise;
        if (!isMounted) return;

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF for crop:', err);
      }
    }

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [files]);

  // Render current page canvas
  useEffect(() => {
    let isMounted = true;
    async function renderPreview() {
      const canvas = canvasRef.current;
      const pdfDoc = pdfDocRef.current;
      if (!canvas || !pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: 1.0 });
        setPageWidth(Math.round(viewport.width));
        setPageHeight(Math.round(viewport.height));

        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
        const scale = (Math.min(420, window.innerWidth - 64) / viewport.width);
        const renderViewport = page.getViewport({ scale: scale * dpr });

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(viewport.width * scale)}px`;
        canvas.style.height = `${Math.floor(viewport.height * scale)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport: renderViewport,
          canvas,
        } as any).promise;
      } catch (err) {
        console.error('Render preview error:', err);
      }
    }

    renderPreview();
    return () => {
      isMounted = false;
    };
  }, [currentPage, files]);

  const handleApplyPreset = (type: 'standard' | 'aggressive' | 'trim-sides' | 'reset') => {
    if (type === 'standard') {
      setMarginTop(8);
      setMarginBottom(8);
      setMarginLeft(8);
      setMarginRight(8);
    } else if (type === 'aggressive') {
      setMarginTop(15);
      setMarginBottom(15);
      setMarginLeft(15);
      setMarginRight(15);
    } else if (type === 'trim-sides') {
      setMarginTop(0);
      setMarginBottom(0);
      setMarginLeft(10);
      setMarginRight(10);
    } else {
      setMarginTop(0);
      setMarginBottom(0);
      setMarginLeft(0);
      setMarginRight(0);
    }
  };

  const handleCrop = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(20);
      setStatusText('Recalculating document bounding boxes...');

      const croppedBytes = await cropPdf(files[0].arrayBuffer, {
        mode: 'margins',
        margins: {
          top: marginTop,
          bottom: marginBottom,
          left: marginLeft,
          right: marginRight,
        },
        unit: 'percent',
        pageSelection: applyToAll ? 'all' : 'custom',
        pageNumbers: [currentPage],
      });

      setProgress(90);
      setStatusText('Finalizing cropped document...');
      setDownloadReady(croppedBytes);
      setProgress(100);
      setStatusText('PDF Successfully Cropped!');
      setIsProcessing(false);
    } catch (err) {
      console.error('Crop error:', err);
      alert('Failed to crop PDF. Please check file permissions.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (!downloadReady || files.length === 0) return;
    const outName = `${files[0].name.replace(/\.pdf$/i, '')}_cropped.pdf`;
    downloadBytes(downloadReady, outName);
  };

  const handleReset = () => {
    setFiles([]);
    setDownloadReady(null);
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Crop className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Crop PDF Document
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Precision Studio
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Trim unwanted white borders, headers, footers, and margins across all or select pages.
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
            primaryColor="#10b981"
            title="Select PDF document to crop"
            subtitle="or drag and drop your PDF file here"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Visual Interactive Preview */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center relative min-h-[480px]">
            <div className="relative border border-zinc-300 dark:border-zinc-700 shadow-2xl rounded-lg overflow-hidden bg-white">
              <canvas ref={canvasRef} className="block max-h-[520px] object-contain" />

              {/* Crop Mask Overlay */}
              <div
                className="absolute inset-0 border-2 border-emerald-500 border-dashed pointer-events-none transition-all duration-150"
                style={{
                  top: `${marginTop}%`,
                  bottom: `${marginBottom}%`,
                  left: `${marginLeft}%`,
                  right: `${marginRight}%`,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                }}
              >
                <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow">
                  Active Crop Area
                </div>
              </div>
            </div>

            {/* Page Navigation */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-2xl">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-zinc-700 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  Prev
                </button>
                <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-zinc-700 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Precision Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <span>Margin Trimming (%)</span>
                </h3>
                <span className="text-xs font-mono text-zinc-500">
                  {pageWidth} × {pageHeight} pt
                </span>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleApplyPreset('reset')}
                  className="px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  None (0%)
                </button>
                <button
                  onClick={() => handleApplyPreset('standard')}
                  className="px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Even (8%)
                </button>
                <button
                  onClick={() => handleApplyPreset('trim-sides')}
                  className="px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Sides Only
                </button>
                <button
                  onClick={() => handleApplyPreset('aggressive')}
                  className="px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Tight (15%)
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Top Margin</span>
                    <span>{marginTop}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    value={marginTop}
                    onChange={(e) => setMarginTop(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Bottom Margin</span>
                    <span>{marginBottom}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    value={marginBottom}
                    onChange={(e) => setMarginBottom(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Left Margin</span>
                    <span>{marginLeft}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    value={marginLeft}
                    onChange={(e) => setMarginLeft(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Right Margin</span>
                    <span>{marginRight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    value={marginRight}
                    onChange={(e) => setMarginRight(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Page Selection Toggle */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      Apply crop to all {totalPages} pages
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Uncheck to crop only current page ({currentPage})
                    </div>
                  </div>
                </label>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCrop}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Crop className="w-4 h-4" />
                <span>Crop PDF Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <div className="mt-8">
          <ToolAIAssistantBanner
            suite="pdf"
            toolSlug="crop"
            fileName={files[0]?.file.name}
            fileSize={files[0]?.file.size}
          />
        </div>
      )}

      {/* Processing / Download Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Cropping PDF Document"
      />
    </div>
  );
}
