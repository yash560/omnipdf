'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { fileToBase64, base64ToFile, Base64Result } from '@/lib/security/base64-engine';
import { Binary, Copy, CheckCircle2, Download, Code2, Sparkles } from 'lucide-react';
import saveAs from 'file-saver';
import { formatBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function Base64StudioPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [result, setResult] = useState<Base64Result | null>(null);
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeFileName, setDecodeFileName] = useState('decoded_file.bin');
  const [tab, setTab] = useState<'encode' | 'decode'>('encode');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const res = await fileToBase64(newFiles[0].file);
        setResult(res);
      } catch (err: any) {
        alert(`Base64 encoding failed: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    } else {
      setResult(null);
    }
  };

  const copyText = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDecode = () => {
    if (!decodeInput.trim()) return;
    try {
      const blob = base64ToFile(decodeInput, decodeFileName);
      saveAs(blob, decodeFileName);
    } catch (err: any) {
      alert(`Base64 decoding failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-xs font-bold mb-3">
          <Binary className="w-3.5 h-3.5" />
          <span>Base64, Data URI & Hex Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Encode & Decode Binary Files
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Convert any image, audio, or document to Base64 data URIs, HTML `&lt;img&gt;` snippets, CSS backgrounds, or Hex dumps.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => setTab('encode')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'encode'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          File to Base64
        </button>
        <button
          onClick={() => setTab('decode')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'decode'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          Base64 to File
        </button>
      </div>

      {tab === 'encode' ? (
        <>
          <div className="mb-8">
            <FileDropzone
              files={files}
              onFilesChange={handleFilesChange}
              accept="*/*"
              multiple={false}
              title="Select or Drop Any File"
              subtitle="Encodes into Base64, Data URI, and Hex"
              primaryColor="#0284c7"
            />
          </div>

          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {[
                { title: 'Data URI (HTML / CSS / JS)', val: result.dataUri, key: 'dataUri' },
                { title: 'Raw Base64 String', val: result.base64, key: 'base64' },
                { title: 'HTML Image Tag', val: result.htmlImg, key: 'htmlImg' },
                { title: 'CSS Background Property', val: result.cssBackground, key: 'css' },
                { title: 'Hex Binary Dump (First 1KB)', val: result.hex, key: 'hex' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{item.title}</span>
                    <button
                      onClick={() => copyText(item.val, item.key)}
                      className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-sky-500 hover:text-white text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === item.key ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === item.key ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={item.val}
                    className="w-full h-20 p-2.5 font-mono text-[11px] bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none resize-none"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Decode Base64 Data String to File
          </h2>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Target Filename</label>
            <input
              type="text"
              value={decodeFileName}
              onChange={(e) => setDecodeFileName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Paste Base64 or Data URI</label>
            <textarea
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
              placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
              className="w-full h-44 p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none resize-none"
            />
          </div>
          <button
            onClick={handleDecode}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Decode & Download File</span>
          </button>
        </div>
      )}

      {/* AI Assistant Banner */}
      {(files.length > 0 || (tab === 'decode' && decodeInput.trim().length > 0)) && (
        <ToolAIAssistantBanner
          suite="security"
          toolSlug="base64-studio"
          fileName={files[0]?.file.name || decodeFileName}
          fileSize={files[0]?.file.size}
          fileContext={result ? `Base64 (${result.base64.length} chars, ${result.mimeType}):\n${result.base64.substring(0, 3000)}\n\nData URI:\n${result.dataUri.substring(0, 3000)}` : decodeInput.substring(0, 3000)}
        />
      )}
    </div>
  );
}
