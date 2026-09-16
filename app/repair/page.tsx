'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wrench, ArrowLeft, Download, CheckCircle2, AlertTriangle, ShieldCheck, Activity, FileCheck } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { repairPdf, RepairReport } from '@/lib/pdf/repair';
import { downloadBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function RepairPdfPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [downloadReady, setDownloadReady] = useState<Uint8Array | null>(null);
  const [report, setReport] = useState<RepairReport | null>(null);

  const handleRepair = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(15);
      setStatusText('Scanning byte stream headers and object catalog...');

      const arrayBuf = files[0].arrayBuffer;
      setProgress(40);
      setStatusText('Rebuilding cross-reference tables & uncompressing streams...');

      const result = await repairPdf(arrayBuf);

      setProgress(85);
      setStatusText('Verifying reconstructed page integrity...');

      setDownloadReady(result.bytes);
      setReport(result.report);

      setProgress(100);
      setStatusText('PDF Successfully Repaired & Restored!');
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Repair error:', err);
      alert(err.message || 'Failed to repair PDF document.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (!downloadReady || files.length === 0) return;
    const outName = `${files[0].name.replace(/\.pdf$/i, '')}_repaired.pdf`;
    downloadBytes(downloadReady, outName);
  };

  const handleReset = () => {
    setFiles([]);
    setDownloadReady(null);
    setReport(null);
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
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Wrench className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Repair Corrupted PDF
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                Structural Recovery
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Recover unreadable, damaged, or corrupted PDF files by reconstructing cross-reference tables and streams.
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
          primaryColor="#0284c7"
          title="Select damaged or unreadable PDF"
          subtitle="or drag and drop your corrupted PDF file here"
        />

        {files.length > 0 && !report && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              onClick={handleRepair}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              <span>Diagnose & Repair PDF</span>
            </button>
          </div>
        )}

        {/* Repair Diagnosis Report */}
        {report && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                    PDF Structural Recovery Successful
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Recovered {report.recoveredPages} pages and re-encoded clean object streams.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Repaired PDF</span>
              </button>
            </div>

            {/* Actions Taken Ledger */}
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <h5 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-500" />
                <span>Diagnostics & Repair Actions Taken</span>
              </h5>
              <ul className="space-y-2">
                {report.actionsTaken.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="pdf"
          toolSlug="repair"
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
        actionTitle="Repairing Damaged PDF"
      />
    </div>
  );
}
