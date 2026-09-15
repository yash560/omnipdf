'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, RefreshCw, Sparkles, Loader2, Share2, FileText, ArrowRight, HardDrive, Cloud } from 'lucide-react';
import { formatBytes } from '@/lib/pdf/core';
import { uploadCloudFiles } from '@/lib/drive/cloud-api';
import { useAuth } from '@/lib/auth/auth-context';
import Link from 'next/link';

interface ProcessingModalProps {
  isOpen: boolean;
  isProcessing?: boolean;
  progress: number;
  statusText: string;
  resultFilename?: string;
  resultBytes?: Uint8Array | null;
  resultSize?: number;
  originalSize?: number;
  onDownload?: () => void;
  onReset?: () => void;
  actionTitle?: string;
}

export function ProcessingModal({
  isOpen,
  isProcessing = true,
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
  const { isAuthenticated, openAuthModal } = useAuth();
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [savedToDrive, setSavedToDrive] = useState(false);

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

  const handleSaveToDrive = async () => {
    if (!resultBytes) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      setIsSavingToDrive(true);
      const mime = resultFilename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
      const blob = new Blob([resultBytes as unknown as BlobPart], { type: mime });
      await uploadCloudFiles([{ name: resultFilename, blob, type: mime }]);
      setSavedToDrive(true);
      setTimeout(() => setSavedToDrive(false), 4000);
    } catch (err) {
      console.error('Failed to save to Cloud Drive:', err);
    } finally {
      setIsSavingToDrive(false);
    }
  };

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
          <div className="space-y-6">
            {/* Ambient Spinning Icon */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-lg">
                <Loader2 className="w-8 h-8 animate-spin stroke-[2.2]" />
              </div>
            </div>

            {/* Action Title & Real-time Status */}
            <div>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">
                {actionTitle}
              </h3>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-all duration-200">
                {statusText}
              </p>
            </div>

            {/* Progress Bar & Percentage */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200/60 dark:border-zinc-700/60">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300 shadow-xs"
                  style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                <span>100% In-Browser Execution</span>
                <span>{progress}%</span>
              </div>
            </div>
          </div>
        ) : isComplete ? (
          <div className="space-y-6">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">
                Document Ready!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Processed successfully with zero quality loss.
              </p>
            </div>

            {/* File Info / Stats Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">{resultFilename}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/40">
                <span>Output File Size:</span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  {resultSize ? formatBytes(resultSize) : 'Ready'}
                </span>
              </div>

              {savingsPercent !== null && savingsPercent > 0 && (
                <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                  <span>Size Reduced:</span>
                  <span>-{savingsPercent}% Saved</span>
                </div>
              )}
            </div>

            {/* Primary Download & Reset Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download File</span>
                </button>
              )}

              <button
                onClick={handleSaveToDrive}
                disabled={isSavingToDrive || savedToDrive}
                className={`w-full sm:w-auto py-3.5 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-75 ${
                  savedToDrive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400'
                }`}
                title="Save directly to your FileCraft Cloud Drive"
              >
                {isSavingToDrive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : savedToDrive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span>{savedToDrive ? 'Saved in Cloud Drive!' : 'Save to Cloud'}</span>
              </button>

              {onReset && (
                <button
                  onClick={onReset}
                  className="w-full sm:w-auto py-3.5 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
