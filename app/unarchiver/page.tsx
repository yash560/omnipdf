'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { unpackArchive, ArchiveEntry } from '@/lib/archive/unarchiver';
import { FolderArchive, Download, FileText, Folder, Eye, Search } from 'lucide-react';
import saveAs from 'file-saver';
import { formatBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function UnarchiverPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const res = await unpackArchive(newFiles[0].file);
        setEntries(res);
        setSelectedEntry(res.find((e) => !e.isDir) || null);
      } catch (err: any) {
        alert(`Failed to extract archive: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    } else {
      setEntries([]);
      setSelectedEntry(null);
    }
  };

  const filtered = entries.filter((e) => e.path.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-3">
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Universal Archive Extractor • 100% Private On-Device Processing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Extract, Inspect & Download ZIP Archives
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Explore directory trees, preview embedded photos & code, and selectively download individual files.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept=".zip,.tar,.gz,.tgz,application/zip,application/x-zip-compressed"
          multiple={false}
          title="Select or Drop a ZIP Archive"
          subtitle="Supports .zip, .tar, .gz archives"
          primaryColor="#f97316"
        />
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* File Tree List */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Extracted Files ({entries.length})
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search archive contents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none"
              />
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {filtered.map((entry, idx) => (
                <button
                  key={idx}
                  onClick={() => !entry.isDir && setSelectedEntry(entry)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    selectedEntry?.path === entry.path
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {entry.isDir ? <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                    <span className="truncate">{entry.name}</span>
                  </div>
                  {!entry.isDir && <span className="text-[10px] text-zinc-400 shrink-0">{formatBytes(entry.size)}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* File Viewer Box */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {selectedEntry ? selectedEntry.path : 'Select a file to inspect'}
                  </h3>
                  {selectedEntry && <span className="text-[11px] text-zinc-400">{formatBytes(selectedEntry.size)}</span>}
                </div>

                {selectedEntry?.blob && (
                  <button
                    onClick={() => saveAs(selectedEntry.blob!, selectedEntry.name)}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                )}
              </div>

              {selectedEntry?.dataUrl && (
                <div className="flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl max-h-72 overflow-hidden">
                  <img src={selectedEntry.dataUrl} alt={selectedEntry.name} className="max-h-64 object-contain rounded-lg shadow-sm" />
                </div>
              )}

              {selectedEntry?.textContent !== undefined && (
                <textarea
                  readOnly
                  value={selectedEntry.textContent}
                  className="w-full h-72 p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none resize-none"
                />
              )}

              {!selectedEntry?.dataUrl && selectedEntry?.textContent === undefined && (
                <div className="p-8 text-center text-xs text-zinc-400">
                  Binary file format. Click download above to save to your device.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="archive"
          toolSlug="unarchiver"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          fileContext={`Archive: ${files[0]?.file.name} (${entries.length} files)\nFiles:\n${entries.map(e => `- ${e.path} (${e.isDir ? 'directory' : formatBytes(e.size)})`).join('\n')}`}
        />
      )}
    </div>
  );
}
