'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { convertVideoToAnimatedWebp } from '@/lib/media/video-to-gif';
import { Clapperboard, Download, Sliders, CheckCircle2, Sparkles, Play } from 'lucide-react';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';

export default function VideoToGifPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [fps, setFps] = useState<number>(15);
  const [duration, setDuration] = useState<number>(5);
  const [startTime, setStartTime] = useState<number>(0);
  const [scaleWidth, setScaleWidth] = useState<number>(480);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesChange = (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    setResultUrl(null);
    setResultBlob(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(10);
    try {
      const res = await convertVideoToAnimatedWebp(files[0].file, {
        fps,
        startTime,
        duration,
        scaleWidth,
        onProgress: (p) => setProgress(p),
      });
      setResultUrl(res.dataUrl);
      setResultBlob(res.blob);
      setProgress(100);
    } catch (err: any) {
      alert(`Animation conversion failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Video to Animated GIF / WebP Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Convert Video Clips to Lightweight Animations
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Trim start/end durations and convert MP4/WebM videos into high-framerate loop animations without uploading.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="video/*"
          multiple={false}
          title="Select or Drop a Video"
          subtitle="Supports MP4, WebM, MOV, and MKV"
          primaryColor="#f59e0b"
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Animation Parameters</span>
            </h2>

            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span>Start Time: {startTime}s</span>
              </div>
              <input
                type="number"
                min="0"
                step="0.5"
                value={startTime}
                onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span>Duration: {duration}s</span>
              </div>
              <input
                type="number"
                min="1"
                max="15"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span>Framerate: {fps} FPS</span>
              </div>
              <input
                type="range"
                min="8"
                max="24"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <button
              onClick={handleConvert}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Animated Loop</span>
            </button>
          </div>

          {/* Animation Loop Preview */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Animated Loop Preview
            </h2>

            {resultUrl && resultBlob ? (
              <div className="space-y-4">
                <video
                  src={resultUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded-xl max-h-[300px] object-contain bg-black"
                />

                <button
                  onClick={() => saveAs(resultBlob, `animated_${files[0].name.replace(/\.[^/.]+$/, '')}.webm`)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Animation File</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-xl p-8 text-center text-xs text-zinc-400">
                Configure duration and click Create to generate the loop.
              </div>
            )}
          </div>
        </div>
      )}

      <ProcessingModal isOpen={processing} progress={progress} statusText={`Rendering animation (${progress}%)...`} />
    </div>
  );
}
