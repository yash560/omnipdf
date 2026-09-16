'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { useDrive } from '@/lib/drive/drive-context';
import {
  Archive,
  FolderPlus,
  File as FileIcon,
  Folder,
  Download,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatBytes } from '@/lib/drive/drive-helpers';

interface ArchiveQuickStudioProps {
  blob: Blob;
  fileName: string;
  onProcessedBlobChange: (blob: Blob, newName: string, mimeType: string) => void;
}

interface ZipEntry {
  path: string;
  name: string;
  isDir: boolean;
  size: number;
  date: Date;
}

export function ArchiveQuickStudio({ blob, fileName, onProcessedBlobChange }: ArchiveQuickStudioProps) {
  const { currentFolderId, createFolder, uploadFiles, refreshDrive } = useDrive();
  const [entries, setEntries] = useState<ZipEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);

  // Parse ZIP on mount
  useEffect(() => {
    async function loadZip() {
      setLoading(true);
      try {
        const zip = new JSZip();
        const zipDoc = await zip.loadAsync(blob);
        const parsed: ZipEntry[] = [];

        zipDoc.forEach((relativePath, file) => {
          parsed.push({
            path: relativePath,
            name: relativePath.split('/').filter(Boolean).pop() || relativePath,
            isDir: file.dir,
            size: (file as any)._data?.uncompressedSize || 0,
            date: file.date,
          });
        });

        setEntries(parsed);
      } catch (err) {
        console.error('Failed to parse ZIP in Quick Studio:', err);
      } finally {
        setLoading(false);
      }
    }

    loadZip();
  }, [blob]);

  // Unpack all files into a new Drive folder
  const handleExtractToDriveFolder = async () => {
    setExtracting(true);
    try {
      const folderName = fileName.replace(/\.[^/.]+$/, '') + '_extracted';
      const createdFolder = await createFolder(folderName, 'indigo');

      const zip = new JSZip();
      const zipDoc = await zip.loadAsync(blob);
      const filesToUpload: File[] = [];

      for (const [path, zipObj] of Object.entries(zipDoc.files)) {
        if (!zipObj.dir) {
          const fileBlob = await zipObj.async('blob');
          const cleanName = path.split('/').filter(Boolean).pop() || 'file';
          filesToUpload.push(new File([fileBlob], cleanName, { type: fileBlob.type || 'application/octet-stream' }));
        }
      }

      if (filesToUpload.length > 0) {
        // Upload into created folder
        const { uploadCloudFiles } = await import('@/lib/drive/cloud-api');
        await uploadCloudFiles(filesToUpload, createdFolder.id);
        setExtractedCount(filesToUpload.length);
        await refreshDrive({ silent: true });
      }
    } catch (err) {
      console.error('Extraction to Drive failed:', err);
      alert('Failed to unpack archive into Drive.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-5 overflow-hidden select-none">
      {/* Archive File Manifest Stage */}
      <div className="flex-1 bg-zinc-950/90 rounded-3xl border border-zinc-800 p-4 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono text-zinc-400">
          <span className="font-bold text-zinc-200">{fileName}</span>
          <span>{entries.length} items in archive</span>
        </div>

        {/* File Table */}
        <div className="flex-1 overflow-auto my-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2 space-y-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400 font-bold">
              Inspecting Archive Manifest...
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              Empty archive.
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/60 text-xs text-zinc-300 font-mono transition-colors"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {entry.isDir ? (
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                  <span className="truncate">{entry.path}</span>
                </div>
                <span className="text-[11px] text-zinc-500 shrink-0">
                  {entry.isDir ? 'Folder' : formatBytes(entry.size)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Control Sidebar */}
      <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shrink-0 overflow-y-auto space-y-5">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
          Archive Operations
        </div>

        {extractedCount !== null ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              Successfully Unpacked!
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-400">
              {extractedCount} files have been extracted into a newly created folder in your current Drive view.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleExtractToDriveFolder}
              disabled={extracting || loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{extracting ? 'Unpacking into Drive...' : 'Extract All to New Drive Folder'}</span>
            </button>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500 space-y-1">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block">📦 Automatic Cloud Unpacking:</span>
              <span>All files and nested directory trees inside this archive will be extracted and placed in a dedicated folder in your current Drive location.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
