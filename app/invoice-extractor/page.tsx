'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Receipt, ArrowLeft, Download, Sparkles, Table, FileSpreadsheet, Building2, Calendar, DollarSign, CheckCircle2, FileText } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StagedFile } from '@/types/pdf';
import { ExtractedInvoice, exportInvoiceToExcel } from '@/lib/ai/invoice-extractor';
import { getPdfJs, downloadBytes, safeCloneBytes } from '@/lib/pdf/core';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function InvoiceExtractorPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [invoice, setInvoice] = useState<ExtractedInvoice | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const handleExtract = async () => {
    if (files.length === 0) return;

    try {
      setIsProcessing(true);
      setModalOpen(true);
      setProgress(15);
      setStatusText('Rasterizing document scan for AI Vision...');

      let imageBase64 = '';
      let mimeType = 'image/jpeg';

      if (files[0].file.type === 'application/pdf' && files[0].arrayBuffer) {
        const pdfjs = await getPdfJs();
        if (!pdfjs) throw new Error('PDF renderer unavailable');

        const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(files[0].arrayBuffer) }).promise;
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        } as any).promise;

        imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
      } else {
        // Image file
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(files[0].file);
        });
        mimeType = files[0].file.type || 'image/jpeg';
      }

      setProgress(45);
      setStatusText('Extracting vendor, financials & line items with Gemini Vision...');

      const res = await fetch('/api/ai/extract-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          fileName: files[0].file.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to extract invoice data');
      }

      const data = await res.json();
      setInvoice(data.invoice);
      setProgress(100);
      setStatusText('Financial Extraction Complete!');
      setIsProcessing(false);
      setModalOpen(false);
    } catch (err: any) {
      console.error('Invoice extraction error:', err);
      alert(err.message || 'Failed to extract invoice.');
      setIsProcessing(false);
      setModalOpen(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!invoice || files.length === 0) return;
    const excelBytes = exportInvoiceToExcel(invoice);
    const outName = `${invoice.vendorName ? invoice.vendorName.replace(/\s+/g, '_') : 'Invoice'}_${invoice.invoiceNumber || Date.now()}.xlsx`;
    downloadBytes(excelBytes, outName);
  };

  const handleDownloadCsv = () => {
    if (!invoice) return;
    const lines = [
      ['Item Description', 'Quantity', 'Unit Price', 'Line Total'],
      ...invoice.items.map((it) => [
        `"${it.description.replace(/"/g, '""')}"`,
        it.quantity,
        it.unitPrice,
        it.total,
      ]),
    ];
    const csvContent = lines.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${invoice.vendorName || 'Invoice'}_line_items.csv`);
  };

  const handleReset = () => {
    setFiles([]);
    setInvoice(null);
    setModalOpen(false);
    setProgress(0);
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Receipt className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                AI Financial & Invoice Extractor
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Vision AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Instantly turn PDF invoices, receipts, and bills into clean, structured Excel & CSV spreadsheets.
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
            primaryColor="#10b981"
            title="Select PDF Invoice or Receipt Image"
            subtitle="or drag and drop your invoice here (PDF, JPG, PNG)"
          />
        </div>
      ) : !invoice ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Receipt className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              {files[0].file.name}
            </h3>
            <p className="text-xs text-zinc-500">
              Ready to extract vendor, dates, tax breakdown, and all line-item tables into Excel.
            </p>
          </div>

          <button
            onClick={handleExtract}
            disabled={isProcessing}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Extract Structured Financials</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Actions & Summary Banner */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {invoice.vendorName || 'Invoice Summary'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                  #{invoice.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Date: {invoice.invoiceDate || 'N/A'} {invoice.dueDate ? `• Due: ${invoice.dueDate}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleDownloadExcel}
                className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel (.XLSX)</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>.CSV</span>
              </button>
            </div>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Subtotal</div>
              <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                {invoice.currency} {invoice.subtotal.toFixed(2)}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tax / GST</div>
              <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                {invoice.currency} {invoice.taxAmount.toFixed(2)}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Discount</div>
              <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                {invoice.currency} {(invoice.discountAmount || 0).toFixed(2)}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-sm">
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Due</div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {invoice.currency} {invoice.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
              <Table className="w-4 h-4 text-emerald-500" />
              <span>Extracted Line Items ({invoice.items.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                    <th className="pb-3 pl-2">#</th>
                    <th className="pb-3">Item Description</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Unit Price</th>
                    <th className="pb-3 text-right">Tax %</th>
                    <th className="pb-3 text-right pr-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-800 dark:text-zinc-200">
                  {invoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 pl-2 text-zinc-400">{idx + 1}</td>
                      <td className="py-3 font-semibold">{it.description}</td>
                      <td className="py-3 text-right">{it.quantity}</td>
                      <td className="py-3 text-right">{invoice.currency} {it.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-right">{it.taxRatePercent || 0}%</td>
                      <td className="py-3 text-right pr-2 font-bold text-emerald-600 dark:text-emerald-400">
                        {invoice.currency} {it.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <div className="mt-8">
          <ToolAIAssistantBanner
            suite="ai"
            toolSlug="invoice-extractor"
            fileName={files[0]?.file.name}
            fileSize={files[0]?.file.size}
            fileContext={invoice ? `Extracted Vendor: ${invoice.vendorName}, Total: ${invoice.currency} ${invoice.totalAmount}` : undefined}
          />
        </div>
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={modalOpen && isProcessing}
        isProcessing={isProcessing}
        progress={progress}
        statusText={statusText}
        onDownload={handleDownloadExcel}
        onReset={handleReset}
        actionTitle="Extracting Invoice Line Items"
      />
    </div>
  );
}
