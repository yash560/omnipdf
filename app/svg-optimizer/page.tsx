'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { optimizeSvg, vectorizeBitmap } from '@/lib/image/svg-engine';
import { Code2, Download, Copy, CheckCircle2, Sparkles, Sliders, Layers } from 'lucide-react';
import saveAs from 'file-saver';

export default function SvgOptimizerPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [tab, setTab] = useState<'optimize' | 'vectorize'>('optimize');
  const [svgCode, setSvgCode] = useState<string>('');
  const [stats, setStats] = useState<{ orig: number; opt: number; savings: number } | null>(null);
  const [threshold, setThreshold] = useState<number>(128);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      const file = newFiles[0].file;
      try {
        if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
          setTab('optimize');
          const text = await file.text();
          const res = optimizeSvg(text);
          setSvgCode(res.optimizedSvg);
          setStats({ orig: res.originalLength, opt: res.optimizedLength, savings: res.savingsPercent });
        } else {
          setTab('vectorize');
          const vectorSvg = await vectorizeBitmap(file, threshold);
          setSvgCode(vectorSvg);
          setStats(null);
        }
      } catch (err: any) {
        alert(`SVG processing failed: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    } else {
      setSvgCode('');
      setStats(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(svgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const name = files[0] ? files[0].name.replace(/\.[^/.]+$/, '') : 'optimized';
    saveAs(blob, `${name}.svg`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
          <Code2 className="w-3.5 h-3.5" />
          <span>SVG Optimizer & Vectorizer Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Clean Bloated SVG Markup or Vectorize Bitmaps
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Strip Figma/Illustrator namespaces, round float decimals, and convert PNG/JPG raster logos into vector paths.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp"
          multiple={false}
          title="Select SVG or Image to Vectorize"
          subtitle="Drop SVG to optimize, or PNG/JPG to trace into SVG paths"
          primaryColor="#3b82f6"
        />
      </div>

      {svgCode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Controls & Stats */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <span>{tab === 'optimize' ? 'Optimization Stats' : 'Vector Trace Settings'}</span>
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              {stats && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 mb-6 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Original Size:</span>
                    <span className="font-semibold">{stats.orig} bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Optimized Size:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{stats.opt} bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Markup Minified:</span>
                    <span className="font-extrabold text-emerald-600">-{stats.savings}% reduced</span>
                  </div>
                </div>
              )}

              {tab === 'vectorize' && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    <span>Edge Contrast Threshold: {threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="220"
                    value={threshold}
                    onChange={async (e) => {
                      const val = parseInt(e.target.value);
                      setThreshold(val);
                      if (files.length > 0) {
                        const svg = await vectorizeBitmap(files[0].file, val);
                        setSvgCode(svg);
                      }
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}

              {/* Code preview snippet */}
              <div className="p-3 bg-zinc-950 text-zinc-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 mb-6 border border-zinc-800">
                {svgCode.substring(0, 300)}...
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>Download Vector SVG</span>
            </button>
          </div>

          {/* Live SVG Visual Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Vector Render Output
            </h2>
            <div
              className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-xl p-6 overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 min-h-[340px]"
              dangerouslySetInnerHTML={{ __html: svgCode }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
