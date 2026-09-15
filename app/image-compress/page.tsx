'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { compressImage, compressToTargetSize, CompressResult } from '@/lib/image/compressor';
import { Sliders, Download, Sparkles, CheckCircle2, ArrowRight, Gauge } from 'lucide-react';
import saveAs from 'file-saver';
import { formatBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function ImageCompressPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [quality, setQuality] = useState(0.75);
  const [targetSizeKb, setTargetSizeKb] = useState<string>('');
  const [mode, setMode] = useState<'slider' | 'target'>('slider');
  const [result, setResult] = useState<CompressResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCompress = async (currentFiles = files, currentQuality = quality) => {
    if (currentFiles.length === 0) return;
    setProcessing(true);
    try {
      const file = currentFiles[0].file;
      let res: CompressResult;
      if (mode === 'target' && targetSizeKb) {
        const targetBytes = parseFloat(targetSizeKb) * 1024;
        res = await compressToTargetSize(file, targetBytes);
      } else {
        res = await compressImage(file, currentQuality);
      }
      setResult(res);
    } catch (err: any) {
      alert(`Compression failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleFilesChange = (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      handleCompress(newFiles, quality);
    } else {
      setResult(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
          <Gauge className="w-3.5 h-3.5" />
          <span>Smart Image Compressor • Target Size Mode</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Compress Images to Exact Sizes
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Reduce file size by up to 90% while keeping pristine visual sharpness. Set custom target sizes for portal uploads.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="image/*"
          multiple={false}
          title="Select or Drop an Image"
          subtitle="Supports JPG, PNG, WEBP, AVIF"
          primaryColor="#10b981"
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>Compression Controls</span>
            </h2>

            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-6">
              <button
                onClick={() => setMode('slider')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'slider' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500'
                }`}
              >
                Visual Slider
              </button>
              <button
                onClick={() => setMode('target')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'target' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500'
                }`}
              >
                Target File Size
              </button>
            </div>

            {mode === 'slider' ? (
              <div className="mb-6">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  <span>Quality: {Math.round(quality * 100)}%</span>
                  <span className="text-emerald-500">{result?.savingsPercent ? `-${result.savingsPercent}%` : ''}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={quality}
                  onChange={(e) => {
                    const q = parseFloat(e.target.value);
                    setQuality(q);
                    handleCompress(files, q);
                  }}
                  className="w-full accent-emerald-500"
                />
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Target Maximum File Size (KB)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={targetSizeKb}
                    onChange={(e) => setTargetSizeKb(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleCompress()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  {['100', '200', '500', '1000'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setTargetSizeKb(preset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold"
                    >
                      {preset} KB
                    </button>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 mb-6">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                  Compression Results
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">Original:</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatBytes(result.originalSize)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">Compressed:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(result.compressedSize)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Reduction:</span>
                  <span className="font-extrabold text-emerald-600">{result.savingsPercent}% smaller</span>
                </div>
              </div>
            )}

            {result && (
              <button
                onClick={() => saveAs(result.blob, `compressed_${files[0].name}`)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>Download ({formatBytes(result.compressedSize)})</span>
              </button>
            )}
          </div>

          {/* Side by side Preview */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Real-time Output Preview
            </h2>
            <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-xl p-4 overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 min-h-[320px]">
              {result ? (
                <img
                  src={result.dataUrl}
                  alt="Compressed"
                  className="max-h-[350px] max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-xs text-zinc-400">Processing compression...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="image"
          toolSlug="image-compress"
          fileName={files[0]?.file.name}
          fileSize={result ? result.compressedSize : files[0]?.file.size}
          imageBase64={result?.dataUrl}
        />
      )}
    </div>
  );
}
