'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { parseCsvText, exportToCsv, exportToExcel, ParsedTableData } from '@/lib/data/csv-matrix';
import { cleanTabularData, CleanOptions, CleanReport } from '@/lib/data/csv-cleaner';
import { Sparkles, Download, CheckCircle2, Sliders, Filter, Trash2 } from 'lucide-react';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function CsvCleanerPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [originalData, setOriginalData] = useState<ParsedTableData | null>(null);
  const [cleanedData, setCleanedData] = useState<ParsedTableData | null>(null);
  const [report, setReport] = useState<CleanReport | null>(null);

  const [options, setOptions] = useState<CleanOptions>({
    trimWhitespace: true,
    removeDuplicateRows: true,
    removeEmptyRows: true,
    textTransform: 'trim',
    standardizeDates: true,
    fillNullValue: '',
  });

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      const text = await newFiles[0].file.text();
      const parsed = parseCsvText(text);
      setOriginalData(parsed);
      runCleaning(parsed, options);
    } else {
      setOriginalData(null);
      setCleanedData(null);
      setReport(null);
    }
  };

  const runCleaning = (data: ParsedTableData, opts: CleanOptions) => {
    const res = cleanTabularData(data, opts);
    setCleanedData(res.cleaned);
    setReport(res.report);
  };

  const updateOption = (key: keyof CleanOptions, val: any) => {
    const next = { ...options, [key]: val };
    setOptions(next);
    if (originalData) {
      runCleaning(originalData, next);
    }
  };

  const handleDownload = (format: 'csv' | 'xlsx') => {
    if (!cleanedData) return;
    const baseName = files[0]?.name.replace(/\.[^/.]+$/, '') || 'cleaned';
    if (format === 'csv') {
      const csvStr = exportToCsv(cleanedData);
      saveAs(new Blob([csvStr], { type: 'text/csv' }), `cleaned_${baseName}.csv`);
    } else {
      const blob = exportToExcel(cleanedData);
      saveAs(blob, `cleaned_${baseName}.xlsx`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CSV Cleaner & Deduplicator • 100% Client-Side</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Clean, Sanitize & Deduplicate CSV Datasets
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Strip accidental spaces, remove duplicates, normalize ISO dates, fill blanks, and format messy spreadsheets.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept=".csv,.tsv,text/csv"
          multiple={false}
          title="Select or Drop a CSV File"
          subtitle="Supports CSV and TSV formatted datasets"
          primaryColor="#0284c7"
        />
      </div>

      {originalData && report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Cleaning Rules Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-500" />
              <span>Active Cleaning Rules</span>
            </h2>

            <div className="space-y-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.trimWhitespace}
                  onChange={(e) => updateOption('trimWhitespace', e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded"
                />
                <span>Trim Leading & Trailing Whitespace</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeDuplicateRows}
                  onChange={(e) => updateOption('removeDuplicateRows', e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded"
                />
                <span>Deduplicate Identical Rows</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeEmptyRows}
                  onChange={(e) => updateOption('removeEmptyRows', e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded"
                />
                <span>Remove Blank / Empty Rows</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.standardizeDates}
                  onChange={(e) => updateOption('standardizeDates', e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded"
                />
                <span>Standardize Dates to ISO (YYYY-MM-DD)</span>
              </label>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Text Case Transform
              </label>
              <select
                value={options.textTransform}
                onChange={(e) => updateOption('textTransform', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none"
              >
                <option value="none">Preserve Original Casing</option>
                <option value="trim">Standardized Spacing</option>
                <option value="titlecase">Title Case (Every Word Capital)</option>
                <option value="lowercase">all lowercase</option>
                <option value="uppercase">ALL UPPERCASE</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Fill Empty Cells With
              </label>
              <input
                type="text"
                placeholder="e.g. N/A or 0 (leave empty to keep blank)"
                value={options.fillNullValue}
                onChange={(e) => updateOption('fillNullValue', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold outline-none"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={() => handleDownload('csv')}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Clean CSV</span>
              </button>
              <button
                onClick={() => handleDownload('xlsx')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel XLSX</span>
              </button>
            </div>
          </div>

          {/* Cleaning Report & Grid Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                <div className="text-[11px] font-semibold text-zinc-500">Original Rows</div>
                <div className="text-lg font-extrabold text-zinc-900 dark:text-white">{report.originalRows}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                <div className="text-[11px] font-semibold text-zinc-500">Cleaned Rows</div>
                <div className="text-lg font-extrabold text-emerald-600">{report.cleanedRows}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                <div className="text-[11px] font-semibold text-zinc-500">Dupes Removed</div>
                <div className="text-lg font-extrabold text-rose-500">{report.duplicatesRemoved}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                <div className="text-[11px] font-semibold text-zinc-500">Cells Sanitized</div>
                <div className="text-lg font-extrabold text-sky-500">{report.cellsTrimmed}</div>
              </div>
            </div>

            {/* Cleaned Table */}
            {cleanedData && (
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  <span>Sanitized Data Preview</span>
                  <span>{cleanedData.totalRows} Clean Rows</span>
                </div>
                <div className="overflow-x-auto max-h-[320px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0">
                      <tr>
                        {cleanedData.headers.map((h, i) => (
                          <th key={i} className="p-2.5 font-extrabold uppercase text-zinc-800 dark:text-zinc-200">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {cleanedData.rows.slice(0, 15).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          {cleanedData.headers.map((h, cIdx) => (
                            <td key={cIdx} className="p-2.5 truncate max-w-[150px]">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="data"
          toolSlug="csv-cleaner"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          fileContext={report ? `Hygiene Report: Original Rows=${report.originalRows}, Cleaned Rows=${report.cleanedRows}, Duplicates Removed=${report.duplicatesRemoved}, Cells Trimmed=${report.cellsTrimmed}` : undefined}
        />
      )}
    </div>
  );
}
