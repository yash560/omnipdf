'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Images, ArrowLeft, ArrowRight, Download, Archive } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { pdfToImagesAndDownloadZip } from '@/lib/pdf/convert';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function PdfToJpgPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [dpiScale, setDpiScale] = useState<number>(2.0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleConvert = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(10);
      setStatusText('Rasterizing PDF vector pages to high-res images...');

      const arrayBuf = files[0].arrayBuffer;
      const baseName = files[0].name.replace(/\.pdf$/i, '');

      await pdfToImagesAndDownloadZip(
        arrayBuf,
        baseName,
        format,
        dpiScale,
        (current, total) => {
          setProgress(Math.round((current / total) * 100));
          setStatusText(`Rendering page ${current} of ${total} to ${format.toUpperCase()}...`);
        }
      );

      setIsProcessing(false);
      setCompleted(true);
      setStatusText('All Pages Converted and Downloaded as ZIP!');
    } catch (err) {
      console.error('PDF to JPG error:', err);
      alert('Failed to convert PDF to images.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setModalOpen(false);
    setCompleted(false);
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Images className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              PDF to JPG & PNG Images
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Extract every page of your PDF into high-resolution 300 DPI images and download as a ZIP archive.
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
          primaryColor="#059669"
          title="Select PDF file to convert to images"
          subtitle="or drop a PDF document here"
        />

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Format selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Image Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      format === 'png'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    PNG (Lossless)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('jpeg')}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      format === 'jpeg'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    JPG (Smaller size)
                  </button>
                </div>
              </div>

              {/* Resolution / DPI */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Resolution Quality
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { scale: 1.0, label: 'Standard' },
                    { scale: 2.0, label: 'High (300 DPI)' },
                    { scale: 3.0, label: 'Ultra HD' },
                  ].map((d) => (
                    <button
                      key={d.scale}
                      type="button"
                      onClick={() => setDpiScale(d.scale)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        dpiScale === d.scale
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Archive className="w-4 h-4" />
                <span>Extract All Pages as ZIP</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="pdf"
          toolSlug="pdf-to-jpg"
          fileName={files[0]?.name}
          fileSize={files[0]?.size}
          fileContext={`PDF to Image Rasterizer: Document: ${files[0]?.name}, Target Image Format: ${format.toUpperCase()}, Render Resolution: ${dpiScale * 150} DPI`}
        />
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        resultFilename={`${files[0]?.name.replace(/\.pdf$/i, '')}_images.zip`}
        resultBytes={completed ? new Uint8Array([1, 2, 3]) : null}
        onDownload={handleConvert}
        onReset={handleReset}
        actionTitle="Extracting Images"
      />
    </div>
  );
}
