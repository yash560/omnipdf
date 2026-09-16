'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Table,
  FileCode,
  ArrowRightLeft,
  Sliders,
  Database
} from 'lucide-react';

interface DataQuickStudioProps {
  blob: Blob;
  fileName: string;
  onProcessedBlobChange: (blob: Blob, newName: string, mimeType: string) => void;
}

export function DataQuickStudio({ blob, fileName, onProcessedBlobChange }: DataQuickStudioProps) {
  const [activeTab, setActiveTab] = useState<'clean' | 'convert' | 'markdown'>('clean');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Clean Options
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [trimSpaces, setTrimSpaces] = useState<boolean>(true);
  const [removeEmptyRows, setRemoveEmptyRows] = useState<boolean>(true);

  // Convert Options
  const [targetFormat, setTargetFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');

  // Load and Parse dataset
  useEffect(() => {
    async function parseDataset() {
      setLoading(true);
      try {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const arrayBuf = await blob.arrayBuffer();

        if (ext === 'json') {
          const text = new TextDecoder().decode(arrayBuf);
          const parsed = JSON.parse(text);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          if (list.length > 0) {
            const hdrs = Object.keys(list[0]);
            setHeaders(hdrs);
            setRows(list);
          }
          setTargetFormat('csv');
        } else {
          // Parse via XLSX (supports .csv, .tsv, .xlsx, .xls)
          const workbook = XLSX.read(arrayBuf, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

          if (json.length > 0) {
            const hdrs = Object.keys(json[0]);
            setHeaders(hdrs);
            setRows(json);
          }
          setTargetFormat(ext === 'csv' ? 'xlsx' : 'csv');
        }
      } catch (err) {
        console.error('Failed to parse dataset in Data Studio:', err);
      } finally {
        setLoading(false);
      }
    }

    parseDataset();
  }, [blob, fileName]);

  // Execute clean/convert operation
  const applyOperations = React.useCallback(() => {
    if (rows.length === 0 || headers.length === 0) return;

    let processedRows = [...rows];
    const baseName = fileName.replace(/\.[^/.]+$/, '');

    // 1. Remove empty rows
    if (removeEmptyRows) {
      processedRows = processedRows.filter((r) =>
        headers.some((h) => r[h] !== undefined && r[h] !== null && String(r[h]).trim() !== '')
      );
    }

    // 2. Trim whitespace
    if (trimSpaces) {
      processedRows = processedRows.map((r) => {
        const newR: Record<string, any> = {};
        headers.forEach((h) => {
          const v = r[h];
          newR[h] = typeof v === 'string' ? v.trim() : v;
        });
        return newR;
      });
    }

    // 3. Remove duplicates
    if (removeDuplicates) {
      const seen = new Set<string>();
      processedRows = processedRows.filter((r) => {
        const key = headers.map((h) => String(r[h] ?? '')).join('|||');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // 4. Export based on target format
    let outBlob: Blob;
    let outName: string;
    let outMime: string;

    if (activeTab === 'markdown') {
      let md = '| ' + headers.join(' | ') + ' |\n';
      md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      processedRows.forEach((r) => {
        md += '| ' + headers.map((h) => String(r[h] ?? '')).join(' | ') + ' |\n';
      });
      outBlob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      outName = `${baseName}_table.md`;
      outMime = 'text/markdown';
    } else if (targetFormat === 'json') {
      const jsonStr = JSON.stringify(processedRows, null, 2);
      outBlob = new Blob([jsonStr], { type: 'application/json' });
      outName = `${baseName}.json`;
      outMime = 'application/json';
    } else if (targetFormat === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(processedRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      outBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      outName = `${baseName}.xlsx`;
      outMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      // CSV export
      const ws = XLSX.utils.json_to_sheet(processedRows);
      const csvStr = XLSX.utils.sheet_to_csv(ws);
      outBlob = new Blob([csvStr], { type: 'text/csv;charset=utf-8' });
      outName = `${baseName}_cleaned.csv`;
      outMime = 'text/csv';
    }

    onProcessedBlobChange(outBlob, outName, outMime);
  }, [rows, headers, removeEmptyRows, trimSpaces, removeDuplicates, activeTab, targetFormat, fileName, onProcessedBlobChange]);

  useEffect(() => {
    applyOperations();
  }, [applyOperations]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-5 overflow-hidden select-none">
      {/* Live Data Grid Stage */}
      <div className="flex-1 bg-zinc-950/90 rounded-3xl border border-zinc-800 p-3 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono text-zinc-400">
          <span className="font-bold text-zinc-200">{rows.length} rows • {headers.length} columns</span>
          <span>Live In-Place Data View</span>
        </div>

        {/* Spreadsheet Table */}
        <div className="flex-1 overflow-auto my-2 rounded-xl border border-zinc-800 bg-zinc-900/60">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400 font-bold">
              Parsing Dataset...
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No data rows found in this file.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-zinc-300 font-sans border-collapse">
              <thead className="sticky top-0 bg-zinc-800 text-zinc-200 font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 border-b border-zinc-700 bg-zinc-800/90 font-mono text-zinc-500 w-12 text-center">#</th>
                  {headers.map((h) => (
                    <th key={h} className="p-2.5 border-b border-zinc-700 whitespace-nowrap bg-zinc-800/90">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {rows.slice(0, 50).map((r, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-2 font-mono text-zinc-500 text-center text-[10px]">{idx + 1}</td>
                    {headers.map((h) => (
                      <td key={h} className="p-2 whitespace-nowrap font-mono text-[11px] truncate max-w-xs">
                        {String(r[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > 50 && (
          <div className="text-3xs text-zinc-500 text-center pt-1 font-mono">
            Showing first 50 rows of {rows.length} total entries.
          </div>
        )}
      </div>

      {/* Control Sidebar */}
      <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shrink-0 overflow-y-auto">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('clean')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'clean' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Clean
          </button>
          <button
            onClick={() => setActiveTab('convert')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'convert' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Convert
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'markdown' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Markdown
          </button>
        </div>

        {/* Tab 1: Clean Data */}
        {activeTab === 'clean' && (
          <div className="space-y-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Automated Cleaning Rules
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">Remove Duplicate Rows</span>
                  <span className="text-[10px] text-zinc-400">De-duplicates identical data entries</span>
                </div>
                <input
                  type="checkbox"
                  checked={removeDuplicates}
                  onChange={(e) => setRemoveDuplicates(e.target.checked)}
                  className="rounded text-rose-500 accent-rose-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">Trim Whitespace</span>
                  <span className="text-[10px] text-zinc-400">Strips leading/trailing blank spaces</span>
                </div>
                <input
                  type="checkbox"
                  checked={trimSpaces}
                  onChange={(e) => setTrimSpaces(e.target.checked)}
                  className="rounded text-rose-500 accent-rose-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">Drop Empty Rows</span>
                  <span className="text-[10px] text-zinc-400">Removes blank non-content lines</span>
                </div>
                <input
                  type="checkbox"
                  checked={removeEmptyRows}
                  onChange={(e) => setRemoveEmptyRows(e.target.checked)}
                  className="rounded text-rose-500 accent-rose-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Convert Format */}
        {activeTab === 'convert' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Convert Data To:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'csv', label: 'CSV', desc: 'Comma Delimited' },
                  { id: 'xlsx', label: 'Excel', desc: '.xlsx Sheet' },
                  { id: 'json', label: 'JSON', desc: 'Array of Objects' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setTargetFormat(fmt.id as any)}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      targetFormat === fmt.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase">{fmt.label}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Markdown Table */}
        {activeTab === 'markdown' && (
          <div className="space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Markdown Table Generator
            </div>
            <p className="text-xs text-zinc-500">
              Exports table into formatted GitHub-flavored markdown syntax ready for documentation and notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
