'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { imagesToPdf, ImageToPdfOptions } from '@/lib/pdf/convert';
import { downloadBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [pageSize, setPageSize] = useState<ImageToPdfOptions['pageSize']>('a4');
  const [orientation, setOrientation] = useState<ImageToPdfOptions['orientation']>('auto');
  const [margin, setMargin] = useState<ImageToPdfOptions['margin']>('small');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleConvert = async () => {
    if (files.length === 0) {
      alert('Please select at least one image file.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(20);
      setStatusText('Processing image streams...');

      const imageItems: { name: string; dataUrl: string; width: number; height: number }[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(f.file);
        });

        // Load image to get dimensions
        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        imageItems.push({
          name: f.name,
          dataUrl,
          width: img.width || 800,
          height: img.height || 1000,
        });
      }

      setProgress(60);
      setStatusText('Assembling PDF pages with margins and layout...');

      const pdfBytes = await imagesToPdf(imageItems, {
        pageSize,
        orientation,
        margin,
      });

      setProgress(100);
      setResultBytes(pdfBytes);
      setIsProcessing(false);
      setStatusText('PDF Generated Successfully!');
    } catch (err) {
      console.error('Image to PDF error:', err);
      alert('Failed to convert images to PDF.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes) {
      downloadBytes(resultBytes, 'images_document.pdf');
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
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
            <ImageIcon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              JPG & PNG to PDF
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Convert images into formatted PDF. Customize page sizes, orientations, and margins.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          accept="image/jpeg, image/png, image/webp"
          multiple={true}
          primaryColor="#14b8a6"
          title="Select JPG or PNG images"
          subtitle="or drop images here to combine into a PDF"
        />

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Page Format */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Page Format
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'a4', label: 'A4 Standard (297x210 mm)' },
                    { id: 'letter', label: 'US Letter' },
                    { id: 'fit', label: 'Fit to Image Size' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPageSize(p.id as any)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        pageSize === p.id
                          ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Orientation
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'auto', label: 'Auto (Match Image)' },
                    { id: 'portrait', label: 'Portrait' },
                    { id: 'landscape', label: 'Landscape' },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOrientation(o.id as any)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        orientation === o.id
                          ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Margins
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'none', label: 'No Margin (Full Bleed)' },
                    { id: 'small', label: 'Small Margin (Clean)' },
                    { id: 'big', label: 'Big Margin' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMargin(m.id as any)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        margin === m.id
                          ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {m.label}
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
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-teal-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Convert {files.length} Images to PDF</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="pdf"
          toolSlug="jpg-to-pdf"
          fileName={`${files.length} Images to PDF`}
          fileSize={files.reduce((acc, f) => acc + f.size, 0)}
          fileContext={`Image to PDF Conversion: ${files.length} source images (${files.map(f => f.name).slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}), Page Size: ${pageSize.toUpperCase()}, Orientation: ${orientation}, Margin: ${margin}`}
        />
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        resultFilename="images_document.pdf"
        resultBytes={resultBytes}
        resultSize={resultBytes?.byteLength}
        originalSize={files.reduce((acc, f) => acc + f.size, 0)}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Converting Images to PDF"
      />
    </div>
  );
}
