'use client';

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, Trash2, RotateCw, Plus, ShieldCheck, CheckCircle2, HardDrive } from 'lucide-react';
import { StagedFile } from '@/types/pdf';
import { formatBytes, fileToArrayBuffer, renderPageToDataUrl } from '@/lib/pdf/core';
import { getFileBlob } from '@/lib/drive/drive-db';
import { getCloudFileBlob } from '@/lib/drive/cloud-api';
import { FileFormatThumbnail } from '@/components/FileFormatThumbnail';

interface FileDropzoneProps {
  files: StagedFile[];
  onFilesChange: (files: StagedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  renderThumbnails?: boolean;
}

export function FileDropzone({
  files,
  onFilesChange,
  accept = '.pdf,application/pdf',
  multiple = true,
  title = 'Select files',
  subtitle = 'or drop documents & files here',
  primaryColor = '#ef4444',
  renderThumbnails = true,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [loadingDriveFile, setLoadingDriveFile] = useState(false);
  const [driveFileName, setDriveFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedDriveIdRef = useRef<string | null>(null);

  const processFiles = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);
    if (!multiple && rawFiles.length > 0) {
      // Keep only first
      rawFiles.splice(1);
    }

    setLoadingThumbnails(true);
    const newStagedList: StagedFile[] = [];

    for (const f of rawFiles) {
      const id = `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const arrayBuf = await fileToArrayBuffer(f);

      let previewUrl = '';
      let pageCount = 1;

      if (renderThumbnails && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))) {
        try {
          const thumb = await renderPageToDataUrl(arrayBuf, 1, 0.4);
          previewUrl = thumb.dataUrl;
        } catch {
          // Fallback if preview render fails
        }
      } else if (f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|bmp|ico)$/i.test(f.name)) {
        previewUrl = URL.createObjectURL(f);
      }

      newStagedList.push({
        id,
        file: f,
        name: f.name,
        size: f.size,
        pageCount,
        previewUrl,
        arrayBuffer: arrayBuf,
        rotation: 0,
      });
    }

    setLoadingThumbnails(false);
    if (multiple) {
      onFilesChange([...files, ...newStagedList]);
    } else {
      onFilesChange(newStagedList);
    }
  };

  // Automatic Drive file pre-loading on mount if opened with ?driveId=...
  useEffect(() => {
    let isMounted = true;

    async function loadDriveFile() {
      if (typeof window === 'undefined') return;
      if (files.length > 0) return;

      const params = new URLSearchParams(window.location.search);
      const driveId = params.get('driveId') || params.get('fileId');
      const filenameParam = params.get('name');

      if (!driveId || loadedDriveIdRef.current === driveId) return;
      loadedDriveIdRef.current = driveId;

      const filename = filenameParam 
        ? decodeURIComponent(filenameParam) 
        : 'document.pdf';

      setDriveFileName(filename);
      setLoadingDriveFile(true);

      try {
        // 1. Try local IndexedDB
        let blob: Blob | null = await getFileBlob(driveId);

        // 2. Try Cloud API if not in local DB
        if (!blob) {
          blob = await getCloudFileBlob(driveId);
        }

        // 3. Fallback direct HTTP endpoint
        if (!blob) {
          try {
            const res = await fetch(`/api/drive/file/${driveId}`);
            if (res.ok) {
              blob = await res.blob();
            }
          } catch {}
        }

        if (!blob || !isMounted) return;

        const resolvedMime = blob.type || (filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
        const fileObj = new File([blob], filename, { type: resolvedMime });

        await processFiles([fileObj]);
      } catch (err) {
        console.error('Failed to auto-load file from Drive:', err);
      } finally {
        if (isMounted) setLoadingDriveFile(false);
      }
    }

    loadDriveFile();
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const rotateFile = (id: string) => {
    onFilesChange(
      files.map((f) =>
        f.id === id ? { ...f, rotation: ((f.rotation || 0) + 90) % 360 } : f
      )
    );
  };

  const moveFile = (dragIdx: number, dropIdx: number) => {
    const updated = [...files];
    const [dragged] = updated.splice(dragIdx, 1);
    updated.splice(dropIdx, 0, dragged);
    onFilesChange(updated);
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />

      {loadingDriveFile ? (
        /* Loading Drive File Stream State */
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 border-2 border-dashed border-rose-500/40 rounded-3xl bg-rose-50/20 dark:bg-rose-950/10 text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
            <HardDrive className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              Loading &quot;{driveFileName || 'Document'}&quot; from Drive...
            </h3>
            <p className="text-xs text-zinc-400 font-medium">
              Streaming file data directly into this studio workspace without re-uploading.
            </p>
          </div>
        </div>
      ) : files.length === 0 ? (
        /* Empty State Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center p-12 sm:p-16 border-2 border-dashed rounded-3xl cursor-pointer transition-[transform,border-color,background-color,box-shadow] duration-200 text-center ${
            isDragging
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 scale-[0.99]'
              : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 shadow-xs hover:shadow-xl'
          }`}
        >
          {/* Main Action Button */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:scale-105 group-hover:-translate-y-1 transition-transform duration-200 mb-6"
            style={{ backgroundColor: primaryColor }}
          >
            <UploadCloud className="w-10 h-10 stroke-[2.2]" />
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">
            {title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
            {subtitle}
          </p>

          <button
            type="button"
            className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg hover:shadow-xl btn-press cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            Choose Files
          </button>

          <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Files are encrypted and processed 100% locally in your browser</span>
          </div>
        </div>
      ) : (
        /* Staged Files View with Previews & Reordering */
        <div className="space-y-4 animate-stagger-fade">
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                {files.length} {files.length === 1 ? 'file' : 'files'} selected (
                {formatBytes(files.reduce((acc, f) => acc + f.size, 0))})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {multiple && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 btn-press cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                </button>
              )}

              <button
                onClick={() => onFilesChange([])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 btn-press cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Staged File Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((fileItem, idx) => (
              <div
                key={fileItem.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (!isNaN(dragIdx) && dragIdx !== idx) {
                    moveFile(dragIdx, idx);
                  }
                }}
                className="group relative flex flex-col p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-lg hover-lift transition-[transform,box-shadow,border-color] duration-150 hover:border-zinc-400 dark:hover:border-zinc-700 cursor-grab active:cursor-grabbing"
              >
                {/* Index badge */}
                <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-zinc-900/80 dark:bg-white/90 text-white dark:text-zinc-900 text-[10px] font-extrabold flex items-center justify-center shadow">
                  {idx + 1}
                </div>

                {/* Card Controls */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={() => rotateFile(fileItem.id)}
                    title="Rotate 90°"
                    className="p-1.5 rounded-lg bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-xs btn-press cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    title="Remove file"
                    className="p-1.5 rounded-lg bg-white/90 dark:bg-zinc-800/90 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 shadow-xs btn-press cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnail Preview */}
                <div className="w-full aspect-[3/4] rounded-xl bg-zinc-100 dark:bg-zinc-800/60 overflow-hidden flex items-center justify-center relative mb-2.5">
                  <FileFormatThumbnail
                    name={fileItem.name}
                    mimeType={fileItem.file?.type}
                    previewUrl={fileItem.previewUrl}
                    rotation={fileItem.rotation}
                  />
                </div>

                {/* File Metadata */}
                <div className="mt-auto">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title={fileItem.name}>
                    {fileItem.name}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {formatBytes(fileItem.size)}
                  </p>
                </div>
              </div>
            ))}

            {/* Quick add card */}
            {multiple && (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 aspect-[3/4] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 btn-press cursor-pointer"
              >
                <Plus className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold">Add File</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
