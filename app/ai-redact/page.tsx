'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { EyeOff, ArrowLeft, Download, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, Filter, Check, X } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { scanPdfForPii, applyPiiRedactions, DetectedPiiEntity } from '@/lib/pdf/ai-redact';
import { getPdfJs, downloadBytes, safeCloneBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function AiRedactPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [entities, setEntities] = useState<DetectedPiiEntity[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadReady, setDownloadReady] = useState<Uint8Array | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Load PDF
  useEffect(() => {
    let isMounted = true;
    async function loadDoc() {
      if (files.length === 0 || !files[0].arrayBuffer) {
        pdfDocRef.current = null;
        setEntities([]);
        setHasScanned(false);
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
        console.error('Error loading PDF for AI Redact:', err);
      }
    }

    loadDoc();
    return () => {
      isMounted = false;
    };
  }, [files]);

  // Render Canvas
  useEffect(() => {
    let isMounted = true;
    async function renderPage() {
      const canvas = canvasRef.current;
      const pdfDoc = pdfDocRef.current;
      if (!canvas || !pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: 1.0 });
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
        const scale = Math.min(520, window.innerWidth - 64) / viewport.width;
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
        console.error('Render error:', err);
      }
    }

    renderPage();
    return () => {
      isMounted = false;
    };
  }, [currentPage, files]);

  const handleScanPii = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(10);
      setStatusText('Scanning document streams for confidential PII...');

      const found = await scanPdfForPii(files[0].arrayBuffer, (p) => {
        setProgress(p.progress);
        setStatusText(p.status);
      });

      setEntities(found);
      setHasScanned(true);
      setIsProcessing(false);
      setModalOpen(false);
    } catch (err: any) {
      console.error('PII scan error:', err);
      alert(err.message || 'Failed to scan document for PII.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleToggleEntity = (id: string) => {
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)));
  };

  const handleToggleAll = (enabled: boolean) => {
    setEntities((prev) => prev.map((e) => ({ ...e, enabled })));
  };

  const handleApplyRedactions = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(20);
      setStatusText('Applying permanent vector blackout redactions...');

      const bakedBytes = await applyPiiRedactions(files[0].arrayBuffer, entities);
      setDownloadReady(bakedBytes);
      setProgress(100);
      setStatusText('Document Redactions Successfully Applied!');
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Redact apply error:', err);
      alert(err.message || 'Failed to apply redactions.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (!downloadReady || files.length === 0) return;
    const outName = `${files[0].name.replace(/\.pdf$/i, '')}_redacted.pdf`;
    downloadBytes(downloadReady, outName);
  };

  const handleReset = () => {
    setFiles([]);
    setEntities([]);
    setHasScanned(false);
    setDownloadReady(null);
    setModalOpen(false);
    setProgress(0);
  };

  const currentPageEntities = entities.filter((e) => e.pageIndex === currentPage - 1);
  const enabledCount = entities.filter((e) => e.enabled).length;

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
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg shadow-zinc-800/30">
            <EyeOff className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                AI Smart PII Redactor & Auto-Blackout
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-zinc-500/10 text-zinc-700 dark:text-zinc-300">
                Automated Privacy
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              1-Click automatic detection & permanent vector blackout for Aadhaar, PAN, SSNs, credit cards, phones, and emails.
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
            primaryColor="#18181b"
            title="Select PDF document for PII redaction"
            subtitle="or drag and drop your document here"
          />
        </div>
      ) : !hasScanned ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Ready to Scan for Confidential Data
            </h3>
            <p className="text-xs text-zinc-500">
              FileCraft AI will scan all text streams across {totalPages} pages to detect Indian & Global PII entities.
            </p>
          </div>

          <button
            onClick={handleScanPii}
            disabled={isProcessing}
            className="px-8 py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-extrabold text-sm shadow-xl hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Scan Document for Sensitive PII</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Visual Preview */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center relative min-h-[480px]">
            <div className="relative border border-zinc-300 dark:border-zinc-700 shadow-2xl rounded-lg overflow-hidden bg-white">
              <canvas ref={canvasRef} className="block max-h-[520px] object-contain" />

              {/* Overlays for detected PII on current page */}
              {currentPageEntities.map((ent) => (
                <div
                  key={ent.id}
                  onClick={() => handleToggleEntity(ent.id)}
                  style={{
                    left: `${ent.bbox.x}px`,
                    top: `${ent.bbox.y}px`,
                    width: `${ent.bbox.width}px`,
                    height: `${ent.bbox.height}px`,
                  }}
                  className={`absolute rounded transition-all cursor-pointer flex items-center justify-center ${
                    ent.enabled
                      ? 'bg-black text-white shadow-md border border-black'
                      : 'border-2 border-rose-500 bg-rose-500/20'
                  }`}
                  title={`${ent.label}: ${ent.text} (Click to toggle)`}
                >
                  <span className="text-[9px] font-mono font-extrabold uppercase px-1 truncate pointer-events-none">
                    {ent.enabled ? '████ REDACTED' : ent.type}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
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

          {/* Right Detected Entities List */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                    Detected PII Entities ({entities.length})
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {enabledCount} marked for blackout redaction
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <button
                    onClick={() => handleToggleAll(true)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleToggleAll(false)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    None
                  </button>
                </div>
              </div>

              {/* Entities List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {entities.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-500">
                    No PII patterns detected on this document.
                  </div>
                ) : (
                  entities.map((ent) => (
                    <div
                      key={ent.id}
                      onClick={() => {
                        setCurrentPage(ent.pageIndex + 1);
                        handleToggleEntity(ent.id);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        ent.enabled
                          ? 'bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700'
                          : 'opacity-50 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {ent.label}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400">
                            Page {ent.pageIndex + 1}
                          </span>
                        </div>
                        <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                          {ent.text}
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${ent.enabled ? 'bg-black text-white' : 'border border-zinc-300'}`}>
                        {ent.enabled && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleApplyRedactions}
                disabled={enabledCount === 0 || isProcessing}
                className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <EyeOff className="w-4 h-4" />
                <span>Apply Permanent Blackout ({enabledCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Applying Permanent PII Redactions"
      />
    </div>
  );
}
