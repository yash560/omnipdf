'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Stamp, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile, WatermarkConfig } from '@/types/pdf';
import { applyWatermark } from '@/lib/pdf/watermark';
import { downloadBytes } from '@/lib/pdf/core';

export default function WatermarkPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState<WatermarkConfig['position']>('center');
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(45);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ef4444');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleApply = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(20);
      setStatusText('Embedding watermark streams across all pages...');

      const arrayBuf = files[0].arrayBuffer;
      const config: WatermarkConfig = {
        type: 'text',
        text: watermarkText,
        fontFamily: 'Helvetica',
        fontSize,
        color,
        opacity,
        rotation,
        position,
        layer: 'over',
      };

      const stamped = await applyWatermark(arrayBuf, config);
      setProgress(100);
      setResultBytes(stamped);
      setIsProcessing(false);
      setStatusText('Watermark Applied Successfully!');
    } catch (err) {
      console.error('Watermark error:', err);
      alert('Failed to apply watermark. Please check your document.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes) {
      const outName = files[0].name.replace(/\.pdf$/i, '') + '_watermarked.pdf';
      downloadBytes(resultBytes, outName);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setModalOpen(false);
    setProgress(0);
  };

  const positions: { id: WatermarkConfig['position']; label: string }[] = [
    { id: 'top-left', label: 'TL' },
    { id: 'top-center', label: 'TC' },
    { id: 'top-right', label: 'TR' },
    { id: 'middle-left', label: 'ML' },
    { id: 'center', label: 'Center' },
    { id: 'middle-right', label: 'MR' },
    { id: 'bottom-left', label: 'BL' },
    { id: 'bottom-center', label: 'BC' },
    { id: 'bottom-right', label: 'BR' },
  ];

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
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Stamp className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Watermark PDF
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Stamp text or image watermarks over all pages of your PDF in seconds.
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
          primaryColor="#6366f1"
          title="Select PDF file to watermark"
          subtitle="or drop a PDF document here"
        />

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            {/* Watermark Text */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Position 3x3 Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Position on Page
                </label>
                <div className="grid grid-cols-3 gap-2 w-48">
                  {positions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPosition(p.id)}
                      className={`h-12 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        position === p.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders: Opacity, Angle, Size */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Opacity</span>
                    <span>{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Rotation Angle</span>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Font Size</span>
                    <span>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="96"
                    step="2"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Apply Watermark</span>
                <ArrowRight className="w-4 h-4" />
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
        resultFilename={files[0]?.name.replace(/\.pdf$/i, '') + '_watermarked.pdf'}
        resultBytes={resultBytes}
        resultSize={resultBytes?.byteLength}
        originalSize={files[0]?.size}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Watermarking PDF"
      />
    </div>
  );
}
