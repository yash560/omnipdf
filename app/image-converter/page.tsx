'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { convertImage, TargetImageFormat } from '@/lib/image/converter';
import { RefreshCw, Download, Sparkles, Sliders, CheckCircle2, ArrowRight } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function ImageConverterPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetImageFormat>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState<{ fileName: string; dataUrl: string; blob: Blob }[]>([]);

  const formats: { value: TargetImageFormat; label: string; ext: string }[] = [
    { value: 'image/png', label: 'PNG (Lossless & Alpha)', ext: 'PNG' },
    { value: 'image/jpeg', label: 'JPG / JPEG (Standard)', ext: 'JPG' },
    { value: 'image/webp', label: 'WEBP (Modern Web)', ext: 'WEBP' },
    { value: 'image/avif', label: 'AVIF (Next-Gen)', ext: 'AVIF' },
    { value: 'image/x-icon', label: 'ICO (Favicon)', ext: 'ICO' },
    { value: 'image/bmp', label: 'BMP (Windows Bitmap)', ext: 'BMP' },
    { value: 'image/svg+xml', label: 'SVG (Vector Container)', ext: 'SVG' },
  ];

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(10);
    setStatusText('Converting images in-browser...');
    const outList: { fileName: string; dataUrl: string; blob: Blob }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setStatusText(`Converting ${item.name} (${i + 1}/${files.length})...`);
        const res = await convertImage(item.file, { format: targetFormat, quality });
        outList.push({ fileName: res.fileName, dataUrl: res.dataUrl, blob: res.blob });
        setProgress(Math.round(10 + ((i + 1) / files.length) * 80));
      }

      setResults(outList);
      setProgress(100);
      setStatusText('Conversion complete!');

      if (outList.length === 1) {
        saveAs(outList[0].blob, outList[0].fileName);
      } else {
        const zip = new JSZip();
        outList.forEach((r) => zip.file(r.fileName, r.blob));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `converted_images_${Date.now()}.zip`);
      }
    } catch (err: any) {
      alert(`Conversion error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-3">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Universal Image Converter • Zero Server Uploads</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Convert Any Image in Batch
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Transform between PNG, JPG, WEBP, AVIF, ICO, BMP, and SVG at full resolution 100% client-side.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          accept="image/*"
          multiple={true}
          title="Select or Drop Images"
          subtitle="Supports JPG, PNG, WEBP, AVIF, BMP, GIF, SVG"
          primaryColor="#06b6d4"
        />
      </div>

      {/* Settings & Actions */}
      {files.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl mb-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-500" />
            <span>Target Format & Quality</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {formats.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setTargetFormat(fmt.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  targetFormat === fmt.value
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="text-xs font-bold">{fmt.ext}</div>
                <div className="text-[11px] opacity-75">{fmt.label}</div>
              </button>
            ))}
          </div>

          {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                <span>Output Quality: {Math.round(quality * 100)}%</span>
                <span className="text-zinc-400">Higher = crisper image</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={processing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Convert & Download {files.length} Image{files.length > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="image"
          toolSlug="image-converter"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          imageBase64={results[0]?.dataUrl}
        />
      )}

      {/* Results View */}
      {results.length > 0 && (
        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Converted Outputs ({results.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {results.map((res, i) => (
              <div key={i} className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                <img src={res.dataUrl} alt={res.fileName} className="w-full h-24 object-contain rounded-lg mb-2 bg-zinc-100 dark:bg-zinc-800" />
                <div className="text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200 mb-2">{res.fileName}</div>
                <button
                  onClick={() => saveAs(res.blob, res.fileName)}
                  className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-cyan-500 hover:text-white text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors w-full"
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProcessingModal isOpen={processing} progress={progress} statusText={statusText} />
    </div>
  );
}
