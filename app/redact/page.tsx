'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EyeOff, ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { CanvasStudio } from '@/components/editor/CanvasStudio';
import { StagedFile } from '@/types/pdf';

export default function RedactPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const activePdf = files[0];

  if (activePdf && activePdf.arrayBuffer) {
    return (
      <div className="flex-1 flex flex-col h-full w-full">
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Redaction Studio</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-xs">
              {activePdf.name}
            </span>
          </div>

          <button
            onClick={() => setFiles([])}
            className="text-zinc-900 dark:text-white font-bold hover:underline cursor-pointer"
          >
            Redact Another PDF
          </button>
        </div>

        <CanvasStudio pdfData={activePdf.arrayBuffer} filename={activePdf.name} defaultTool="redact" />
      </div>
    );
  }

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
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg shadow-black/20">
            <EyeOff className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Redact & Blackout PDF
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                Permanent
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Permanently blackout sensitive personal information, credit cards, SSNs, and names before sharing.
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
          primaryColor="#18181b"
          title="Select PDF file to redact"
          subtitle="or drop a PDF document here to open the redaction tool"
        />
      </div>

      {/* Security alert */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <span>
          Redactions are permanent. When you export, the underlying text and vectors underneath the blackout blocks are permanently destroyed in the PDF stream.
        </span>
      </div>
    </div>
  );
}
