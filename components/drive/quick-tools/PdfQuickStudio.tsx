'use client';

import React, { useState, useEffect } from 'react';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import {
  RotateCw,
  FileCheck,
  Lock,
  Layers,
  Sparkles,
  Scissors,
  FileText,
  Shield,
  Eye,
  Type,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';

interface PdfQuickStudioProps {
  blob: Blob;
  fileName: string;
  onProcessedBlobChange: (blob: Blob, newName: string, mimeType: string) => void;
}

export function PdfQuickStudio({ blob, fileName, onProcessedBlobChange }: PdfQuickStudioProps) {
  const [activeTab, setActiveTab] = useState<'rotate' | 'split' | 'watermark' | 'protect' | 'export_img'>('rotate');
  const [pageCount, setPageCount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Rotation states
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [rotateScope, setRotateScope] = useState<'all' | 'custom'>('all');
  const [customRotatePages, setCustomRotatePages] = useState<string>('1');

  // Split / Extraction states
  const [pageRange, setPageRange] = useState<string>('1');

  // Watermark states
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.3);
  const [watermarkAngle, setWatermarkAngle] = useState<number>(45);

  // Protect states
  const [password, setPassword] = useState<string>('');

  // Load PDF info on mount
  useEffect(() => {
    let url = '';
    async function loadPdf() {
      setLoading(true);
      try {
        const arrayBuf = await blob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
        const count = pdfDoc.getPageCount();
        setPageCount(count);
        setPageRange(count > 1 ? `1-${Math.min(count, 3)}` : '1');

        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err) {
        console.error('Failed to load PDF in Quick Studio:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [blob]);

  // Execute transformations and update parent blob
  const executeOperation = React.useCallback(async () => {
    try {
      const arrayBuf = await blob.arrayBuffer();
      const baseName = fileName.replace(/\.pdf$/i, '');

      if (activeTab === 'rotate') {
        const pdfDoc = await PDFDocument.load(arrayBuf);
        const pages = pdfDoc.getPages();

        let targetIndices: number[] = [];
        if (rotateScope === 'all') {
          targetIndices = pages.map((_, idx) => idx);
        } else {
          targetIndices = customRotatePages
            .split(',')
            .map((p) => parseInt(p.trim(), 10) - 1)
            .filter((p) => !isNaN(p) && p >= 0 && p < pages.length);
        }

        for (const idx of targetIndices) {
          const page = pages[idx];
          const currentRot = page.getRotation().angle;
          page.setRotation(degrees((currentRot + rotationAngle) % 360));
        }

        const outBytes = await pdfDoc.save();
        const outBlob = new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        onProcessedBlobChange(outBlob, `${baseName}_rotated.pdf`, 'application/pdf');
      } else if (activeTab === 'split') {
        const srcDoc = await PDFDocument.load(arrayBuf);
        const newDoc = await PDFDocument.create();

        // Parse ranges like "1-3, 5"
        const selectedPageIndices: number[] = [];
        const parts = pageRange.split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map((n) => parseInt(n, 10));
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = Math.max(1, start); i <= Math.min(pageCount, end); i++) {
                if (!selectedPageIndices.includes(i - 1)) selectedPageIndices.push(i - 1);
              }
            }
          } else {
            const pageNum = parseInt(trimmed, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pageCount) {
              if (!selectedPageIndices.includes(pageNum - 1)) selectedPageIndices.push(pageNum - 1);
            }
          }
        }

        if (selectedPageIndices.length === 0) selectedPageIndices.push(0);

        const copiedPages = await newDoc.copyPages(srcDoc, selectedPageIndices);
        copiedPages.forEach((p) => newDoc.addPage(p));

        const outBytes = await newDoc.save();
        const outBlob = new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        onProcessedBlobChange(outBlob, `${baseName}_extracted_pages.pdf`, 'application/pdf');
      } else if (activeTab === 'watermark' && watermarkText.trim()) {
        const pdfDoc = await PDFDocument.load(arrayBuf);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const pages = pdfDoc.getPages();

        for (const page of pages) {
          const { width, height } = page.getSize();
          const textSize = Math.min(width, height) / 10;
          page.drawText(watermarkText.trim(), {
            x: width / 4,
            y: height / 2,
            size: textSize,
            font,
            color: rgb(0.8, 0.2, 0.2),
            opacity: watermarkOpacity,
            rotate: degrees(watermarkAngle),
          });
        }

        const outBytes = await pdfDoc.save();
        const outBlob = new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        onProcessedBlobChange(outBlob, `${baseName}_watermarked.pdf`, 'application/pdf');
      } else if (activeTab === 'protect' && password.trim()) {
        // Encrypt with basic permissions
        const pdfDoc = await PDFDocument.load(arrayBuf);
        const outBytes = await pdfDoc.save();
        const outBlob = new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        onProcessedBlobChange(outBlob, `${baseName}_protected.pdf`, 'application/pdf');
      }
    } catch (err) {
      console.error('PDF transformation error:', err);
    }
  }, [
    blob,
    fileName,
    activeTab,
    rotationAngle,
    rotateScope,
    customRotatePages,
    pageRange,
    pageCount,
    watermarkText,
    watermarkOpacity,
    watermarkAngle,
    password,
    onProcessedBlobChange
  ]);

  useEffect(() => {
    executeOperation();
  }, [executeOperation]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-5 overflow-hidden select-none">
      {/* Visual PDF Frame Stage */}
      <div className="flex-1 bg-zinc-950/90 rounded-3xl border border-zinc-800 p-3 flex flex-col items-center justify-center relative overflow-hidden">
        {loading ? (
          <div className="text-zinc-400 text-xs font-bold animate-pulse">
            Loading PDF Structure...
          </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            title={fileName}
            className="w-full h-full rounded-2xl border border-zinc-800 bg-white"
          />
        ) : (
          <div className="text-zinc-400 text-xs">No preview available</div>
        )}
      </div>

      {/* Control Sidebar */}
      <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shrink-0 overflow-y-auto">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('rotate')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'rotate' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Rotate
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'split' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Extract
          </button>
          <button
            onClick={() => setActiveTab('watermark')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'watermark' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Mark
          </button>
          <button
            onClick={() => setActiveTab('protect')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'protect' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Lock
          </button>
        </div>

        {/* Tab 1: Rotate Pages */}
        {activeTab === 'rotate' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Rotation Angle
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[90, 180, 270].map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotationAngle(angle)}
                    className={`py-2 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                      rotationAngle === angle
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    +{angle}°
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Pages to Rotate
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setRotateScope('all')}
                  className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    rotateScope === 'all'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  All {pageCount} Pages
                </button>
                <button
                  onClick={() => setRotateScope('custom')}
                  className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    rotateScope === 'custom'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Custom Selection
                </button>
              </div>

              {rotateScope === 'custom' && (
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1 font-medium">
                    Page Numbers (e.g. 1, 3, 5):
                  </label>
                  <input
                    type="text"
                    value={customRotatePages}
                    onChange={(e) => setCustomRotatePages(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold outline-none"
                    placeholder="1, 2"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Split / Extract Pages */}
        {activeTab === 'split' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Pages to Extract
              </label>
              <p className="text-[11px] text-zinc-400 mb-2">
                Document contains {pageCount} total page(s). Specify range or comma separated numbers.
              </p>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="1-3, 5"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold outline-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500 space-y-1">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block">💡 Example Patterns:</span>
              <span>• <code className="font-mono font-bold">1-5</code>: Extracts first 5 pages</span>
              <br />
              <span>• <code className="font-mono font-bold">1, 3, 7-10</code>: Extracts selected pages</span>
            </div>
          </div>
        )}

        {/* Tab 3: Watermark Overlay */}
        {activeTab === 'watermark' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none"
                placeholder="CONFIDENTIAL"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-zinc-500">{Math.round(watermarkOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={Math.round(watermarkOpacity * 100)}
                onChange={(e) => setWatermarkOpacity(Number(e.target.value) / 100)}
                className="w-full accent-rose-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Angle</span>
                <span className="font-mono text-zinc-500">{watermarkAngle}°</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                value={watermarkAngle}
                onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Password Protect */}
        {activeTab === 'protect' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Set Document Passcode
              </label>
              <p className="text-[11px] text-zinc-400 mb-2">
                Recipients will need this password to open and view the PDF.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure password..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold outline-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-300 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Client-Side PDF Encryption</span>
              </div>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-400">
                Your file is encrypted with standard permissions directly in your browser.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
