'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { splitFile, joinFileParts, SplitManifest } from '@/lib/archive/file-splitter';
import { Split, Download, Sliders, CheckCircle2, Binary, Sparkles, Layers } from 'lucide-react';
import saveAs from 'file-saver';
import { formatBytes } from '@/lib/pdf/core';

export default function FileSplitterPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [tab, setTab] = useState<'split' | 'join'>('split');
  const [chunkSizeMb, setChunkSizeMb] = useState<number>(25);
  const [manifest, setManifest] = useState<SplitManifest | null>(null);
  const [joinedBlob, setJoinedBlob] = useState<Blob | null>(null);
  const [joinedName, setJoinedName] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    setManifest(null);
    setJoinedBlob(null);

    if (newFiles.length > 0 && tab === 'split') {
      const bytes = chunkSizeMb * 1024 * 1024;
      const res = await splitFile(newFiles[0].file, bytes);
      setManifest(res);
    } else if (newFiles.length > 0 && tab === 'join') {
      const rawFiles = newFiles.map((f) => f.file);
      const res = await joinFileParts(rawFiles);
      setJoinedBlob(res.blob);
      setJoinedName(res.fileName);
    }
  };

  const handleChunkChange = async (val: number) => {
    setChunkSizeMb(val);
    if (files.length > 0 && tab === 'split') {
      const bytes = val * 1024 * 1024;
      const res = await splitFile(files[0].file, bytes);
      setManifest(res);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
          <Split className="w-3.5 h-3.5" />
          <span>Large File Splitter & Joiner</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Split & Join Massive Files with Byte Integrity
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Split large ISOs, videos, or archives into 25MB email / Discord chunks and rejoin them intact.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => {
            setTab('split');
            setFiles([]);
            setManifest(null);
          }}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'split'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Split Large File into Chunks
        </button>
        <button
          onClick={() => {
            setTab('join');
            setFiles([]);
            setJoinedBlob(null);
          }}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'join'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Join .part Chunks back together
        </button>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="*/*"
          multiple={tab === 'join'}
          title={tab === 'split' ? 'Select or Drop a Large File to Split' : 'Drop All .part Files to Re-Join'}
          subtitle={tab === 'split' ? 'Split by exact MB size' : 'Select all chunk files simultaneously'}
          primaryColor="#059669"
        />
      </div>

      {tab === 'split' && manifest && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Split into {manifest.totalChunks} Chunks
              </h2>
              <p className="text-xs text-zinc-500">
                Total Size: {formatBytes(manifest.originalSize)} ({manifest.totalChunks} × ~{chunkSizeMb} MB)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[10, 25, 50, 100].map((mb) => (
                <button
                  key={mb}
                  onClick={() => handleChunkChange(mb)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chunkSizeMb === mb
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {mb} MB
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {manifest.chunks.map((chunk) => (
              <div
                key={chunk.index}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs"
              >
                <div className="truncate font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {chunk.fileName}
                </div>
                <button
                  onClick={() => saveAs(chunk.blob, chunk.fileName)}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] shrink-0 ml-2"
                >
                  Download ({formatBytes(chunk.size)})
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'join' && joinedBlob && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chunks Re-Joined Successfully</span>
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {joinedName} ({formatBytes(joinedBlob.size)})
          </h2>
          <button
            onClick={() => saveAs(joinedBlob, joinedName)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Reconstructed File</span>
          </button>
        </div>
      )}
    </div>
  );
}
