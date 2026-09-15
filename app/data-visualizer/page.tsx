'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { parseCsvText, parseJsonText, parseExcelBuffer, ParsedTableData } from '@/lib/data/csv-matrix';
import { detectColumnTypes, renderChartSvg, ChartConfig, ChartType } from '@/lib/data/data-visualizer';
import { BarChart3, Download, Sliders, Sparkles, PieChart, LineChart } from 'lucide-react';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function DataVisualizerPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [data, setData] = useState<ParsedTableData | null>(null);
  const [catColumns, setCatColumns] = useState<string[]>([]);
  const [numColumns, setNumColumns] = useState<string[]>([]);

  const [config, setConfig] = useState<ChartConfig>({
    type: 'bar',
    xAxisColumn: '',
    yAxisColumn: '',
    title: 'Data Distribution',
    colorScheme: 'indigo',
  });

  const [svgOutput, setSvgOutput] = useState<string>('');

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      const file = newFiles[0].file;
      try {
        let parsed: ParsedTableData;
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const buf = await file.arrayBuffer();
          parsed = parseExcelBuffer(buf);
        } else if (file.name.endsWith('.json') || file.type === 'application/json') {
          parsed = parseJsonText(await file.text());
        } else {
          parsed = parseCsvText(await file.text());
        }

        setData(parsed);
        const { categorical, numerical } = detectColumnTypes(parsed);
        setCatColumns(categorical);
        setNumColumns(numerical);

        const xCol = categorical[0] || parsed.headers[0] || '';
        const yCol = numerical[0] || parsed.headers[1] || parsed.headers[0] || '';
        const nextCfg: ChartConfig = {
          type: 'bar',
          xAxisColumn: xCol,
          yAxisColumn: yCol,
          title: `${yCol} by ${xCol}`,
          colorScheme: 'indigo',
        };
        setConfig(nextCfg);
        setSvgOutput(renderChartSvg(parsed, nextCfg));
      } catch (err: any) {
        alert(`Failed to parse dataset: ${err.message}`);
      }
    } else {
      setData(null);
      setSvgOutput('');
    }
  };

  const updateConfig = (key: keyof ChartConfig, val: any) => {
    const next = { ...config, [key]: val };
    setConfig(next);
    if (data) {
      setSvgOutput(renderChartSvg(data, next));
    }
  };

  const downloadSvg = () => {
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    saveAs(blob, `chart_${config.title.toLowerCase().replace(/\s+/g, '_')}.svg`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-3">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Instant Data Visualizer • Zero Server Uploads</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Turn Spreadsheets into Interactive Charts
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Upload CSV, Excel, or JSON datasets and render customizable Bar, Line, Area, Pie, and Donut SVG charts.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept=".csv,.tsv,.json,.xlsx,.xls,text/csv"
          multiple={false}
          title="Select or Drop a Dataset"
          subtitle="Supports CSV, Excel XLSX, and JSON files"
          primaryColor="#6366f1"
        />
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Chart Configuration</span>
            </h2>

            {/* Chart Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Chart Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bar', label: 'Bar' },
                  { id: 'line', label: 'Line' },
                  { id: 'area', label: 'Area' },
                  { id: 'pie', label: 'Pie' },
                  { id: 'donut', label: 'Donut' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateConfig('type', t.id as ChartType)}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      config.type === t.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* X Axis Dimension */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                X-Axis / Category Column
              </label>
              <select
                value={config.xAxisColumn}
                onChange={(e) => updateConfig('xAxisColumn', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
              >
                {data.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Y Axis Metric */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Y-Axis / Metric Value
              </label>
              <select
                value={config.yAxisColumn}
                onChange={(e) => updateConfig('yAxisColumn', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
              >
                {data.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Colors */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Color Palette
              </label>
              <div className="flex gap-2">
                {(['indigo', 'emerald', 'rose', 'amber', 'cyan', 'violet'] as const).map((pal) => (
                  <button
                    key={pal}
                    onClick={() => updateConfig('colorScheme', pal)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      config.colorScheme === pal ? 'scale-125 border-zinc-900 dark:border-white' : 'border-transparent'
                    }`}
                    style={{
                      backgroundColor:
                        pal === 'indigo'
                          ? '#6366f1'
                          : pal === 'emerald'
                          ? '#10b981'
                          : pal === 'rose'
                          ? '#f43f5e'
                          : pal === 'amber'
                          ? '#f59e0b'
                          : pal === 'cyan'
                          ? '#06b6d4'
                          : '#8b5cf6',
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={downloadSvg}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Vector Chart (SVG)</span>
            </button>
          </div>

          {/* SVG Visual Canvas */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Live Interactive Visualization
            </h2>
            <div
              className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 min-h-[350px]"
              dangerouslySetInnerHTML={{ __html: svgOutput }}
            />
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="data"
          toolSlug="data-visualizer"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          fileContext={data ? `Chart: ${config.title} (${config.type} chart, X: ${config.xAxisColumn}, Y: ${config.yAxisColumn})\nData sample: ${JSON.stringify(data.rows.slice(0, 10))}` : undefined}
        />
      )}
    </div>
  );
}
