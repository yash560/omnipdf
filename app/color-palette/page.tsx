'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { extractPalette, ExtractedColor } from '@/lib/image/palette';
import { Palette, Copy, CheckCircle2, Download, Sparkles, ShieldCheck } from 'lucide-react';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function ColorPalettePage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [colorCount, setColorCount] = useState<number>(6);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const palette = await extractPalette(newFiles[0].file, colorCount);
        setColors(palette);
      } catch (err: any) {
        alert(`Palette extraction failed: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    } else {
      setColors([]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(id);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const exportAsJson = () => {
    const jsonStr = JSON.stringify(colors, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    saveAs(blob, `palette_${files[0]?.name || 'theme'}.json`);
  };

  const exportAsCss = () => {
    const cssVariables = colors
      .map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.tailwindName} */`)
      .join('\n');
    const cssText = `:root {\n${cssVariables}\n}`;
    const blob = new Blob([cssText], { type: 'text/css' });
    saveAs(blob, `palette_${files[0]?.name || 'theme'}.css`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold mb-3">
          <Palette className="w-3.5 h-3.5" />
          <span>Color Palette Extractor • WCAG Accessibility</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Extract Dominant Colors & Contrast Ratios
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Extract HEX, RGB, HSL values, match Tailwind color names, and verify WCAG AA/AAA readability.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="image/*"
          multiple={false}
          title="Select or Drop an Image"
          subtitle="Supports JPG, PNG, WEBP, AVIF"
          primaryColor="#f43f5e"
        />
      </div>

      {colors.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Palette Swatch Bar */}
          <div className="h-24 w-full rounded-2xl overflow-hidden flex shadow-xl border border-zinc-200 dark:border-zinc-800">
            {colors.map((c, i) => (
              <div
                key={i}
                style={{ backgroundColor: c.hex, width: `${c.percentage}%` }}
                className="h-full relative group flex items-end p-2 cursor-pointer transition-transform hover:scale-105 hover:z-10"
                onClick={() => copyToClipboard(c.hex, c.hex)}
                title={`Click to copy ${c.hex}`}
              >
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: c.contrastBlack > 4.5 ? '#000000' : '#ffffff',
                    color: c.contrastBlack > 4.5 ? '#ffffff' : '#000000',
                  }}
                >
                  {c.hex}
                </span>
              </div>
            ))}
          </div>

          {/* Detailed Color Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colors.map((c, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl shadow-inner border border-black/10 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase">
                          {c.hex}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {c.percentage}%
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 font-mono truncate">{c.rgb}</div>
                    </div>
                  </div>

                  {/* Contrast ratios */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">On White:</span>
                      <span className={`font-bold ${c.wcagWhite === 'AAA' ? 'text-emerald-500' : c.wcagWhite === 'AA' ? 'text-blue-500' : 'text-rose-500'}`}>
                        {c.contrastWhite}:1 ({c.wcagWhite})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">On Black:</span>
                      <span className={`font-bold ${c.wcagBlack === 'AAA' ? 'text-emerald-500' : c.wcagBlack === 'AA' ? 'text-blue-500' : 'text-rose-500'}`}>
                        {c.contrastBlack}:1 ({c.wcagBlack})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(c.hex, c.hex)}
                  className="mt-4 w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedHex === c.hex ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHex === c.hex ? 'Copied HEX' : 'Copy HEX'}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <button
              onClick={exportAsCss}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-rose-500" />
              <span>Export CSS Variables</span>
            </button>
            <button
              onClick={exportAsJson}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-rose-500" />
              <span>Export JSON Palette</span>
            </button>
          </div>

          {/* AI Assistant Banner */}
          <ToolAIAssistantBanner
            suite="image"
            toolSlug="color-palette"
            fileName={files[0]?.file.name}
            fileSize={files[0]?.file.size}
            fileContext={`Extracted Palette (${colors.length} colors): ${colors.map(c => `${c.hex} (${c.tailwindName}, ${c.percentage.toFixed(1)}%)`).join(', ')}`}
          />
        </div>
      )}
    </div>
  );
}
