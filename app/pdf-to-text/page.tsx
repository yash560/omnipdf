'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, ArrowRight, Copy, Check, Download, FileCode } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { extractTextFromPdf } from '@/lib/pdf/convert';
import { downloadBlob } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function PdfToTextPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [extractedMarkdown, setExtractedMarkdown] = useState('');
  const [extractedPlain, setExtractedPlain] = useState('');
  const [activeTab, setActiveTab] = useState<'markdown' | 'plain'>('markdown');
  const [copied, setCopied] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const handleExtract = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(10);
      setStatusText('Extracting text content streams...');

      const arrayBuf = files[0].arrayBuffer;
      const res = await extractTextFromPdf(arrayBuf, (curr, total) => {
        setProgress(Math.round((curr / total) * 100));
        setStatusText(`Extracting text from page ${curr} of ${total}...`);
      });

      setExtractedMarkdown(res.markdown);
      setExtractedPlain(res.fullText);
      setIsProcessing(false);
      setStatusText('Extraction Complete!');
    } catch (err) {
      console.error('Extraction error:', err);
      alert('Failed to extract text from PDF.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const currentContent = activeTab === 'markdown' ? extractedMarkdown : extractedPlain;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (ext: 'md' | 'txt') => {
    const text = ext === 'md' ? extractedMarkdown : extractedPlain;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${files[0]?.name.replace(/\.pdf$/i, '')}_extracted.${ext}`);
  };

  const handleReset = () => {
    setFiles([]);
    setExtractedMarkdown('');
    setExtractedPlain('');
    setModalOpen(false);
    setProgress(0);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileText className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              PDF to Text & Markdown
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Extract clean formatted text, paragraphs, and structured markdown from your document.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          multiple={false}
          primaryColor="#2563eb"
          title="Select PDF file to extract text"
          subtitle="or drop a PDF document here"
        />

        {files.length > 0 && !extractedMarkdown && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              onClick={handleExtract}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Extract Text & Markdown</span>
            </button>
          </div>
        )}

        {/* Results */}
        {extractedMarkdown && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('markdown')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'markdown'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Structured Markdown (.md)
                </button>
                <button
                  onClick={() => setActiveTab('plain')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'plain'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500'
                  }`}
                >
                  Raw Plain Text (.txt)
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => downloadFile(activeTab === 'markdown' ? 'md' : 'txt')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .{activeTab === 'markdown' ? 'MD' : 'TXT'}</span>
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={currentContent}
              rows={14}
              className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed outline-none"
            />
          </div>
        )}
      </div>

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="pdf"
          toolSlug="pdf-to-text"
          fileName={files[0]?.name}
          fileSize={files[0]?.size}
          fileContext={extractedMarkdown || extractedPlain || `PDF Document: ${files[0]?.name}`}
        />
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen && isProcessing}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        onDownload={() => {}}
        onReset={handleReset}
        actionTitle="Extracting Text"
      />
    </div>
  );
}
