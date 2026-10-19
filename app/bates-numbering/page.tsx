'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Hash, ArrowLeft, Download, Sliders, CheckCircle2, FileSpreadsheet, ShieldAlert, Sparkles } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { applyBatesNumbering, BatesConfig } from '@/lib/pdf/bates-numbering';
import { downloadBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function BatesNumberingPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [prefix, setPrefix] = useState('CONFIDENTIAL-');
  const [suffix, setSuffix] = useState('');
  const [startNumber, setStartNumber] = useState(1);
  const [digitCount, setDigitCount] = useState(6);
  const [position, setPosition] = useState<BatesConfig['position']>('bottom-right');
  const [fontSize, setFontSize] = useState(10);
  const [color, setColor] = useState('#000000');
  const [margin, setMargin] = useState(36);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadReady, setDownloadReady] = useState<Uint8Array | null>(null);

  const sampleBatesPreview = `${prefix}${startNumber.toString().padStart(digitCount, '0')}${suffix}`;

  const handleApplyBates = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(20);
      setStatusText('Embedding sequential Bates stamps on document streams...');

      const resultBytes = await applyBatesNumbering(files[0].arrayBuffer, {
        prefix,
        suffix,
        startNumber,
        digitCount,
        position,
        fontSize,
        color,
        margin,
        pageSelection: 'all',
      });

      setDownloadReady(resultBytes);
      setProgress(100);
      setStatusText('Bates Numbering Applied Successfully!');
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Bates error:', err);
      alert(err.message || 'Failed to apply Bates numbering.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownload = () => {
    if (!downloadReady || files.length === 0) return;
    const outName = `${files[0].name.replace(/\.pdf$/i, '')}_bates_indexed.pdf`;
    downloadBytes(downloadReady, outName);
  };

  const handleReset = () => {
    setFiles([]);
    setDownloadReady(null);
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Hash className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Bates Numbering & Legal Stamping
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Legal Discovery
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Index and organize enterprise and legal documents with custom sequential Bates numbers and prefixes.
            </p>
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            multiple={false}
            primaryColor="#6366f1"
            title="Select PDF document for Bates indexing"
            subtitle="or drag and drop your document here"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Bates Stamp Configuration</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Suffix (Optional)
                  </label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Start Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Zero Padding Digits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={digitCount}
                    onChange={(e) => setDigitCount(parseInt(e.target.value, 10) || 6)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Stamp Position on Page
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      'top-left',
                      'top-center',
                      'top-right',
                      'bottom-left',
                      'bottom-center',
                      'bottom-right',
                    ] as const
                  ).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos)}
                      className={`py-2 text-[11px] font-extrabold rounded-xl border transition-all cursor-pointer capitalize ${
                        position === pos
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {pos.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Font Size ({fontSize} pt)
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="20"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Margin ({margin} pt)
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="72"
                    value={margin}
                    onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleApplyBates}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Hash className="w-4 h-4" />
                <span>Apply Bates Numbering</span>
              </button>
            </div>
          </div>

          {/* Right Live Preview */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Live Stamp Format Preview
              </h3>

              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">First Page Stamp</div>
                <div className="text-xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                  {sampleBatesPreview}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <div className="font-extrabold text-indigo-900 dark:text-indigo-200">
                  Document Discovery Standard
                </div>
                <p>
                  Bates indexing applies non-removable sequential reference numbers across multi-volume litigation or evidentiary packets.
                </p>
              </div>
            </div>

            {downloadReady && (
              <button
                onClick={handleDownload}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                <Download className="w-4 h-4" />
                <span>Download Indexed PDF</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <div className="mt-8">
          <ToolAIAssistantBanner
            suite="pdf"
            toolSlug="bates-numbering"
            fileName={files[0]?.file.name}
            fileSize={files[0]?.file.size}
            fileContext={`Bates Numbering Prefix: "${prefix}", Sample: "${sampleBatesPreview}"`}
          />
        </div>
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        onDownload={handleDownload}
        onReset={handleReset}
        actionTitle="Applying Bates Numbering"
      />

      {/* SEO & Educational Guide Section: Optimized for Page 1 Google Snippets */}
      <section className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800 space-y-12 max-w-4xl mx-auto">
        {/* Definition Snippet Target */}
        <div className="p-8 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Document Discovery Standards</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            What is Bates Numbering on a PDF?
          </h2>
          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm md:text-base font-medium">
            <strong>Bates numbering</strong> (also known as <em>Bates stamping</em>) is an indexing method used in legal discovery and corporate compliance to assign unique, sequential reference identifiers to each page of a document packet. Commonly formatted with case-specific prefixes (such as <code>CONFIDENTIAL-</code>, <code>PLTF-</code>, or <code>DEF-</code>) and zero-padded digits (e.g., <code>000001</code>), Bates stamping prevents document tampering and ensures precise page citation during trials, depositions, and regulatory audits.
          </p>
        </div>

        {/* Common Legal Bates Formats Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Standard Legal Bates Numbering Formats
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Depending on your jurisdiction and case role, Bates numbering uses standard convention codes to distinguish evidentiary sources:
          </p>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-200">
                <tr>
                  <th className="p-3.5 font-bold">Prefix Type</th>
                  <th className="p-3.5 font-bold">Example Stamp</th>
                  <th className="p-3.5 font-bold">Standard Legal Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="p-3.5 font-semibold text-zinc-800 dark:text-zinc-200">Plaintiff Production</td>
                  <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">PLTF-000001</td>
                  <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Used by plaintiff counsel to number initial complaints and discovery exhibits.</td>
                </tr>
                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="p-3.5 font-semibold text-zinc-800 dark:text-zinc-200">Defendant Production</td>
                  <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">DEF-000001</td>
                  <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Used by defendant counsel during mandatory document disclosures.</td>
                </tr>
                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="p-3.5 font-semibold text-zinc-800 dark:text-zinc-200">Confidential Materials</td>
                  <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">CONFIDENTIAL-000001</td>
                  <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Protective order designations for sensitive financial records, PII, and trade secrets.</td>
                </tr>
                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="p-3.5 font-semibold text-zinc-800 dark:text-zinc-200">Deposition Exhibits</td>
                  <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">EXHIBIT-A-001</td>
                  <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Specific courtroom or arbitration evidentiary identification packets.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Client-Side WebAssembly Privacy Guarantee */}
        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>100% In-Browser Privacy Protection</span>
          </div>
          <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Unlike legacy online PDF tools that upload sensitive litigation files to remote third-party servers, FileCraft processes document streams entirely inside your browser's local memory via WebAssembly. Your confidential client records, tax filings, and evidence packets never leave your machine—preserving strict attorney-client privilege.
          </p>
        </div>

        {/* TheWebVale Engineering & Attribution Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold mb-1">
              Architecture &amp; Engineering
            </div>
            <h4 className="text-base font-bold">
              Engineered by TheWebVale Software Studio
            </h4>
            <p className="text-xs text-indigo-200/80 max-w-xl mt-1">
              FileCraft is architected by <a href="https://www.thewebvale.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-white">TheWebVale</a>, building sub-second web platforms, enterprise ERP systems, and high-velocity digital products.
            </p>
          </div>
          <a
            href="https://www.thewebvale.com/services/website-development"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold whitespace-nowrap shadow-md transition-all"
          >
            Explore Custom Software
          </a>
        </div>

        {/* Frequently Asked Questions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                How do I Bates number a PDF for free?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Drag and drop your PDF into FileCraft, customize your prefix (e.g. <code>CONFIDENTIAL-</code>), set your starting number and digit padding (e.g. 6 digits), choose placement (such as bottom-right), and click Apply Bates Numbering. Your stamped document will be generated locally within seconds.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                Will Bates stamping alter or blur existing PDF text?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                No. Bates numbering is injected as an overlay on the PDF content stream with configurable margin padding, ensuring underlying text, signatures, and stamps remain fully legible.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                Are there any file size or page count limits?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Because processing happens on your local device CPU rather than a shared cloud server, you can process large litigation binders with hundreds of pages without subscription fees or artificial limits.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
