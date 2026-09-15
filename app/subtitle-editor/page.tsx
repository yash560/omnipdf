'use client';

import { useState } from 'react';
import { parseSrt, exportToSrt, exportToVtt, shiftSubtitleTiming, SubtitleCue } from '@/lib/media/subtitle-engine';
import { Subtitles, Download, Plus, Trash2, Clock, CheckCircle2, Copy } from 'lucide-react';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function SubtitleEditorPage() {
  const [cues, setCues] = useState<SubtitleCue[]>([
    { id: '1', index: 1, startTimeMs: 0, endTimeMs: 3500, text: 'Welcome to Omni Files!' },
    { id: '2', index: 2, startTimeMs: 4000, endTimeMs: 7500, text: 'All tools run 100% private in your browser.' },
  ]);
  const [offsetInput, setOffsetInput] = useState<string>('0');
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const parsed = parseSrt(text);
      if (parsed.length > 0) setCues(parsed);
    }
  };

  const addCue = () => {
    const lastCue = cues[cues.length - 1];
    const startTimeMs = lastCue ? lastCue.endTimeMs + 500 : 0;
    const endTimeMs = startTimeMs + 3000;
    setCues([...cues, { id: String(Date.now()), index: cues.length + 1, startTimeMs, endTimeMs, text: 'New subtitle cue' }]);
  };

  const deleteCue = (id: string) => {
    setCues(cues.filter((c) => c.id !== id));
  };

  const updateCueText = (id: string, text: string) => {
    setCues(cues.map((c) => (c.id === id ? { ...c, text } : c)));
  };

  const handleShift = () => {
    const offset = parseFloat(offsetInput) * 1000;
    if (!isNaN(offset)) {
      setCues(shiftSubtitleTiming(cues, offset));
    }
  };

  const handleDownload = (format: 'srt' | 'vtt') => {
    const content = format === 'srt' ? exportToSrt(cues) : exportToVtt(cues);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `subtitles.${format}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-3">
          <Subtitles className="w-3.5 h-3.5" />
          <span>Subtitle Studio • SRT & VTT Sync</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Create & Synchronize Subtitles
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Add timestamped captions, shift audio sync offsets (+/- ms), and export universal SRT and WebVTT files.
        </p>
      </div>

      {/* Action Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <label className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-bold cursor-pointer transition-colors">
            Upload .SRT / .VTT
            <input type="file" accept=".srt,.vtt,text/plain" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={addCue}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Caption</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Shift Time Offset */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 font-semibold">Shift:</span>
            <input
              type="number"
              step="0.5"
              value={offsetInput}
              onChange={(e) => setOffsetInput(e.target.value)}
              className="w-16 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold rounded-lg text-center"
            />
            <span className="text-xs text-zinc-400">s</span>
            <button
              onClick={handleShift}
              className="px-2.5 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-cyan-500 hover:text-white transition-colors"
            >
              Apply
            </button>
          </div>

          <button
            onClick={() => handleDownload('srt')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .SRT</span>
          </button>
          <button
            onClick={() => handleDownload('vtt')}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .VTT</span>
          </button>
        </div>
      </div>

      {/* Subtitles Cue List */}
      <div className="space-y-3">
        {cues.map((cue, idx) => (
          <div
            key={cue.id}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{(cue.startTimeMs / 1000).toFixed(2)}s</span>
                <span>→</span>
                <span>{(cue.endTimeMs / 1000).toFixed(2)}s</span>
              </div>
            </div>

            <input
              type="text"
              value={cue.text}
              onChange={(e) => updateCueText(cue.id, e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-cyan-500 w-full"
            />

            <button
              onClick={() => deleteCue(cue.id)}
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* AI Assistant Banner */}
      <ToolAIAssistantBanner
        suite="media"
        toolSlug="subtitle-editor"
        fileName="Subtitles Track"
        fileContext={cues.map(c => `[${(c.startTimeMs / 1000).toFixed(1)}s -> ${(c.endTimeMs / 1000).toFixed(1)}s]: ${c.text}`).join('\n')}
      />
    </div>
  );
}
