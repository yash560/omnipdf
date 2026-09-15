'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { createZipArchive } from '@/lib/archive/zip-creator';
import { FileArchive, Download, Sliders, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import saveAs from 'file-saver';
import { formatBytes } from '@/lib/pdf/core';
import { ProcessingModal } from '@/components/ProcessingModal';

export default function ZipCreatorPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [zipName, setZipName] = useState('archive.zip');
  const [compressionLevel, setCompressionLevel] = useState<number>(6);
  const [processing, setProcessing] = useState(false);

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const handleCreateZip = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const items = files.map((f) => ({ file: f.file }));
      const res = await createZipArchive(items, {
        compressionLevel,
        zipName: zipName.endsWith('.zip') ? zipName : `${zipName}.zip`,
      });
      saveAs(res.blob, zipName.endsWith('.zip') ? zipName : `${zipName}.zip`);
    } catch (err: any) {
      alert(`ZIP creation failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-3">
          <FileArchive className="w-3.5 h-3.5" />
          <span>Universal ZIP Creator • Client-Side Compression</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Package Multiple Files into a ZIP
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Bundle documents, photos, and folders with configurable DEFLATE compression levels.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          accept="*/*"
          multiple={true}
          title="Select or Drop Files to Bundle"
          subtitle="Add any number of files or folders"
          primaryColor="#6366f1"
        />
      </div>

      {files.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Archive Configuration</span>
            </h2>
            <span className="text-xs font-semibold text-zinc-500">
              {files.length} Files ({formatBytes(totalSize)})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Output ZIP Filename
              </label>
              <input
                type="text"
                value={zipName}
                onChange={(e) => setZipName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span>Compression Level: {compressionLevel === 0 ? 'Store (Fastest)' : `Deflate ${compressionLevel}`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="9"
                value={compressionLevel}
                onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleCreateZip}
            disabled={processing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download ZIP Archive</span>
          </button>
        </div>
      )}

      <ProcessingModal isOpen={processing} progress={60} statusText="Building compressed ZIP archive..." />
    </div>
  );
}
