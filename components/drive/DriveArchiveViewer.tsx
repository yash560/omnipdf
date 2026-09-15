'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { formatBytes } from '@/lib/drive/drive-helpers';
import { 
  Folder, 
  FileText, 
  Download, 
  Archive, 
  Search, 
  ChevronRight, 
  Loader2 
} from 'lucide-react';

interface ArchiveEntry {
  name: string;
  path: string;
  isDir: boolean;
  uncompressedSize: number;
  date: Date;
}

export function DriveArchiveViewer({ blob }: { blob: Blob }) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [zipInstance, setZipInstance] = useState<JSZip | null>(null);

  useEffect(() => {
    async function parseZip() {
      setLoading(true);
      setError(null);
      try {
        const zip = new JSZip();
        const loaded = await zip.loadAsync(blob);
        setZipInstance(loaded);

        const list: ArchiveEntry[] = [];
        loaded.forEach((relativePath, file) => {
          list.push({
            name: relativePath.split('/').filter(Boolean).pop() || relativePath,
            path: relativePath,
            isDir: file.dir,
            uncompressedSize: (file as any)._data?.uncompressedSize || 0,
            date: file.date,
          });
        });

        // Sort: folders first, then alphabetically
        list.sort((a, b) => {
          if (a.isDir === b.isDir) return a.path.localeCompare(b.path);
          return a.isDir ? -1 : 1;
        });

        setEntries(list);
      } catch (err: any) {
        setError(err.message || 'Failed to parse ZIP archive');
      } finally {
        setLoading(false);
      }
    }

    parseZip();
  }, [blob]);

  const handleExtractSingle = async (path: string, name: string) => {
    if (!zipInstance) return;
    const file = zipInstance.file(path);
    if (!file) return;

    const fileBlob = await file.async('blob');
    saveAs(fileBlob, name);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-xs font-bold">Inspecting Archive Contents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-xs text-rose-500 font-bold">
        {error}
      </div>
    );
  }

  const filtered = entries.filter((e) =>
    e.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Search Header */}
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
          <Archive className="w-4 h-4 text-amber-500" />
          <span>Archive Contents ({entries.length} files)</span>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archive files..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-hidden"
          />
        </div>
      </div>

      {/* File Table */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {filtered.map((item) => (
          <div
            key={item.path}
            className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 flex items-center justify-between gap-3 text-xs transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {item.isDir ? (
                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
              )}
              <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate">
                {item.path}
              </span>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {!item.isDir && (
                <span className="text-[11px] text-zinc-400 font-mono">
                  {formatBytes(item.uncompressedSize)}
                </span>
              )}
              {!item.isDir && (
                <button
                  onClick={() => handleExtractSingle(item.path, item.name)}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
                  title="Extract this file"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
