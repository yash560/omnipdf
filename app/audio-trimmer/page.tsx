'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { trimAudio, extractWaveformPeaks } from '@/lib/media/audio-trimmer';
import { Activity, Download, Scissors, Play, Pause, Sparkles } from 'lucide-react';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';

export default function AudioTrimmerPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [fadeIn, setFadeIn] = useState<number>(0.5);
  const [fadeOut, setFadeOut] = useState<number>(0.5);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const p = await extractWaveformPeaks(newFiles[0].file, 80);
        setPeaks(p);
        const audio = new Audio(URL.createObjectURL(newFiles[0].file));
        audio.onloadedmetadata = () => {
          setTotalDuration(audio.duration);
          setEndTime(Math.min(30, audio.duration));
        };
      } catch (err: any) {
        console.error(err);
      } finally {
        setProcessing(false);
      }
    } else {
      setPeaks([]);
      setResultUrl(null);
      setResultBlob(null);
    }
  };

  const handleTrim = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const res = await trimAudio(files[0].file, {
        startTime,
        endTime,
        fadeInSeconds: fadeIn,
        fadeOutSeconds: fadeOut,
      });
      setResultUrl(res.dataUrl);
      setResultBlob(res.blob);
    } catch (err: any) {
      alert(`Audio trim failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-xs font-bold mb-3">
          <Activity className="w-3.5 h-3.5" />
          <span>Audio Waveform Trimmer • Zero Server Uploads</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Cut & Trim Audio with Visual Waveforms
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Cut audio clips, add smooth fade-in / fade-out transitions, and export high-res master WAV files.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="audio/*,video/*"
          multiple={false}
          title="Select or Drop an Audio Track"
          subtitle="Supports MP3, WAV, OGG, M4A, AAC"
          primaryColor="#8b5cf6"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-6">
          {/* Waveform Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              <span>Audio Waveform Peaks</span>
            </h2>

            {/* Waveform Visualizer Bars */}
            <div className="h-28 bg-zinc-950 rounded-xl p-3 flex items-center justify-between gap-1 mb-6 overflow-hidden">
              {peaks.map((p, idx) => {
                const fraction = idx / peaks.length;
                const timeAtIdx = fraction * (totalDuration || 1);
                const isSelected = timeAtIdx >= startTime && timeAtIdx <= endTime;

                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-full transition-all ${
                      isSelected ? 'bg-violet-500 shadow-sm shadow-violet-500/50' : 'bg-zinc-800'
                    }`}
                    style={{ height: `${Math.max(8, p * 100)}%` }}
                  />
                );
              })}
            </div>

            {/* Trimmer Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Start Time (s)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  End Time (s)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Fade In (s)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={fadeIn}
                  onChange={(e) => setFadeIn(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Fade Out (s)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={fadeOut}
                  onChange={(e) => setFadeOut(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleTrim}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Scissors className="w-4 h-4" />
              <span>Trim Audio Clip ({(endTime - startTime).toFixed(1)}s)</span>
            </button>
          </div>

          {/* Result Output */}
          {resultUrl && resultBlob && (
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Trimmed Audio Playback
              </h3>
              <audio src={resultUrl} controls className="w-full" />
              <button
                onClick={() => saveAs(resultBlob, `trimmed_${files[0].name.replace(/\.[^/.]+$/, '')}.wav`)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Trimmed Audio</span>
              </button>
            </div>
          )}
        </div>
      )}

      <ProcessingModal isOpen={processing} progress={50} statusText="Processing audio buffer..." />
    </div>
  );
}
