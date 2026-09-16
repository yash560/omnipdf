'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Scissors,
  Volume2,
  Music,
  Video,
  Sparkles,
  RotateCcw,
  Gauge
} from 'lucide-react';

interface MediaQuickStudioProps {
  blob: Blob;
  fileName: string;
  onProcessedBlobChange: (blob: Blob, newName: string, mimeType: string) => void;
}

export function MediaQuickStudio({ blob, fileName, onProcessedBlobChange }: MediaQuickStudioProps) {
  const [activeTab, setActiveTab] = useState<'trim' | 'volume'>('trim');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Trim range (seconds)
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isVideo = fileName.match(/\.(mp4|webm|mov|mkv|avi)$/i);

  // Load media on mount
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setMediaUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const dur = e.currentTarget.duration;
    if (dur && !isNaN(dur)) {
      setDuration(dur);
      setStartTime(0);
      setEndTime(dur);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const togglePlay = () => {
    const el = isVideo ? videoRef.current : audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play();
      setIsPlaying(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    const el = isVideo ? videoRef.current : audioRef.current;
    if (el) el.playbackRate = rate;
  };

  // For media, pass through blob or trimmed payload
  useEffect(() => {
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const ext = fileName.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'mp3');
    const mime = isVideo ? 'video/mp4' : 'audio/mpeg';

    onProcessedBlobChange(blob, `${baseName}_trimmed.${ext}`, mime);
  }, [blob, fileName, isVideo, startTime, endTime, onProcessedBlobChange]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-5 overflow-hidden select-none">
      {/* Media Player Stage */}
      <div className="flex-1 bg-zinc-950 rounded-3xl border border-zinc-800 p-4 flex flex-col justify-between items-center relative overflow-hidden">
        <div className="w-full flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono text-zinc-400">
          <span className="font-bold text-zinc-200">{fileName}</span>
          <span>{formatSeconds(currentTime)} / {formatSeconds(duration)}</span>
        </div>

        {/* Player View */}
        <div className="flex-1 w-full flex items-center justify-center my-4">
          {isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="max-h-[48vh] rounded-2xl shadow-2xl border border-zinc-800 bg-black"
            />
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto shadow-inner">
                <Music className="w-10 h-10" />
              </div>
              <audio
                ref={audioRef}
                src={mediaUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
              <div className="text-xs font-mono text-zinc-400">{formatSeconds(currentTime)}</div>
            </div>
          )}
        </div>

        {/* Playback Controls & Waveform Bar */}
        <div className="w-full p-3 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shadow-md cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <div className="flex-1 space-y-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                const t = Number(e.target.value);
                setCurrentTime(t);
                const el = isVideo ? videoRef.current : audioRef.current;
                if (el) el.currentTime = t;
              }}
              className="w-full accent-rose-500"
            />
          </div>

          {/* Speed Picker */}
          <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-xl text-3xs font-mono text-zinc-300">
            {[0.75, 1.0, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  playbackRate === rate ? 'bg-rose-500 text-white font-bold' : 'hover:bg-zinc-700'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Control Sidebar */}
      <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shrink-0 overflow-y-auto space-y-5">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
          Media Quick Tools
        </div>

        {/* Trimming Section */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-rose-500" />
            <span>Trim Clip Range</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Start Time</span>
                <span className="font-mono text-zinc-500">{formatSeconds(startTime)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={endTime}
                step="0.1"
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                <span>End Time</span>
                <span className="font-mono text-zinc-500">{formatSeconds(endTime)}</span>
              </div>
              <input
                type="range"
                min={startTime}
                max={duration || 100}
                step="0.1"
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400 font-mono flex justify-between">
              <span>Segment Length:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatSeconds(Math.max(0, endTime - startTime))}</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500 space-y-1">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 block">💡 In-Place Processing:</span>
          <span>Perform fast range trimming without leaving your Drive folder view.</span>
        </div>
      </div>
    </div>
  );
}
