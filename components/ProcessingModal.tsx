'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, RefreshCw, Sparkles, Loader2, Share2, FileText, ArrowRight } from 'lucide-react';
import { formatBytes } from '@/lib/pdf/core';

interface ProcessingModalProps {
  isOpen: boolean;
  isProcessing: boolean;
  progress: number;
  statusText: string;
  resultFilename?: string;
  resultBytes?: Uint8Array | null;
  resultSize?: number;
  originalSize?: number;
  onDownload: () => void;
  onReset: () => void;
  actionTitle?: string;
}

export function ProcessingModal({
  isOpen,
  isProcessing,
  progress,
  statusText,
  resultFilename = 'processed_document.pdf',
  resultBytes,
  resultSize,
  originalSize,
  onDownload,
  onReset,
  actionTitle = 'Processing Document',
}: ProcessingModalProps) {
  useEffect(() => {
    if (isOpen && !isProcessing && resultBytes) {
      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, isProcessing, resultBytes]);

  if (!isOpen) return null;

  const isComplete = !isProcessing && resultBytes !== null && resultBytes !== undefined;
  const savingsPercent =
    originalSize && resultSize && originalSize > resultSize
      ? Math.round(((originalSize - resultSize) / originalSize) * 100)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {isProcessing ? (
          /* Processing State */
          <div className="flex flex-col items-center py-6">
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-100 dark:border-zinc-800" />
              <div
                className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"
              />
              <FileText className="w-8 h-8 text-rose-500" />
            </div>

            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">
              {actionTitle}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-medium">
              {statusText || 'Executing client-side WebAssembly routines...'}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden p-0.5 mb-3">
              <div
                className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-zinc-400">{progress}% complete</span>
          </div>
        ) : isComplete ? (
          /* Complete State */
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5 shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">
              Your PDF is Ready!
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-medium">
              Processed locally in your browser with 100% privacy
            </p>

            {/* Savings or file info box */}
            <div className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 mb-6 text-left flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  PDF
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {resultFilename}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {resultSize ? formatBytes(resultSize) : 'Ready'}
                  </div>
                </div>
              </div>

              {savingsPercent !== null && (
                <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold shrink-0 ml-2">
                  -{savingsPercent}% Saved
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={onDownload}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-sm shadow-xl shadow-rose-500/25 hover:shadow-2xl hover:shadow-rose-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download Ready PDF</span>
              </button>

              <button
                onClick={onReset}
                className="w-full py-3 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Process Another File</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
