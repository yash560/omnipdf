'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { rotateAllPages } from '@/lib/pdf/organize';
import { downloadBytes } from '@/lib/pdf/core';

export default function RotatePage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [rotationAngle, setRotationAngle] = useState(90);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRotate = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(40);
      setStatusText(`Applying ${rotationAngle}° rotation to all pages...`);

      const arrayBuf = files[0].arrayBuffer;
      const rotated = await rotateAllPages(arrayBuf, rotationAngle);

      setProgress(100);
      setResultBytes(rotated);
      setIsProcessing(false);
      setStatusText('All Pages Rotated Successfully!');
    } catch (err) {
      console.error('Rotate error:', err);
      alert('Failed to rotate PDF.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes) {
      const outName = files[0].name.replace(/\.pdf$/i, '') + '_rotated.pdf';
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
          <div className="w-12 h-12 rounded-2xl bg-lime-500 text-white flex items-center justify-center shadow-lg shadow-lime-500/20">
            <RotateCw className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Rotate PDF Pages
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Rotate all pages of your PDF document 90°, 180°, or 270° permanently.
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
          primaryColor="#84cc16"
          title="Select PDF file to rotate"
          subtitle="or drop a PDF document here"
        />

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
                Rotation Angle
              </label>

              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[
                  { deg: 90, label: '90° Right (Clockwise)' },
                  { deg: 180, label: '180° Flip (Upside Down)' },
                  { deg: 270, label: '270° Left (Counter-Clockwise)' },
                ].map((rot) => (
                  <button
                    key={rot.deg}
                    type="button"
                    onClick={() => setRotationAngle(rot.deg)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      rotationAngle === rot.deg
                        ? 'border-lime-500 bg-lime-50/40 dark:bg-lime-950/20 text-lime-700 dark:text-lime-300 ring-2 ring-lime-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="font-extrabold text-base mb-1">{rot.deg}°</div>
                    <div className="text-[10px] text-zinc-500">{rot.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleRotate}
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white font-extrabold text-sm shadow-xl shadow-lime-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Rotate All Pages</span>
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
        resultFilename={files[0]?.name.replace(/\.pdf$/i, '') + '_rotated.pdf'}
        resultBytes={resultBytes}
        resultSize={resultBytes?.byteLength}
        originalSize={files[0]?.size}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Rotating PDF"
      />
    </div>
  );
}
