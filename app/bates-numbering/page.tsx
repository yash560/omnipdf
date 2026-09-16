'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Hash, ArrowLeft, Download, Sliders, CheckCircle2, FileSpreadsheet, ShieldAlert, Sparkles } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { applyBatesNumbering, BatesConfig } from '@/lib/pdf/bates-numbering';
import { downloadBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function BatesNumberingPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [prefix, setPrefix] = useState('CONFIDENTIAL-');
  const [suffix, setSuffix] = useState('');
  const [startNumber, setStartNumber] = useState(1);
  const [digitCount, setDigitCount] = useState(6);
  const [position, setPosition] = useState<BatesConfig['position']>('bottom-right');
  const [fontSize, setFontSize] = useState(10);
  const [color, setColor] = useState('#000000');
  const [margin, setMargin] = useState(36);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadReady, setDownloadReady] = useState<Uint8Array | null>(null);

  const sampleBatesPreview = `${prefix}${startNumber.toString().padStart(digitCount, '0')}${suffix}`;

  const handleApplyBates = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(20);
      setStatusText('Embedding sequential Bates stamps on document streams...');

      const resultBytes = await applyBatesNumbering(files[0].arrayBuffer, {
        prefix,
        suffix,
        startNumber,
        digitCount,
        position,
        fontSize,
        color,
        margin,
        pageSelection: 'all',
      });

      setDownloadReady(resultBytes);
      setProgress(100);
      setStatusText('Bates Numbering Applied Successfully!');
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Bates error:', err);
      alert(err.message || 'Failed to apply Bates numbering.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (!downloadReady || files.length === 0) return;
    const outName = `${files[0].name.replace(/\.pdf$/i, '')}_bates_indexed.pdf`;
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Hash className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Bates Numbering & Legal Stamping
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Legal Discovery
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Index and organize enterprise and legal documents with custom sequential Bates numbers and prefixes.
            </p>
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            multiple={false}
            primaryColor="#6366f1"
            title="Select PDF document for Bates indexing"
            subtitle="or drag and drop your document here"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Bates Stamp Configuration</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Suffix (Optional)
                  </label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Start Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Zero Padding Digits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={digitCount}
                    onChange={(e) => setDigitCount(parseInt(e.target.value, 10) || 6)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Stamp Position on Page
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      'top-left',
                      'top-center',
                      'top-right',
                      'bottom-left',
                      'bottom-center',
                      'bottom-right',
                    ] as const
                  ).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos)}
                      className={`py-2 text-[11px] font-extrabold rounded-xl border transition-all cursor-pointer capitalize ${
                        position === pos
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {pos.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Font Size ({fontSize} pt)
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="20"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Margin ({margin} pt)
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="72"
                    value={margin}
                    onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleApplyBates}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Hash className="w-4 h-4" />
                <span>Apply Bates Numbering</span>
              </button>
            </div>
          </div>

          {/* Right Live Preview */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Live Stamp Format Preview
              </h3>

              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">First Page Stamp</div>
                <div className="text-xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                  {sampleBatesPreview}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <div className="font-extrabold text-indigo-900 dark:text-indigo-200">
                  Document Discovery Standard
                </div>
                <p>
                  Bates indexing applies non-removable sequential reference numbers across multi-volume litigation or evidentiary packets.
                </p>
              </div>
            </div>

            {downloadReady && (
              <button
                onClick={handleDownload}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                <Download className="w-4 h-4" />
                <span>Download Indexed PDF</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <div className="mt-8">
          <ToolAIAssistantBanner
            suite="pdf"
            toolSlug="bates-numbering"
            fileName={files[0]?.file.name}
            fileSize={files[0]?.file.size}
            fileContext={`Bates Numbering Prefix: "${prefix}", Sample: "${sampleBatesPreview}"`}
          />
        </div>
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Applying Bates Numbering"
      />
    </div>
  );
}
