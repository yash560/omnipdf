'use client';

import React, { useState, useEffect } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { getCloudFileBlob } from '@/lib/drive/cloud-api';
import { getFileBlob } from '@/lib/drive/drive-db';
import { formatBytes } from '@/lib/drive/drive-helpers';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Download,
  Save,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  FileCode,
  Music,
  Archive,
  Wrench,
  ShieldCheck
} from 'lucide-react';

import { ImageQuickStudio } from './ImageQuickStudio';
import { PdfQuickStudio } from './PdfQuickStudio';
import { DataQuickStudio } from './DataQuickStudio';
import { TextQuickStudio } from './TextQuickStudio';
import { MediaQuickStudio } from './MediaQuickStudio';
import { ArchiveQuickStudio } from './ArchiveQuickStudio';

export function DriveQuickToolsModal() {
  const {
    quickToolsItem,
    closeQuickTools,
    replaceItemContent,
    saveAsNewFile,
  } = useDrive();

  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Processed Output from Child Studio
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [outputName, setOutputName] = useState<string>('');
  const [outputMime, setOutputMime] = useState<string>('');

  // Load original blob on modal open
  useEffect(() => {
    if (!quickToolsItem) {
      setBlob(null);
      setProcessedBlob(null);
      setSuccessMessage(null);
      return;
    }

    let isMounted = true;
    async function loadItemData() {
      setLoading(true);
      setSuccessMessage(null);
      try {
        const fetched = (await getCloudFileBlob(quickToolsItem!.id)) || (await getFileBlob(quickToolsItem!.id));
        if (isMounted) {
          setBlob(fetched);
          setProcessedBlob(fetched);
          setOutputName(quickToolsItem!.name);
          setOutputMime(quickToolsItem!.mimeType);
        }
      } catch (err) {
        console.error('Failed to load blob for Quick Tools:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadItemData();

    return () => {
      isMounted = false;
    };
  }, [quickToolsItem]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) closeQuickTools();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeQuickTools, saving]);

  if (!quickToolsItem) return null;

  const handleProcessedBlobChange = (newBlob: Blob, newName: string, mimeType: string) => {
    setProcessedBlob(newBlob);
    setOutputName(newName);
    setOutputMime(mimeType);
  };

  const handleSaveAsCopy = async () => {
    if (!processedBlob || !quickToolsItem) return;
    setSaving(true);
    try {
      await saveAsNewFile(outputName, processedBlob, outputMime, quickToolsItem.parentId);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      setSuccessMessage(`Saved "${outputName}" as a new file in Drive!`);
      setTimeout(() => {
        closeQuickTools();
      }, 1400);
    } catch (err: any) {
      console.error('Save copy failed:', err);
      alert('Failed to save file in Drive: ' + (err.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceOriginal = async () => {
    if (!processedBlob || !quickToolsItem) return;
    setSaving(true);
    try {
      await replaceItemContent(quickToolsItem.id, processedBlob, outputName, outputMime);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
      setSuccessMessage(`Replaced original "${quickToolsItem.name}" with updated content!`);
      setTimeout(() => {
        closeQuickTools();
      }, 1400);
    } catch (err: any) {
      console.error('Replace original failed:', err);
      alert('Failed to replace original file in Drive: ' + (err.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadOnly = () => {
    if (!processedBlob) return;
    saveAs(processedBlob, outputName || quickToolsItem.name);
  };

  const isCodeOrText =
    quickToolsItem.category === 'code' ||
    quickToolsItem.category === 'document' ||
    quickToolsItem.mimeType.startsWith('text/') ||
    ['txt', 'md', 'json', 'ts', 'tsx', 'js', 'jsx', 'py', 'html', 'css', 'yaml', 'yml', 'sql'].includes(quickToolsItem.extension);

  const isSpreadsheet =
    quickToolsItem.category === 'spreadsheet' ||
    ['csv', 'xlsx', 'xls', 'tsv'].includes(quickToolsItem.extension);

  const isArchive =
    quickToolsItem.category === 'archive' ||
    ['zip', 'tar', 'gz', '7z', 'rar'].includes(quickToolsItem.extension);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-6xl h-[92vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-rose-500/20 shrink-0">
              <Wrench className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                  {quickToolsItem.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase">
                  In-Place Studio
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                {formatBytes(quickToolsItem.size)} • {quickToolsItem.category.toUpperCase()} • 100% Private On-Device Processing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={closeQuickTools}
              disabled={saving}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Body Canvas */}
        <div className="flex-1 overflow-hidden p-4 bg-zinc-100 dark:bg-zinc-950/50">
          {loading || !blob ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
              <span className="w-4 h-4 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold">Streaming File into Studio Memory...</span>
            </div>
          ) : quickToolsItem.category === 'image' ? (
            <ImageQuickStudio
              blob={blob}
              fileName={quickToolsItem.name}
              onProcessedBlobChange={handleProcessedBlobChange}
            />
          ) : quickToolsItem.category === 'pdf' ? (
            <PdfQuickStudio
              blob={blob}
              fileName={quickToolsItem.name}
              onProcessedBlobChange={handleProcessedBlobChange}
            />
          ) : isSpreadsheet ? (
            <DataQuickStudio
              blob={blob}
              fileName={quickToolsItem.name}
              onProcessedBlobChange={handleProcessedBlobChange}
            />
          ) : isCodeOrText ? (
            <TextQuickStudio
              blob={blob}
              fileName={quickToolsItem.name}
              onProcessedBlobChange={handleProcessedBlobChange}
            />
          ) : quickToolsItem.category === 'media' ? (
            <MediaQuickStudio
              blob={blob}
              fileName={quickToolsItem.name}
              onProcessedBlobChange={handleProcessedBlobChange}
            />
          ) : isArchive ? (
            <ArchiveQuickStudio
              blob={blob}
              fileName={quickToolsItem.name}
              onProcessedBlobChange={handleProcessedBlobChange}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
              Specialized in-place studio is not yet available for this binary format.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {successMessage ? (
              <span className="text-emerald-500 font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMessage}</span>
              </span>
            ) : (
              <span>
                Output Ready: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{outputName || quickToolsItem.name}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadOnly}
              disabled={saving || !processedBlob}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={handleSaveAsCopy}
              disabled={saving || !processedBlob}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Copy to Drive</span>
            </button>

            <button
              onClick={handleReplaceOriginal}
              disabled={saving || !processedBlob}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Syncing...' : 'Replace Original in Drive'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
