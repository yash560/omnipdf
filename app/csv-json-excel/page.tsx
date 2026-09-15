'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import {
  parseCsvText,
  parseJsonText,
  parseExcelBuffer,
  exportToCsv,
  exportToExcel,
  exportToJson,
  ParsedTableData,
} from '@/lib/data/csv-matrix';
import { Table, Download, FileSpreadsheet, Sparkles, Sliders, CheckCircle2, ArrowRight } from 'lucide-react';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function CsvJsonExcelPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [data, setData] = useState<ParsedTableData | null>(null);
  const [targetFormat, setTargetFormat] = useState<'csv' | 'json' | 'xlsx'>('xlsx');
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      const file = newFiles[0].file;
      try {
        let parsed: ParsedTableData;
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const buf = await file.arrayBuffer();
          parsed = parseExcelBuffer(buf);
          setTargetFormat('csv');
        } else if (file.name.endsWith('.json') || file.type === 'application/json') {
          const text = await file.text();
          parsed = parseJsonText(text);
          setTargetFormat('xlsx');
        } else {
          // CSV / TSV
          const text = await file.text();
          parsed = parseCsvText(text);
          setTargetFormat('xlsx');
        }
        setData(parsed);
      } catch (err: any) {
        alert(`Failed to parse spreadsheet file: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    } else {
      setData(null);
    }
  };

  const handleExport = () => {
    if (!data || data.rows.length === 0) return;
    const baseName = files[0]?.name.replace(/\.[^/.]+$/, '') || 'export';

    if (targetFormat === 'xlsx') {
      const blob = exportToExcel(data);
      saveAs(blob, `${baseName}.xlsx`);
    } else if (targetFormat === 'csv') {
      const csvStr = exportToCsv(data);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${baseName}.csv`);
    } else if (targetFormat === 'json') {
      const jsonStr = exportToJson(data);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      saveAs(blob, `${baseName}.json`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
          <Table className="w-3.5 h-3.5" />
          <span>Universal Data Matrix • CSV ↔ JSON ↔ Excel</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Spreadsheet & Matrix Converter
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Convert seamlessly between CSV, Excel XLSX, and JSON with auto-delimiter detection and live table preview.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept=".csv,.tsv,.json,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/json"
          multiple={false}
          title="Select or Drop CSV, JSON, or Excel"
          subtitle="Supports .csv, .tsv, .xlsx, .xls, .json"
          primaryColor="#10b981"
        />
      </div>

      {data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Conversion Bar */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Parsed {data.totalRows} Rows across {data.headers.length} Columns</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Select your desired target output format:</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                {(['xlsx', 'csv', 'json'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setTargetFormat(fmt)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      targetFormat === fmt
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    .{fmt}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExport}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-[0.99] whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Export .{targetFormat.toUpperCase()}</span>
              </button>
            </div>
          </div>

          {/* Interactive Data Grid Table */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs font-bold text-zinc-600 dark:text-zinc-400">
              <span>Data Grid Preview (Showing first 25 rows)</span>
              <span>{data.totalRows} total entries</span>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs text-zinc-800 dark:text-zinc-200">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 sticky top-0 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3 font-bold text-zinc-400 w-12 text-center">#</th>
                    {data.headers.map((h, i) => (
                      <th key={i} className="p-3 font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                  {data.rows.slice(0, 25).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 text-center text-zinc-400 font-sans">{rIdx + 1}</td>
                      {data.headers.map((h, cIdx) => (
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

          {/* AI Assistant Banner */}
          <ToolAIAssistantBanner
            suite="data"
            toolSlug="csv-json-excel"
            fileName={files[0]?.file.name}
            fileSize={files[0]?.file.size}
            fileContext={data ? `Headers: ${data.headers.join(', ')}\nSample rows (${Math.min(data.rows.length, 10)}):\n${JSON.stringify(data.rows.slice(0, 10), null, 2)}` : undefined}
          />
        </div>
      )}
    </div>
  );
}
