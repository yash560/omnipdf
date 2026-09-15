import { createWorker } from 'tesseract.js';
import { getPdfJs, safeCloneBytes } from './core';

export interface OcrProgress {
  status: string;
  progress: number;
  currentPage?: number;
  totalPages?: number;
}

/**
 * Perform optical character recognition (OCR) on scanned PDF pages
 */
export async function performPdfOcr(
  pdfData: ArrayBuffer | Uint8Array,
  language = 'eng',
  onProgress?: (info: OcrProgress) => void
): Promise<{ text: string; pages: { pageNumber: number; text: string; confidence: number }[] }> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js is required for rendering pages for OCR');

  if (onProgress) {
    onProgress({ status: 'Initializing OCR Worker...', progress: 5 });
  }

  const worker = await createWorker(language);

  const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(pdfData) }).promise;
  const total = pdfDoc.numPages;
  const pagesResult: { pageNumber: number; text: string; confidence: number }[] = [];

  for (let i = 1; i <= total; i++) {
    if (onProgress) {
      onProgress({
        status: `Processing Page ${i} of ${total} with OCR...`,
        progress: 10 + Math.round((i / total) * 85),
        currentPage: i,
        totalPages: total,
      });
    }

    const page = await pdfDoc.getPage(i);
    // Use 2.0 scale for sharp OCR recognition
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas,
    } as any).promise;

    const dataUrl = canvas.toDataURL('image/png');
    const ret = await worker.recognize(dataUrl);

    pagesResult.push({
      pageNumber: i,
      text: ret.data.text,
      confidence: ret.data.confidence,
    });
  }

  await worker.terminate();

  if (onProgress) {
    onProgress({ status: 'OCR Complete!', progress: 100 });
  }

  const fullText = pagesResult
    .map((p) => `--- Page ${p.pageNumber} (Confidence: ${Math.round(p.confidence)}%) ---\n${p.text}`)
    .join('\n\n');

  return {
    text: fullText,
    pages: pagesResult,
  };
}
