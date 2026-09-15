'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minimize2, ArrowLeft, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { compressPdf } from '@/lib/pdf/compress';
import { downloadBytes } from '@/lib/pdf/core';

export default function CompressPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [level, setLevel] = useState<'extreme' | 'recommended' | 'less'>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [savedStats, setSavedStats] = useState<{ original: number; compressed: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCompress = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(10);
      setStatusText('Analyzing PDF streams and embedded media...');

      const arrayBuf = files[0].arrayBuffer;
      const { bytes, stats } = await compressPdf(arrayBuf, level, (pct) => {
        setProgress(pct);
        setStatusText(`Optimizing streams: ${pct}%`);
      });

      setResultBytes(bytes);
      setSavedStats({ original: stats.originalSize, compressed: stats.compressedSize });
      setIsProcessing(false);
      setStatusText('Compression Finished!');
    } catch (err) {
      console.error('Compress error:', err);
      alert('Failed to compress PDF. Please verify the document.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes) {
      const outName = files[0].name.replace(/\.pdf$/i, '') + '_compressed.pdf';
      downloadBytes(resultBytes, outName);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setSavedStats(null);
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
          <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Minimize2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Compress PDF
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Reduce file size while maintaining maximum PDF quality.
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
          primaryColor="#06b6d4"
          title="Select PDF file to compress"
          subtitle="or drop a PDF document here"
        />

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
                Compression Level
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Extreme */}
                <button
                  type="button"
                  onClick={() => setLevel('extreme')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    level === 'extreme'
                      ? 'border-cyan-500 bg-cyan-50/30 dark:bg-cyan-950/20 ring-2 ring-cyan-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Extreme
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/10 text-cyan-600">
                      Smallest
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Maximum compression. Good for email attachments and simple text documents.
                  </p>
                </button>

                {/* Recommended */}
                <button
                  type="button"
                  onClick={() => setLevel('recommended')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    level === 'recommended'
                      ? 'border-cyan-500 bg-cyan-50/30 dark:bg-cyan-950/20 ring-2 ring-cyan-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Recommended
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600">
                      Balanced
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    High quality balance. Optimizes images and streams with no visible loss.
                  </p>
                </button>

                {/* Less */}
                <button
                  type="button"
                  onClick={() => setLevel('less')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    level === 'less'
                      ? 'border-cyan-500 bg-cyan-50/30 dark:bg-cyan-950/20 ring-2 ring-cyan-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Less Compression
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-600">
                      High Quality
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Light optimization. Perfect for graphics-heavy portfolios and presentations.
                  </p>
                </button>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Compress PDF Now</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processing & Complete Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        resultFilename={files[0]?.name.replace(/\.pdf$/i, '') + '_compressed.pdf'}
        resultBytes={resultBytes}
        resultSize={savedStats?.compressed}
        originalSize={savedStats?.original}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Compressing PDF"
      />
    </div>
  );
}
