'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Presentation, ArrowLeft, Download, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { convertPdfToPptx } from '@/lib/pdf/pdf-to-pptx';
import { downloadBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function PdfToPptxPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadReady, setDownloadReady] = useState<Uint8Array | null>(null);

  const handleConvert = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(10);
      setStatusText('Initializing PowerPoint Generator...');

      const pptxBytes = await convertPdfToPptx(files[0].arrayBuffer, (p) => {
        setProgress(p.progress);
        setStatusText(p.status);
      });

      setDownloadReady(pptxBytes);
      setProgress(100);
      setStatusText('PowerPoint Presentation Ready!');
      setIsProcessing(false);
    } catch (err: any) {
      console.error('PPTX conversion error:', err);
      alert(err.message || 'Failed to convert PDF to PPTX.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (!downloadReady || files.length === 0) return;
    const outName = `${files[0].name.replace(/\.pdf$/i, '')}.pptx`;
    downloadBytes(downloadReady, outName);
  };

  const handleReset = () => {
    setFiles([]);
    setDownloadReady(null);
    setModalOpen(false);
    setProgress(0);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Presentation className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                PDF to PowerPoint (PPTX)
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                Slide Deck
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Transform PDF documents and pitch decks into widescreen 16:9 editable PowerPoint presentations.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          multiple={false}
          primaryColor="#ea580c"
          title="Select PDF presentation to convert"
          subtitle="or drag and drop your PDF slide deck here"
        />

        {files.length > 0 && !downloadReady && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Presentation className="w-4 h-4" />
              <span>Convert to PowerPoint (.PPTX)</span>
            </button>
          </div>
        )}

        {/* Download View */}
        {downloadReady && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="p-6 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-orange-900 dark:text-orange-200">
                    PowerPoint Presentation Generated
                  </h4>
                  <p className="text-xs text-orange-700 dark:text-orange-400">
                    Your PDF slides have been formatted into a widescreen 16:9 .pptx presentation.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download .PPTX File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="pdf"
          toolSlug="pdf-to-pptx"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
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
        actionTitle="Converting PDF to PowerPoint"
      />
    </div>
  );
}
