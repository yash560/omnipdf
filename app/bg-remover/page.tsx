'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { removeBackground } from '@/lib/image/bg-remover';
import { Wand2, Download, Sliders, CheckCircle2, PaintBucket, Sparkles, RefreshCw } from 'lucide-react';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function BgRemoverPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [tolerance, setTolerance] = useState(25);
  const [feather, setFeather] = useState(2);
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleRemoveBg = async (
    currentFiles = files,
    currentTol = tolerance,
    currentFeather = feather,
    currentBg = bgColor
  ) => {
    if (currentFiles.length === 0) return;
    setProcessing(true);
    try {
      const file = currentFiles[0].file;
      const res = await removeBackground(file, {
        tolerance: currentTol,
        feather: currentFeather,
        mode: 'auto',
        replacementBg: currentBg === 'transparent' ? undefined : { type: 'color', color: currentBg },
      });
      setResultUrl(res.dataUrl);
      setResultBlob(res.blob);
    } catch (err: any) {
      alert(`Background removal failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleFilesChange = (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      handleRemoveBg(newFiles, tolerance, feather, bgColor);
    } else {
      setResultUrl(null);
      setResultBlob(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 text-xs font-bold mb-3">
          <Wand2 className="w-3.5 h-3.5" />
          <span>Instant AI Cutout • 100% Private On-Device Processing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          AI Background Remover
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Cut out product photos, portraits, and logos with alpha feathering and custom background color replacement.
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
          subtitle="Supports JPG, PNG, WEBP for instant cutout"
          primaryColor="#ec4899"
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-500" />
              <span>Cutout Fine-Tuning</span>
            </h2>

            {/* Tolerance Slider */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                <span>Edge Tolerance: {tolerance}</span>
                <span className="text-zinc-400">Higher = removes more</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={tolerance}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setTolerance(val);
                  handleRemoveBg(files, val, feather, bgColor);
                }}
                className="w-full accent-pink-500"
              />
            </div>

            {/* Feathering Slider */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                <span>Edge Softness / Feather: {feather}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={feather}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFeather(val);
                  handleRemoveBg(files, tolerance, val, bgColor);
                }}
                className="w-full accent-pink-500"
              />
            </div>

            {/* Replacement BG */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                New Background
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'transparent', label: 'Transparent', color: 'transparent' },
                  { id: '#FFFFFF', label: 'White', color: '#FFFFFF' },
                  { id: '#000000', label: 'Black', color: '#000000' },
                  { id: '#3b82f6', label: 'Blue', color: '#3b82f6' },
                  { id: '#10b981', label: 'Green', color: '#10b981' },
                  { id: '#f59e0b', label: 'Yellow', color: '#f59e0b' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      setBgColor(bg.color);
                      handleRemoveBg(files, tolerance, feather, bg.color);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      bgColor === bg.color
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {resultBlob && (
              <button
                onClick={() => saveAs(resultBlob, `cutout_${files[0].name.replace(/\.[^/.]+$/, '')}.png`)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>Download Cutout PNG</span>
              </button>
            )}
          </div>

          {/* Checkerboard Preview */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Alpha Transparent Preview
            </h2>
            <div
              className="flex-1 flex items-center justify-center rounded-xl p-4 overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 min-h-[340px]"
              style={{
                backgroundImage:
                  bgColor === 'transparent'
                    ? 'linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)'
                    : 'none',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                backgroundColor: bgColor === 'transparent' ? '#f4f4f5' : bgColor,
              }}
            >
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Cutout"
                  className="max-h-[350px] max-w-full object-contain drop-shadow-md"
                />
              ) : (
                <div className="text-xs font-bold text-zinc-400">Processing background removal...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="image"
          toolSlug="bg-remover"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          imageBase64={resultUrl || undefined}
        />
      )}
    </div>
  );
}
