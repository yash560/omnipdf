'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { extractAudioTrack, AudioExtractOptions } from '@/lib/media/audio-extractor';
import { Volume2, Download, Sliders, CheckCircle2, Music, Sparkles } from 'lucide-react';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';

export default function AudioExtractorPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [sampleRate, setSampleRate] = useState<44100 | 48000 | 22050>(44100);
  const [channels, setChannels] = useState<1 | 2>(2);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    setResultUrl(null);
    setResultBlob(null);
  };

  const handleExtract = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const res = await extractAudioTrack(files[0].file, { sampleRate, channels });
      setResultUrl(res.dataUrl);
      setResultBlob(res.blob);
      setDuration(res.duration);
    } catch (err: any) {
      alert(`Audio extraction failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 text-xs font-bold mb-3">
          <Volume2 className="w-3.5 h-3.5" />
          <span>In-Browser Audio Extractor & Converter</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Extract Audio Tracks from Video
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Rip clean, uncompressed WAV audio from MP4, WebM, or MOV video files using Web Audio API.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="video/*,audio/*"
          multiple={false}
          title="Select or Drop a Video / Audio File"
          subtitle="Supports MP4, WebM, MOV, MP3, WAV, OGG"
          primaryColor="#14b8a6"
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-500" />
              <span>Audio Format Settings</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Sample Rate
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([44100, 48000, 22050] as const).map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSampleRate(rate)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      sampleRate === rate
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {rate / 1000} kHz
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Channels
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 2, label: 'Stereo (2 Ch)' },
                  { val: 1, label: 'Mono (1 Ch)' },
                ].map((ch) => (
                  <button
                    key={ch.val}
                    onClick={() => setChannels(ch.val as any)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      channels === ch.val
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExtract}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Music className="w-4 h-4" />
              <span>Extract Pure WAV Audio</span>
            </button>
          </div>

          {/* Audio Player and Download */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Decoded Audio Playback
            </h2>

            {resultUrl && resultBlob ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3">
                    Duration: {duration.toFixed(1)}s • Sample Rate: {sampleRate} Hz
                  </div>
                  <audio src={resultUrl} controls className="w-full" />
                </div>

                <button
                  onClick={() => saveAs(resultBlob, `${files[0].name.replace(/\.[^/.]+$/, '')}_audio.wav`)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Master WAV File</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-xl p-8 text-center text-xs text-zinc-400">
                Click Extract to render audio using Web Audio API.
              </div>
            )}
          </div>
        </div>
      )}

      <ProcessingModal isOpen={processing} progress={50} statusText="Decoding and extracting audio buffer..." />
    </div>
  );
}
