'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileType, ArrowLeft, Download, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { convertPdfToDocx } from '@/lib/pdf/pdf-to-docx';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function PdfToDocxPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);

  const handleConvert = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(10);
      setStatusText('Analyzing document typography and paragraphs...');

      const docxBlob = await convertPdfToDocx(files[0].arrayBuffer, (p) => {
        setProgress(p.progress);
        setStatusText(p.status);
      });

      setDownloadBlob(docxBlob);
      setProgress(100);
      setStatusText('Word Document Ready!');
      setIsProcessing(false);
    } catch (err: any) {
      console.error('DOCX conversion error:', err);
      alert(err.message || 'Failed to convert PDF to DOCX.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (!downloadBlob || files.length === 0) return;
    const outName = `${files[0].name.replace(/\.pdf$/i, '')}.docx`;
    saveAs(downloadBlob, outName);
  };

  const handleReset = () => {
    setFiles([]);
    setDownloadBlob(null);
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
            <FileType className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                PDF to Microsoft Word (DOCX)
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Word Document
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Convert PDF documents and text into editable Microsoft Word (.docx) documents with preserved headings.
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
          title="Select PDF document to convert"
          subtitle="or drag and drop your PDF file here"
        />

        {files.length > 0 && !downloadBlob && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 hover:shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <FileType className="w-4 h-4" />
              <span>Convert to Word (.DOCX)</span>
            </button>
          </div>
        )}

        {/* Download View */}
        {downloadBlob && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-blue-900 dark:text-blue-200">
                    Microsoft Word Document Ready
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Your PDF has been converted into an editable Microsoft Word .docx file.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download .DOCX File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="pdf"
          toolSlug="pdf-to-docx"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
        />
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen && isProcessing}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Converting PDF to Word"
      />
    </div>
  );
}
