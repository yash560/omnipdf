'use client';

import React, { useState, useEffect } from 'react';
import { chunkedUploader } from '@/lib/drive/chunked-uploader';
import { ChunkUploadProgress } from '@/lib/drive/drive-types';
import { formatBytes } from '@/lib/drive/drive-helpers';
import { 
  ChevronUp, 
  ChevronDown, 
  X, 
  Pause, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  UploadCloud,
  FileText,
  Folder
} from 'lucide-react';

export function DriveUploadManager() {
  const [uploads, setUploads] = useState<ChunkUploadProgress[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    return chunkedUploader.subscribe((list) => {
      setUploads([...list]);
    });
  }, []);

  if (uploads.length === 0) return null;

  const totalFiles = uploads.length;
  const completedFiles = uploads.filter((u) => u.status === 'completed').length;
  const inProgressFiles = uploads.filter((u) => u.status === 'uploading' || u.status === 'assembling');
  const activeSpeed = inProgressFiles.reduce((acc, u) => acc + (u.speedBytesPerSec || 0), 0);

  const totalBytes = uploads.reduce((acc, u) => acc + u.totalBytes, 0);
  const totalUploaded = uploads.reduce((acc, u) => acc + u.uploadedBytes, 0);
  const overallPercent = totalBytes > 0 ? Math.round((totalUploaded / totalBytes) * 100) : 0;

  const isAllComplete = completedFiles === totalFiles;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-floating-dock">
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 bg-zinc-900 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            {isAllComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <UploadCloud className="w-4 h-4 animate-bounce" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">
              {isAllComplete 
                ? `All ${totalFiles} Uploads Complete` 
                : `Uploading ${inProgressFiles.length} of ${totalFiles} files...`}
            </h4>
            {!isAllComplete && (
              <p className="text-[10px] text-zinc-400 font-mono">
                {formatBytes(totalUploaded)} / {formatBytes(totalBytes)} ({overallPercent}%) • {formatBytes(activeSpeed)}/s
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            type="button" 
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer btn-press"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          {isAllComplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                chunkedUploader.clearCompleted();
              }}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer btn-press"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Global Progress Line */}
      {!isAllComplete && (
        <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800">
          <div 
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      )}

      {/* Expanded File List */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-2 space-y-1.5">
          {uploads.map((item) => (
            <div key={item.uploadId} className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {item.relativePath && item.relativePath.includes('/') ? (
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    {item.relativePath || item.fileName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.status === 'completed' && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  )}
                  {item.status === 'assembling' && (
                    <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Assembling
                    </span>
                  )}
                  {item.status === 'uploading' && (
                    <button
                      onClick={() => chunkedUploader.pause(item.uploadId)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 transition-colors"
                      title="Pause"
                    >
                      <Pause className="w-3 h-3" />
                    </button>
                  )}
                  {item.status === 'paused' && (
                    <button
                      onClick={() => chunkedUploader.resume(item.uploadId)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-amber-500 transition-colors"
                      title="Resume"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  {item.status === 'error' && (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1" title={item.error}>
                      <AlertCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                  <button
                    onClick={() => chunkedUploader.cancel(item.uploadId)}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress bar per file */}
              <div className="space-y-1">
                <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-200 ${
                      item.status === 'completed' 
                        ? 'bg-emerald-500' 
                        : item.status === 'error' 
                        ? 'bg-rose-500' 
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>{formatBytes(item.fileSize)}</span>
                  <span>{item.percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
