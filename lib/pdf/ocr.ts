import { createWorker } from 'tesseract.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getPdfJs, safeCloneBytes } from './core';

export interface OcrProgress {
  status: string;
  progress: number;
  currentPage?: number;
  totalPages?: number;
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
  words?: {
    text: string;
    bbox: { x0: number; y0: number; x1: number; y1: number };
    confidence: number;
  }[];
}

/**
 * Perform optical character recognition (OCR) on scanned PDF pages
 * Can produce both plain text and full Searchable Sandwich PDFs
 */
export async function performPdfOcr(
  pdfData: ArrayBuffer | Uint8Array,
  language = 'eng',
  onProgress?: (info: OcrProgress) => void
): Promise<{ 
  text: string; 
  pages: OcrPageResult[];
  searchablePdfBytes?: Uint8Array;
}> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js is required for rendering pages for OCR');

  if (onProgress) {
    onProgress({ status: 'Initializing Tesseract OCR Neural Worker...', progress: 5 });
  }

  const worker = await createWorker(language);

  const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(pdfData) }).promise;
  const total = pdfDoc.numPages;
  const pagesResult: OcrPageResult[] = [];

  // Create Searchable PDF doc
  const searchableDoc = await PDFDocument.create();
  const font = await searchableDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= total; i++) {
    if (onProgress) {
      onProgress({
        status: `Processing Page ${i} of ${total} with OCR...`,
        progress: 10 + Math.round((i / total) * 80),
        currentPage: i,
        totalPages: total,
      });
    }

    const page = await pdfDoc.getPage(i);
    const unscaledVp = page.getViewport({ scale: 1.0 });
    const scale = 2.0; // High-res for OCR accuracy
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any).promise;

    const pngDataUrl = canvas.toDataURL('image/png');
    const ret = await worker.recognize(pngDataUrl);

    const words = ((ret.data as any).words || []).map((w: any) => ({
      text: w.text,
      bbox: w.bbox,
      confidence: w.confidence,
    }));

    pagesResult.push({
      pageNumber: i,
      text: ret.data.text,
      confidence: ret.data.confidence,
      words,
    });

    // Embed rendered page image in searchable PDF
    const embeddedImg = await searchableDoc.embedPng(pngDataUrl);
    const newPage = searchableDoc.addPage([unscaledVp.width, unscaledVp.height]);
    
    // Draw background image scan
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: unscaledVp.width,
      height: unscaledVp.height,
    });

    // Draw invisible selectable vector text layer on top of scan
    for (const w of words) {
      if (!w.text || !w.text.trim()) continue;

      // Map canvas coordinates to PDF points (1/72 inch)
      const pdfX = w.bbox.x0 / scale;
      const pdfW = (w.bbox.x1 - w.bbox.x0) / scale;
      const boxH = (w.bbox.y1 - w.bbox.y0) / scale;
      const pdfY = unscaledVp.height - (w.bbox.y1 / scale);

      const fontSize = Math.max(6, Math.min(72, boxH * 0.9));

      try {
        newPage.drawText(w.text, {
          x: pdfX,
          y: pdfY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          opacity: 0.001, // Invisible selectable text layer
        });
      } catch {}
    }
  }

  await worker.terminate();

  if (onProgress) {
    onProgress({ status: 'Building Searchable PDF...', progress: 95 });
  }

  const searchablePdfBytes = await searchableDoc.save({ useObjectStreams: true });

  if (onProgress) {
    onProgress({ status: 'OCR Complete!', progress: 100 });
  }

  const fullText = pagesResult
    .map((p) => `--- Page ${p.pageNumber} (Confidence: ${Math.round(p.confidence)}%) ---\n${p.text}`)
    .join('\n\n');

  return {
    text: fullText,
    pages: pagesResult,
    searchablePdfBytes,
  };
}
