'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, ArrowLeft, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { mergePdfs } from '@/lib/pdf/merge';
import { downloadBytes } from '@/lib/pdf/core';

export default function MergePage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files to merge.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(10);
      setStatusText('Reading PDF documents...');

      const sources = files.map((f) => ({
        data: f.arrayBuffer!,
        name: f.name,
        rotation: f.rotation || 0,
      }));

      const merged = await mergePdfs(sources, (pct, name) => {
        setProgress(pct);
        setStatusText(`Merging: ${name}`);
      });

      setResultBytes(merged);
      setIsProcessing(false);
      setStatusText('Merge Complete!');
    } catch (err) {
      console.error('Merge error:', err);
      alert('An error occurred while merging PDFs. Please check your files.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes) {
      downloadBytes(resultBytes, 'merged_document.pdf');
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
      {/* Top Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Merge PDF Files
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Combine multiple PDFs into a single unified document in any order.
            </p>
          </div>
        </div>
      </div>

      {/* Dropzone & Staged Files */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          multiple={true}
          primaryColor="#ef4444"
          title="Select PDF files to merge"
          subtitle="or drop PDF documents here. Drag cards to change the merge order."
        />

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-500">
              Files will be merged from left to right (top to bottom).
            </div>

            <button
              onClick={handleMerge}
              disabled={files.length < 2 || isProcessing}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-sm shadow-xl shadow-rose-500/25 hover:shadow-2xl transition-all active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Merge {files.length} PDFs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Processing & Complete Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        resultFilename="merged_document.pdf"
        resultBytes={resultBytes}
        resultSize={resultBytes?.byteLength}
        originalSize={files.reduce((acc, f) => acc + f.size, 0)}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Merging PDF Documents"
      />
    </div>
  );
}
