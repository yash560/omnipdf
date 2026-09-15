'use client';

import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  RotateCw,
  Gauge,
  Music
} from 'lucide-react';

interface DriveMediaPlayerProps {
  src: string;
  type: 'video' | 'audio';
  name: string;
}

export function DriveMediaPlayer({ src, type, name }: DriveMediaPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    setCurrentTime(mediaRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!mediaRef.current) return;
    setDuration(mediaRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = speed;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-black text-white items-center justify-center p-4">
      {type === 'video' ? (
        <div className="relative max-h-[70vh] w-full max-w-4xl flex items-center justify-center">
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-auto max-h-[65vh] rounded-2xl shadow-2xl object-contain bg-zinc-950"
          />
        </div>
      ) : (
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col items-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-rose-500/20">
            <Music className="w-12 h-12 animate-pulse" />
          </div>

          <div className="text-center space-y-1">
            <h4 className="text-base font-extrabold text-white truncate max-w-xs">{name}</h4>
            <p className="text-xs text-zinc-400 font-mono">Audio Track</p>
          </div>

          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={src}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />

          {/* Timeline */}
          <div className="w-full space-y-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (mediaRef.current) mediaRef.current.currentTime -= 10;
              }}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (mediaRef.current) mediaRef.current.currentTime += 10;
              }}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Speed Selector */}
      <div className="mt-4 flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-300">
        <Gauge className="w-3.5 h-3.5 text-rose-400" />
        <span className="text-[11px] text-zinc-500">Speed:</span>
        {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
          <button
            key={s}
            onClick={() => handleSpeedChange(s)}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              playbackRate === s ? 'bg-rose-500 text-white' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
