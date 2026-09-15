'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Search, Download, Table, Loader2 } from 'lucide-react';
import saveAs from 'file-saver';

export function DriveSpreadsheetViewer({ blob, fileName }: { blob: Blob; fileName: string }) {
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadSpreadsheet() {
      setLoading(true);
      setError(null);
      try {
        const buffer = await blob.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const sheetNames = workbook.SheetNames || [];
        setSheets(sheetNames);

        if (sheetNames.length > 0) {
          const firstSheet = sheetNames[0];
          setActiveSheet(firstSheet);
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          setData(jsonData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to parse spreadsheet file');
      } finally {
        setLoading(false);
      }
    }

    loadSpreadsheet();
  }, [blob]);

  const handleSheetChange = async (sheetName: string) => {
    setActiveSheet(sheetName);
    try {
      const buffer = await blob.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      setData(jsonData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(csvBlob, `${fileName.replace(/\.[^/.]+$/, '')}_exported.csv`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-bold">Rendering Spreadsheet Data Grid...</p>
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

  const headers = data[0] || [];
  const rows = data.slice(1);

  const filteredRows = search.trim()
    ? rows.filter((row) =>
        row.some((cell) => String(cell || '').toLowerCase().includes(search.toLowerCase()))
      )
    : rows;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
            <Table className="w-4 h-4 text-emerald-500" />
            <span>{rows.length} Rows • {headers.length} Columns</span>
          </div>

          {/* Sheet tabs */}
          {sheets.length > 1 && (
            <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl">
              {sheets.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSheetChange(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeSheet === s
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search table values..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-hidden"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-extrabold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-extrabold">
            <tr>
              <th className="px-3 py-2 w-12 text-center text-zinc-400 font-mono text-[10px] border-r border-zinc-200 dark:border-zinc-700">
                #
              </th>
              {headers.map((h: any, i: number) => (
                <th
                  key={i}
                  className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-700 truncate max-w-xs"
                >
                  {String(h || `Column ${i + 1}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono">
            {filteredRows.map((row: any[], rIdx: number) => (
              <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                <td className="px-3 py-1.5 text-center text-zinc-400 text-[10px] bg-zinc-50/50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800">
                  {rIdx + 1}
                </td>
                {headers.map((_: any, cIdx: number) => (
                  <td
                    key={cIdx}
                    className="px-3 py-1.5 border-r border-zinc-100 dark:border-zinc-800/60 truncate max-w-xs text-zinc-800 dark:text-zinc-200"
                  >
                    {String(row[cIdx] !== undefined ? row[cIdx] : '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
