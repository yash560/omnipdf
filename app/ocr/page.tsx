'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScanText, ArrowLeft, Download, Copy, Check, FileText, CheckCircle2, Search } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { performPdfOcr } from '@/lib/pdf/ocr';
import { downloadBlob, downloadBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function OcrPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [searchablePdfBytes, setSearchablePdfBytes] = useState<Uint8Array | null>(null);
  const [copied, setCopied] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const handleOcr = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(5);
      setStatusText('Initializing OCR Neural Engine...');

      const arrayBuf = files[0].arrayBuffer;
      const res = await performPdfOcr(arrayBuf, 'eng', (info) => {
        setProgress(info.progress);
        setStatusText(info.status);
      });

      setExtractedText(res.text);
      if (res.searchablePdfBytes) {
        setSearchablePdfBytes(res.searchablePdfBytes);
      }
      setIsProcessing(false);
      setStatusText('OCR & Searchable PDF Creation Complete!');
    } catch (err) {
      console.error('OCR error:', err);
      alert('Failed to extract text. Please ensure the document is clear.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${files[0]?.name.replace(/\.pdf$/i, '')}_ocr_text.txt`);
  };

  const downloadSearchablePdf = () => {
    if (!searchablePdfBytes || files.length === 0) return;
    const outName = `${files[0].name.replace(/\.pdf$/i, '')}_searchable.pdf`;
    downloadBytes(searchablePdfBytes, outName);
  };

  const handleReset = () => {
    setFiles([]);
    setExtractedText('');
    setSearchablePdfBytes(null);
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
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <ScanText className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                OCR Searchable PDF & Text Extractor
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                Sandwich OCR
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Transform scanned paper documents into fully searchable, selectable PDFs with invisible text layers.
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
          primaryColor="#7c3aed"
          title="Select scanned document for OCR"
          subtitle="or drag and drop your scanned PDF here"
        />

        {files.length > 0 && !extractedText && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              onClick={handleOcr}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-violet-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <ScanText className="w-4 h-4" />
              <span>Generate Searchable PDF</span>
            </button>
          </div>
        )}

        {/* Results View */}
        {extractedText && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            {/* Download Buttons Banner */}
            <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-violet-900 dark:text-violet-200">
                    Searchable PDF Ready
                  </h4>
                  <p className="text-xs text-violet-700 dark:text-violet-400">
                    Invisible text layer embedded under original scans for native search and selection.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={downloadSearchablePdf}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Searchable PDF</span>
                </button>
                <button
                  onClick={downloadTextFile}
                  className="px-3 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>.TXT</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-500" />
                <span>Extracted Recognized Text Content</span>
              </h3>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <textarea
              readOnly
              value={extractedText}
              rows={12}
              className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed outline-none"
            />
          </div>
        )}
      </div>

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="pdf"
          toolSlug="ocr"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          fileContext={extractedText || undefined}
        />
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen && isProcessing}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        onDownload={downloadSearchablePdf}
        onReset={handleReset}
        actionTitle="Performing Neural OCR Recognition"
      />
    </div>
  );
}
