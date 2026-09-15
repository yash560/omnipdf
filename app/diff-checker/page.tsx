'use client';

import { useState } from 'react';
import { computeDiff, DiffResult } from '@/lib/data/diff-engine';
import { GitCompare, Sliders, CheckCircle2, Copy, FileText, ArrowRight } from 'lucide-react';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function DiffCheckerPage() {
  const [oldText, setOldText] = useState<string>('// Version 1.0\nfunction calculateTotal(items) {\n  let sum = 0;\n  for (let i = 0; i < items.length; i++) {\n    sum += items[i].price;\n  }\n  return sum;\n}');
  const [newText, setNewText] = useState<string>('// Version 2.0 (Optimized)\nfunction calculateTotal(items) {\n  if (!items || items.length === 0) return 0;\n  return items.reduce((acc, item) => acc + (item.price || 0), 0);\n}');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [diff, setDiff] = useState<DiffResult>(() => computeDiff(oldText, newText, ignoreWhitespace));

  const handleRunDiff = (o = oldText, n = newText, ws = ignoreWhitespace) => {
    setDiff(computeDiff(o, n, ws));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'old' | 'new') => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      if (target === 'old') {
        setOldText(text);
        handleRunDiff(text, newText, ignoreWhitespace);
      } else {
        setNewText(text);
        handleRunDiff(oldText, text, ignoreWhitespace);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-3">
          <GitCompare className="w-3.5 h-3.5" />
          <span>Document & Code Diff Checker</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Compare Revisions & Spot Differences
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Compare contracts, source code, JSON configs, or CSV spreadsheets line-by-line with visual diff highlighting.
        </p>
      </div>

      {/* Input Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Old Text */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Original / Left Text</span>
            <label className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer">
              Upload File
              <input type="file" onChange={(e) => handleFileUpload(e, 'old')} className="hidden" />
            </label>
          </div>
          <textarea
            value={oldText}
            onChange={(e) => {
              setOldText(e.target.value);
              handleRunDiff(e.target.value, newText, ignoreWhitespace);
            }}
            placeholder="Paste original text here..."
            className="w-full h-44 p-3 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none resize-none"
          />
        </div>

        {/* New Text */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Modified / Right Text</span>
            <label className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer">
              Upload File
              <input type="file" onChange={(e) => handleFileUpload(e, 'new')} className="hidden" />
            </label>
          </div>
          <textarea
            value={newText}
            onChange={(e) => {
              setNewText(e.target.value);
              handleRunDiff(oldText, e.target.value, ignoreWhitespace);
            }}
            placeholder="Paste modified text here..."
            className="w-full h-44 p-3 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none resize-none"
          />
        </div>
      </div>

      {/* Control Bar & Stats */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="text-emerald-600">+{diff.additions} Additions</span>
          <span className="text-rose-600">-{diff.deletions} Deletions</span>
          <span className="text-zinc-500">{diff.unchanged} Unchanged</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => {
                setIgnoreWhitespace(e.target.checked);
                handleRunDiff(oldText, newText, e.target.checked);
              }}
              className="w-4 h-4 accent-orange-500 rounded"
            />
            <span>Ignore Whitespace</span>
          </label>

          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'split' ? 'bg-orange-500 text-white' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Unified List
            </button>
          </div>
        </div>
      </div>

      {/* Diff Output Stream */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden font-mono text-xs">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[500px] overflow-y-auto">
          {diff.lines.map((line, idx) => (
            <div
              key={idx}
              className={`flex items-start px-4 py-1.5 transition-colors ${
                line.type === 'added'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                  : line.type === 'deleted'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 line-through opacity-80'
                  : 'text-zinc-800 dark:text-zinc-300'
              }`}
            >
              <div className="w-8 text-zinc-400 select-none text-[11px] text-right pr-2">
                {line.oldLineNumber ?? ''}
              </div>
              <div className="w-8 text-zinc-400 select-none text-[11px] text-right pr-3">
                {line.newLineNumber ?? ''}
              </div>
              <div className="w-6 text-center select-none font-bold">
                {line.type === 'added' ? '+' : line.type === 'deleted' ? '-' : ' '}
              </div>
              <div className="flex-1 whitespace-pre-wrap break-all">{line.content || ' '}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Banner */}
      <ToolAIAssistantBanner
        suite="data"
        toolSlug="diff-checker"
        fileName="Revision Comparison"
        fileContext={`Diff Summary: ${diff.additions} additions, ${diff.deletions} deletions.\nOld text:\n${oldText.substring(0, 5000)}\n\nNew text:\n${newText.substring(0, 5000)}`}
      />
    </div>
  );
}
