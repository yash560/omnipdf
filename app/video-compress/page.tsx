'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { compressVideo, VideoCompressResult } from '@/lib/media/video-compress';
import { Video, Download, Sliders, CheckCircle2, Sparkles, Gauge } from 'lucide-react';
import saveAs from 'file-saver';
import { formatBytes } from '@/lib/pdf/core';
import { ProcessingModal } from '@/components/ProcessingModal';

export default function VideoCompressPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [resolution, setResolution] = useState<'1080p' | '720p' | '480p' | '360p'>('720p');
  const [bitrateMbps, setBitrateMbps] = useState<number>(2.0);
  const [result, setResult] = useState<VideoCompressResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesChange = (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    setResult(null);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(5);
    try {
      const res = await compressVideo(files[0].file, {
        targetResolution: resolution,
        videoBitrateMbps: bitrateMbps,
        onProgress: (p) => setProgress(p),
      });
      setResult(res);
      setProgress(100);
    } catch (err: any) {
      alert(`Video compression failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold mb-3">
          <Video className="w-3.5 h-3.5" />
          <span>In-Browser Video Compressor • Zero Server Uploads</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Compress & Downscale Video Clips
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Reduce video bitrate and downscale resolution (1080p, 720p, 480p, 360p) locally inside your browser.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="video/mp4,video/webm,video/quicktime,video/*"
          multiple={false}
          title="Select or Drop a Video"
          subtitle="Supports MP4, WebM, MOV, and MKV"
          primaryColor="#ef4444"
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-500" />
              <span>Compression Parameters</span>
            </h2>

            {/* Resolution Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Target Resolution
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['1080p', '720p', '480p', '360p'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      resolution === res
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Bitrate Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                <span>Bitrate: {bitrateMbps} Mbps</span>
                <span className="text-zinc-400">Lower = smaller size</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.5"
                value={bitrateMbps}
                onChange={(e) => setBitrateMbps(parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>

            <button
              onClick={handleCompress}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Gauge className="w-4 h-4" />
              <span>Start In-Browser Compression</span>
            </button>
          </div>

          {/* Results and Playback */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Compressed Playback Preview
            </h2>

            {result ? (
              <div className="space-y-4">
                <video
                  src={result.dataUrl}
                  controls
                  className="w-full rounded-xl max-h-[300px] bg-black"
                />

                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Original Size:</span>
                    <span className="font-semibold">{formatBytes(result.originalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Compressed Size:</span>
                    <span className="font-bold text-emerald-600">{formatBytes(result.compressedSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Savings:</span>
                    <span className="font-extrabold text-emerald-600">-{result.savingsPercent}% saved</span>
                  </div>
                </div>

                <button
                  onClick={() => saveAs(result.blob, `compressed_${files[0].name.replace(/\.[^/.]+$/, '')}.webm`)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compressed Video</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-xl p-8 text-center text-xs text-zinc-400">
                Adjust parameters on the left and click start to encode.
              </div>
            )}
          </div>
        </div>
      )}

      <ProcessingModal isOpen={processing} progress={progress} statusText={`Compressing video in-browser (${progress}%)...`} />
    </div>
  );
}
