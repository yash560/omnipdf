'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Scissors, ArrowLeft, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { splitPdf, burstPdfPages, parsePageRangeString } from '@/lib/pdf/split';
import { downloadBytes, createAndDownloadZip } from '@/lib/pdf/core';

export default function SplitPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [splitMode, setSplitMode] = useState<'range' | 'burst'>('range');
  const [rangeInput, setRangeInput] = useState('1-2, 3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [splitResults, setSplitResults] = useState<{ filename: string; bytes: Uint8Array }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSplit = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(15);
      setStatusText('Analyzing document structure...');

      const arrayBuf = files[0].arrayBuffer;
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      if (splitMode === 'burst') {
        const results = await burstPdfPages(arrayBuf, baseName, (pct) => {
          setProgress(pct);
          setStatusText(`Bursting pages... ${pct}%`);
        });
        setSplitResults(results);
        setResultBytes(results[0]?.bytes || new Uint8Array());
      } else {
        const parsedPages = parsePageRangeString(rangeInput, 1000);
        if (parsedPages.length === 0) {
          alert('Please provide a valid page range (e.g. 1-3, 5).');
          setIsProcessing(false);
          setModalOpen(false);
          return;
        }

        const results = await splitPdf(
          arrayBuf,
          [{ name: `${baseName}_extracted`, pages: parsedPages }],
          (pct) => {
            setProgress(pct);
            setStatusText('Extracting specified pages...');
          }
        );
        setSplitResults(results);
        setResultBytes(results[0]?.bytes || null);
      }

      setIsProcessing(false);
      setStatusText('Split Complete!');
    } catch (err) {
      console.error('Split error:', err);
      alert('Failed to split PDF. Please ensure the file is valid.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = async () => {
    if (splitMode === 'burst' && splitResults.length > 1) {
      await createAndDownloadZip(
        splitResults.map((r) => ({ name: r.filename, data: r.bytes })),
        `${files[0].name.replace(/\.pdf$/i, '')}_split_pages.zip`
      );
    } else if (resultBytes) {
      downloadBytes(resultBytes, splitResults[0]?.filename || 'split_document.pdf');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setSplitResults([]);
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
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Scissors className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Split PDF File
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Extract specific page ranges or separate all pages into individual files.
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
          primaryColor="#f97316"
          title="Select PDF file to split"
          subtitle="or drop a PDF document here"
        />

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            {/* Split Options Tabs */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
                Split Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSplitMode('range')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    splitMode === 'range'
                      ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-950/20 ring-2 ring-orange-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                    Custom Page Ranges
                  </div>
                  <div className="text-xs text-zinc-500">
                    Extract specific pages (e.g. 1-3, 5, 8-10) into a clean new document.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMode('burst')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    splitMode === 'burst'
                      ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-950/20 ring-2 ring-orange-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                    Extract Every Page (Burst)
                  </div>
                  <div className="text-xs text-zinc-500">
                    Split every single page into separate individual PDFs in a ZIP archive.
                  </div>
                </button>
              </div>
            </div>

            {/* Range Input Field */}
            {splitMode === 'range' && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Page Ranges to Extract
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="e.g. 1-4, 7, 9-12"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Example: <code className="font-mono text-zinc-600 dark:text-zinc-300">1-5, 8, 11-14</code>
                </p>
              </div>
            )}

            {/* Split Action Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSplit}
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{splitMode === 'burst' ? 'Extract All Pages (ZIP)' : 'Split & Download PDF'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processing & Download Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        resultFilename={
          splitMode === 'burst'
            ? `${files[0]?.name.replace(/\.pdf$/i, '')}_split_pages.zip`
            : splitResults[0]?.filename || 'split_document.pdf'
        }
        resultBytes={resultBytes}
        resultSize={resultBytes?.byteLength}
        originalSize={files[0]?.size}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Splitting PDF Document"
      />
    </div>
  );
}
