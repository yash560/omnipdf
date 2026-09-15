'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { suggestSmartRenames, RenameSuggestion } from '@/lib/ai/batch-renamer';
import { Tags, Download, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';

export default function AiFileRenamerPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [instruction, setInstruction] = useState('Standardize into clean YYYY-MM-DD_Category_CleanName');
  const [suggestions, setSuggestions] = useState<RenameSuggestion[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    setSuggestions([]);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const names = files.map((f) => f.name);
      const res = await fetch('/api/ai/batch-rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileNames: names, instruction }),
      });

      if (!res.ok) throw new Error('AI rename request failed');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadRenamedZip = async () => {
    const zip = new JSZip();
    files.forEach((f) => {
      const sug = suggestions.find((s) => s.original === f.name);
      const newName = sug ? sug.suggested : f.name;
      zip.file(newName, f.file);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `renamed_files_${Date.now()}.zip`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
          <Tags className="w-3.5 h-3.5" />
          <span>Batch File Smart Renamer • TheWebVale AI</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Organize & Standardize Messy Filenames
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Drop 20+ messy photos or scanned documents and let AI deduce the context, clean the syntax, and package a renamed ZIP.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="*/*"
          multiple={true}
          title="Select or Drop Messy Files to Rename"
          subtitle="Add any number of documents, photos, or data files"
          primaryColor="#f59e0b"
        />
      </div>

      {files.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5 mb-8">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Naming Rule / Convention Instruction
            </label>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={processing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Analyze & Generate Rename Scheme</span>
          </button>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Proposed Renaming Matrix ({suggestions.length})</span>
            </h2>
            <button
              onClick={downloadRenamedZip}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Renamed ZIP</span>
            </button>
          </div>

          <div className="space-y-2">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
              >
                <div className="font-mono text-zinc-400 line-through truncate max-w-xs">{s.original}</div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div className="font-mono font-bold text-zinc-900 dark:text-white truncate">{s.suggested}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProcessingModal isOpen={processing} progress={50} statusText="TheWebVale AI is generating smart naming patterns..." />
    </div>
  );
}
