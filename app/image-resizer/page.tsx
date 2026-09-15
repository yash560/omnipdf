'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { resizeImage, SOCIAL_PRESETS, ResizePreset } from '@/lib/image/resizer';
import { Maximize2, Download, Sliders, CheckCircle2, Lock, Unlock, Sparkles } from 'lucide-react';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function ImageResizerPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'cover' | 'contain' | 'stretch' | 'pad'>('cover');
  const [selectedPreset, setSelectedPreset] = useState<string>('ig-post');
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFilesChange = (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      const img = new Image();
      const objUrl = URL.createObjectURL(newFiles[0].file);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setAspectRatio(img.naturalWidth / img.naturalHeight);
        applyResize(newFiles[0].file, img.naturalWidth, img.naturalHeight, fitMode);
      };
      img.src = objUrl;
    } else {
      setResultUrl(null);
      setResultBlob(null);
    }
  };

  const applyResize = async (file: File, w: number, h: number, fit: typeof fitMode) => {
    setProcessing(true);
    try {
      const res = await resizeImage(file, {
        width: w,
        height: h,
        fitMode: fit,
      });
      setResultUrl(res.dataUrl);
      setResultBlob(res.blob);
    } catch (err: any) {
      alert(`Resize failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePresetSelect = (preset: ResizePreset) => {
    setSelectedPreset(preset.id);
    setWidth(preset.width);
    setHeight(preset.height);
    if (files.length > 0) {
      applyResize(files[0].file, preset.width, preset.height, fitMode);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && aspectRatio) {
      const newH = Math.round(val / aspectRatio);
      setHeight(newH);
      if (files.length > 0) applyResize(files[0].file, val, newH, fitMode);
    } else if (files.length > 0) {
      applyResize(files[0].file, val, height, fitMode);
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && aspectRatio) {
      const newW = Math.round(val * aspectRatio);
      setWidth(newW);
      if (files.length > 0) applyResize(files[0].file, newW, val, fitMode);
    } else if (files.length > 0) {
      applyResize(files[0].file, width, val, fitMode);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Asset & Format Resizer • Social Presets</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Crop & Resize to Any Format
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          One-click social media aspect ratios (Instagram, YouTube, Twitter, Passport) or custom pixel dimensions.
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
          primaryColor="#f59e0b"
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Social Media Presets</span>
            </h2>

            <div className="grid grid-cols-2 gap-2 mb-6 max-h-48 overflow-y-auto pr-1">
              {SOCIAL_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedPreset === p.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{p.name}</div>
                  <div className="text-[10px] opacity-75">{p.width} × {p.height} ({p.aspectRatio})</div>
                </button>
              ))}
            </div>

            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              Custom Dimensions (px)
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1">
                <label className="text-[11px] text-zinc-400">Width</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold"
                />
              </div>
              <button
                onClick={() => setLockAspect(!lockAspect)}
                className={`p-2 mt-4 rounded-xl border transition-colors ${
                  lockAspect ? 'bg-amber-500 text-white border-amber-600' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                }`}
                title={lockAspect ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
              >
                {lockAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <label className="text-[11px] text-zinc-400">Height</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold"
                />
              </div>
            </div>

            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              Fitting Mode
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { id: 'cover', label: 'Cover / Crop' },
                { id: 'contain', label: 'Contain / Fit' },
                { id: 'pad', label: 'Pad with White' },
                { id: 'stretch', label: 'Stretch' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setFitMode(m.id as any);
                    if (files.length > 0) applyResize(files[0].file, width, height, m.id as any);
                  }}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all ${
                    fitMode === m.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {resultBlob && (
              <button
                onClick={() => saveAs(resultBlob, `resized_${width}x${height}_${files[0].name}`)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>Download ({width} × {height} px)</span>
              </button>
            )}
          </div>

          {/* Preview Canvas */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Scaled Output ({width} × {height} px)
            </h2>
            <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-xl p-4 overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 min-h-[340px]">
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Resized"
                  className="max-h-[350px] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-xs font-bold text-zinc-400">Rendering preview...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="image"
          toolSlug="image-resizer"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          imageBase64={resultUrl || undefined}
        />
      )}
    </div>
  );
}
