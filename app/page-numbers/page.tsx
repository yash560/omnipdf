'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Hash, ArrowLeft, ArrowRight } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile, PageNumberConfig } from '@/types/pdf';
import { addPageNumbers } from '@/lib/pdf/page-numbers';
import { downloadBytes } from '@/lib/pdf/core';

export default function PageNumbersPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [format, setFormat] = useState<PageNumberConfig['format']>('page-n-of-total');
  const [position, setPosition] = useState<PageNumberConfig['position']>('bottom-center');
  const [fontSize, setFontSize] = useState(11);
  const [startPage, setStartPage] = useState(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleApply = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(25);
      setStatusText('Applying page number format to all pages...');

      const arrayBuf = files[0].arrayBuffer;
      const config: PageNumberConfig = {
        format,
        position,
        fontSize,
        fontFamily: 'Helvetica',
        color: '#374151',
        margin: 25,
        startPage,
        pageRange: 'all',
      };

      const numbered = await addPageNumbers(arrayBuf, config);
      setProgress(100);
      setResultBytes(numbered);
      setIsProcessing(false);
      setStatusText('Page Numbers Added Successfully!');
    } catch (err) {
      console.error('Page numbers error:', err);
      alert('Failed to add page numbers. Please check your document.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes) {
      const outName = files[0].name.replace(/\.pdf$/i, '') + '_numbered.pdf';
      downloadBytes(resultBytes, outName);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
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
          <div className="w-12 h-12 rounded-2xl bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Hash className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Add Page Numbers
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Insert customized page numbers into your PDF. Choose position, dimensions, and typography.
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
          primaryColor="#8b5cf6"
          title="Select PDF file for page numbering"
          subtitle="or drop a PDF document here"
        />

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Format tokens */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Number Format
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'page-n-of-total', label: 'Page 1 of 10' },
                    { id: 'page-n', label: 'Page 1' },
                    { id: 'n-slash-total', label: '1/10' },
                    { id: 'number-only', label: '1 (Single number)' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormat(fmt.id as any)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        format === fmt.id
                          ? 'border-violet-500 bg-violet-50/40 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'top-left', label: 'Top Left' },
                    { id: 'top-center', label: 'Top Center' },
                    { id: 'top-right', label: 'Top Right' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'bottom-center', label: 'Bottom Center' },
                    { id: 'bottom-right', label: 'Bottom Right' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPosition(pos.id as any)}
                      className={`p-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        position === pos.id
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    First Page Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startPage}
                    onChange={(e) => setStartPage(parseInt(e.target.value, 10) || 1)}
                    className="w-24 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-violet-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Add Page Numbers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        resultFilename={files[0]?.name.replace(/\.pdf$/i, '') + '_numbered.pdf'}
        resultBytes={resultBytes}
        resultSize={resultBytes?.byteLength}
        originalSize={files[0]?.size}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Adding Page Numbers"
      />
    </div>
  );
}
