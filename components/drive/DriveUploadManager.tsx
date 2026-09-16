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
  Folder,
  RotateCw,
  Sparkles
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
  const failedFiles = uploads.filter((u) => u.status === 'error').length;
  const inProgressFiles = uploads.filter((u) => u.status === 'uploading' || u.status === 'assembling' || u.status === 'queued' || u.status === 'indexing');
  const activeSpeed = inProgressFiles.reduce((acc, u) => acc + (u.speedBytesPerSec || 0), 0);

  const totalBytes = uploads.reduce((acc, u) => acc + u.totalBytes, 0);
  const totalUploaded = uploads.reduce((acc, u) => acc + u.uploadedBytes, 0);
  const overallPercent = totalBytes > 0 ? Math.round((totalUploaded / totalBytes) * 100) : 0;

  const isAllComplete = completedFiles === totalFiles && totalFiles > 0;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-floating-dock">
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 bg-zinc-900 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isAllComplete 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : failedFiles > 0 && inProgressFiles.length === 0
              ? 'bg-rose-500/20 text-rose-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {isAllComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : failedFiles > 0 && inProgressFiles.length === 0 ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <UploadCloud className="w-4 h-4 animate-bounce" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate">
              {isAllComplete 
                ? `All ${totalFiles} Uploads Complete` 
                : failedFiles > 0 && inProgressFiles.length === 0
                ? `${completedFiles} of ${totalFiles} Uploaded (${failedFiles} Failed)`
                : failedFiles > 0
                ? `Uploading ${inProgressFiles.length} of ${totalFiles} (${failedFiles} failed)...`
                : `Uploading ${inProgressFiles.length} of ${totalFiles} files...`}
            </h4>
            {!isAllComplete && (
              <p className="text-[10px] text-zinc-400 font-mono">
                {formatBytes(totalUploaded)} / {formatBytes(totalBytes)} ({overallPercent}%)
                {activeSpeed > 0 ? ` • ${formatBytes(activeSpeed)}/s` : ''}
                {failedFiles > 0 ? ` • ${failedFiles} error${failedFiles > 1 ? 's' : ''}` : ''}
              </p>
            )}
            {isAllComplete && (
              <p className="text-[10px] text-zinc-400 font-mono">
                {formatBytes(totalBytes)} • Synchronized to Drive
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {failedFiles > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                chunkedUploader.retryAllFailed();
              }}
              className="px-2.5 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              title="Retry all failed uploads"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry ({failedFiles})</span>
            </button>
          )}

          <button 
            type="button" 
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer btn-press"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          
          {(isAllComplete || (inProgressFiles.length === 0 && failedFiles === 0)) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                chunkedUploader.clearCompleted();
              }}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer btn-press"
              title="Clear completed uploads"
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
            className={`h-full transition-all duration-300 ${
              failedFiles > 0 && inProgressFiles.length === 0
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
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
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate" title={item.relativePath || item.fileName}>
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
                  {item.status === 'indexing' && (
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-pulse" /> AI Indexing
                    </span>
                  )}
                  {item.status === 'uploading' && (
                    <button
                      onClick={() => chunkedUploader.pause(item.uploadId)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 transition-colors cursor-pointer"
                      title="Pause"
                    >
                      <Pause className="w-3 h-3" />
                    </button>
                  )}
                  {item.status === 'paused' && (
                    <button
                      onClick={() => chunkedUploader.resume(item.uploadId)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-amber-500 transition-colors cursor-pointer"
                      title="Resume"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  {item.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => chunkedUploader.retry(item.uploadId)}
                      className="px-2 py-0.5 bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 border border-rose-500/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Retry this file upload"
                    >
                      <RotateCw className="w-2.5 h-2.5" />
                      <span>Retry</span>
                    </button>
                  )}
                  <button
                    onClick={() => chunkedUploader.cancel(item.uploadId)}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove from queue"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Error Message Snippet */}
              {item.status === 'error' && (
                <div className="flex items-center gap-1 text-[10px] text-rose-500 dark:text-rose-400 font-medium truncate" title={item.error}>
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span className="truncate">{item.error || 'Upload failed. Click Retry to try again.'}</span>
                </div>
              )}

              {/* Progress bar per file */}
              <div className="space-y-1">
                <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-200 ${
                      item.status === 'completed' 
                        ? 'bg-emerald-500' 
                        : item.status === 'indexing'
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse'
                        : item.status === 'error' 
                        ? 'bg-rose-500' 
                        : item.status === 'paused'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>{formatBytes(item.fileSize)}</span>
                  <span>{item.status === 'error' ? 'Failed' : `${item.percentage}%`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
