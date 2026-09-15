'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { MeetingSummaryResult } from '@/lib/ai/audio-summarizer';
import { Mic, Download, Sparkles, CheckCircle2, ListTodo, FileText, Copy } from 'lucide-react';
import saveAs from 'file-saver';
import { ProcessingModal } from '@/components/ProcessingModal';

export default function AiAudioSummaryPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [summary, setSummary] = useState<MeetingSummaryResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const file = newFiles[0].file;
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const res = await fetch('/api/ai/summarize-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64, mimeType: file.type || 'audio/mp3' }),
          });

          if (!res.ok) throw new Error('AI audio summarization failed');
          const data = await res.json();
          setSummary(data);
          setProcessing(false);
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        alert(err.message);
        setProcessing(false);
      }
    } else {
      setSummary(null);
    }
  };

  const copyAsMarkdown = () => {
    if (!summary) return;
    const md = `# Executive Meeting Summary\n\n${summary.executiveSummary}\n\n## Key Decisions\n${summary.keyDecisions.map((d) => `- ${d}`).join('\n')}\n\n## Action Items\n${summary.actionItems.map((a) => `- [ ] **${a.task}** (Owner: ${a.owner}, Deadline: ${a.deadline})`).join('\n')}`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!summary) return;
    const md = `# Executive Meeting Summary\n\n${summary.executiveSummary}\n\n## Key Decisions\n${summary.keyDecisions.map((d) => `- ${d}`).join('\n')}\n\n## Action Items\n${summary.actionItems.map((a) => `- [ ] **${a.task}** (Owner: ${a.owner}, Deadline: ${a.deadline})`).join('\n')}`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `meeting_summary_${Date.now()}.md`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold mb-3">
          <Mic className="w-3.5 h-3.5" />
          <span>Multimodal Audio AI • TheWebVale AI</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Meeting & Voice Memo AI Summarizer
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Upload meeting recordings or voice memos and generate structured executive summaries, decisions, and action items.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="audio/*,video/*"
          multiple={false}
          title="Select or Drop an Audio Recording"
          subtitle="Supports MP3, WAV, M4A, OGG, WebM"
          primaryColor="#ef4444"
        />
      </div>

      {summary && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex justify-end gap-3">
            <button
              onClick={copyAsMarkdown}
              className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={downloadMarkdown}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .MD Report</span>
            </button>
          </div>

          {/* Executive Summary Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              <span>Executive Summary</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {summary.executiveSummary}
            </p>
          </div>

          {/* Decisions and Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Decisions */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Key Decisions Reached</span>
              </h3>
              <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 list-disc list-inside">
                {summary.keyDecisions.map((d, i) => (
                  <li key={i} className="leading-relaxed">
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-red-500" />
                <span>Action Items & Owners</span>
              </h3>
              <div className="space-y-2">
                {summary.actionItems.map((a, i) => (
                  <div
                    key={i}
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs flex flex-col justify-between gap-1"
                  >
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{a.task}</span>
                    <div className="flex justify-between text-[11px] text-zinc-500">
                      <span>Owner: <strong className="text-zinc-700 dark:text-zinc-300">{a.owner}</strong></span>
                      <span>Deadline: <strong className="text-zinc-700 dark:text-zinc-300">{a.deadline}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProcessingModal isOpen={processing} progress={50} statusText="TheWebVale AI is analyzing meeting recordings..." />
    </div>
  );
}
