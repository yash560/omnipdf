'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { convertDocxToMarkdown, DocxConvertedResult } from '@/lib/data/docx-parser';
import { FileType, Download, Copy, CheckCircle2, Sparkles, Code2, BookOpen } from 'lucide-react';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function DocxToMarkdownPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [result, setResult] = useState<DocxConvertedResult | null>(null);
  const [viewTab, setViewTab] = useState<'markdown' | 'html' | 'preview'>('preview');
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const res = await convertDocxToMarkdown(newFiles[0].file);
        setResult(res);
      } catch (err: any) {
        alert(`Failed to convert Word document: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    } else {
      setResult(null);
    }
  };

  const copyContent = () => {
    if (!result) return;
    const text = viewTab === 'html' ? result.html : result.markdown;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (format: 'md' | 'html') => {
    if (!result) return;
    const baseName = files[0]?.name.replace(/\.[^/.]+$/, '') || 'document';
    if (format === 'md') {
      const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, `${baseName}.md`);
    } else {
      const blob = new Blob([result.html], { type: 'text/html;charset=utf-8' });
      saveAs(blob, `${baseName}.html`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
          <FileType className="w-3.5 h-3.5" />
          <span>Word Document Intelligence • 100% Private On-Device Processing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Convert Microsoft Word to Clean Markdown
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Extract tables, headings, bold text, and bullet lists from `.docx` files directly into clean Markdown or HTML.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple={false}
          title="Select or Drop a Word DOCX Document"
          subtitle="Supports Microsoft Word (.docx) files"
          primaryColor="#2563eb"
        />
      </div>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Action & Metric Bar */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              <span>{result.wordCount} words</span>
              <span>•</span>
              <span>{result.headingsCount} headings</span>
              <span>•</span>
              <span>{result.tablesCount} tables</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                {(['preview', 'markdown', 'html'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setViewTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      viewTab === tab
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button
                onClick={copyContent}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => downloadFile(viewTab === 'html' ? 'html' : 'md')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .{viewTab === 'html' ? 'html' : 'md'}</span>
              </button>
            </div>
          </div>

          {/* Document Content Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl min-h-[400px]">
            {viewTab === 'preview' && (
              <div
                className="prose dark:prose-invert max-w-none text-zinc-900 dark:text-zinc-100 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: result.html }}
              />
            )}
            {viewTab === 'markdown' && (
              <textarea
                readOnly
                value={result.markdown}
                className="w-full h-96 p-4 font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none resize-none"
              />
            )}
            {viewTab === 'html' && (
              <textarea
                readOnly
                value={result.html}
                className="w-full h-96 p-4 font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none resize-none"
              />
            )}
          </div>

          {/* AI Assistant Banner */}
          <ToolAIAssistantBanner
            suite="pdf"
            toolSlug="docx-to-markdown"
            fileName={files[0]?.file.name}
            fileSize={files[0]?.file.size}
            fileContext={result?.markdown}
          />
        </div>
      )}
    </div>
  );
}
