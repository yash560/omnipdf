'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { TableProperties, Download, Sparkles, CheckCircle2, Copy } from 'lucide-react';
import { exportToCsv, exportToExcel } from '@/lib/data/csv-matrix';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';

export default function AiTableExtractorPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [tableResult, setTableResult] = useState<{ headers: string[]; rows: any[] } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const file = newFiles[0].file;
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const res = await fetch('/api/ai/extract-table', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg' }),
          });

          if (!res.ok) throw new Error('AI table extraction failed');
          const data = await res.json();
          setTableResult(data);
          setProcessing(false);
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        alert(err.message);
        setProcessing(false);
      }
    } else {
      setTableResult(null);
    }
  };

  const downloadFile = (format: 'csv' | 'xlsx') => {
    if (!tableResult) return;
    const parsedData = { headers: tableResult.headers, rows: tableResult.rows, totalRows: tableResult.rows.length };
    const baseName = files[0]?.name.replace(/\.[^/.]+$/, '') || 'extracted_table';
    if (format === 'csv') {
      const csvStr = exportToCsv(parsedData);
      saveAs(new Blob([csvStr], { type: 'text/csv' }), `${baseName}.csv`);
    } else {
      const blob = exportToExcel(parsedData);
      saveAs(blob, `${baseName}.xlsx`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
          <TableProperties className="w-3.5 h-3.5" />
          <span>Vision AI Table Parser • Gemini 2.5 Flash</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Extract Tables & Receipts to Excel
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Upload photo receipts, invoices, or screenshot tables and let Gemini Vision convert them into clean editable spreadsheets.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="image/*,application/pdf"
          multiple={false}
          title="Select or Drop a Receipt / Table Image"
          subtitle="Supports JPG, PNG, Screenshots, Scans"
          primaryColor="#10b981"
        />
      </div>

      {tableResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Extracted {tableResult.rows.length} Table Rows</span>
              </h2>
              <p className="text-xs text-zinc-500">Ready to export to Excel XLSX or CSV</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => downloadFile('csv')}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => downloadFile('xlsx')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel XLSX</span>
              </button>
            </div>
          </div>

          {/* Grid Preview */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden font-mono text-xs">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    {tableResult.headers.map((h, i) => (
                      <th key={i} className="p-3 font-extrabold uppercase text-zinc-900 dark:text-white">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {tableResult.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      {tableResult.headers.map((h, cIdx) => (
                        <td key={cIdx} className="p-3 truncate max-w-[200px]">
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ProcessingModal isOpen={processing} progress={60} statusText="Gemini Vision is parsing table rows..." />
    </div>
  );
}
