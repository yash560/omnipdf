import { PDFDocument, PageSizes } from 'pdf-lib';
import { getPdfJs, createAndDownloadZip, safeCloneBytes } from './core';

export interface ImageToPdfOptions {
  pageSize: 'fit' | 'a4' | 'letter';
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: 'none' | 'small' | 'big';
}

/**
 * Convert multiple image files into a single formatted PDF document
 */
export async function imagesToPdf(
  images: { name: string; dataUrl: string; width: number; height: number }[],
  options: ImageToPdfOptions = { pageSize: 'a4', orientation: 'auto', margin: 'small' }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const marginMap = {
    none: 0,
    small: 20,
    big: 45,
  };
  const m = marginMap[options.margin] || 0;

  for (const imgItem of images) {
    let embeddedImg: any;
    if (imgItem.dataUrl.startsWith('data:image/png')) {
      embeddedImg = await pdfDoc.embedPng(imgItem.dataUrl);
    } else {
      embeddedImg = await pdfDoc.embedJpg(imgItem.dataUrl);
    }

    let pageWidth = PageSizes.A4[0];
    let pageHeight = PageSizes.A4[1];

    if (options.pageSize === 'letter') {
      pageWidth = PageSizes.Letter[0];
      pageHeight = PageSizes.Letter[1];
    } else if (options.pageSize === 'fit') {
      pageWidth = imgItem.width + m * 2;
      pageHeight = imgItem.height + m * 2;
    }

    // Determine orientation
    if (options.orientation === 'landscape' || (options.orientation === 'auto' && imgItem.width > imgItem.height)) {
      if (pageWidth < pageHeight) {
        const temp = pageWidth;
        pageWidth = pageHeight;
        pageHeight = temp;
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate dimensions to fit inside margin
    const availW = pageWidth - m * 2;
    const availH = pageHeight - m * 2;
    const imgAspect = imgItem.width / imgItem.height;
    const availAspect = availW / availH;

    let drawW = availW;
    let drawH = availH;

    if (imgAspect > availAspect) {
      drawH = availW / imgAspect;
    } else {
      drawW = availH * imgAspect;
    }

    const drawX = m + (availW - drawW) / 2;
    const drawY = m + (availH - drawH) / 2;

    page.drawImage(embeddedImg, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  return await pdfDoc.save();
}

/**
 * Render all pages of a PDF to high-res JPG/PNG images and package as a ZIP archive
 */
export async function pdfToImagesAndDownloadZip(
  pdfData: ArrayBuffer | Uint8Array,
  baseFilename = 'pdf_image',
  format: 'png' | 'jpeg' = 'png',
  dpiScale = 2.0,
  onProgress?: (current: number, total: number) => void
) {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js unavailable');

  const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(pdfData) }).promise;
  const total = pdfDoc.numPages;
  const imageFiles: { name: string; data: string; isBase64: boolean }[] = [];

  for (let i = 1; i <= total; i++) {
    if (onProgress) onProgress(i, total);
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: dpiScale });

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

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const dataUrl = canvas.toDataURL(mimeType, 0.95);

    imageFiles.push({
      name: `${baseFilename}_page_${String(i).padStart(3, '0')}.${ext}`,
      data: dataUrl,
      isBase64: true,
    });
  }

  await createAndDownloadZip(imageFiles, `${baseFilename}_images.zip`);
}

/**
 * Extract full text and structured markdown from a PDF document
 */
export async function extractTextFromPdf(
  pdfData: ArrayBuffer | Uint8Array,
  onProgress?: (current: number, total: number) => void
): Promise<{ fullText: string; markdown: string; pageTexts: string[] }> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js unavailable');

  const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(pdfData) }).promise;
  const total = pdfDoc.numPages;
  const pageTexts: string[] = [];
  const markdownSections: string[] = [];

  for (let i = 1; i <= total; i++) {
    if (onProgress) onProgress(i, total);
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    
    // Sort text items by Y descending, then X ascending
    const items = textContent.items as any[];
    let pageStr = '';
    let lastY: number | null = null;

    for (const item of items) {
      if (!('str' in item)) continue;
      const currentY = item.transform[5];
      if (lastY !== null && Math.abs(currentY - lastY) > 8) {
        pageStr += '\n';
      } else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
        pageStr += ' ';
      }
      pageStr += item.str;
      lastY = currentY;
    }

    pageTexts.push(pageStr.trim());
    markdownSections.push(`## Page ${i}\n\n${pageStr.trim()}`);
  }

  const fullText = pageTexts.join('\n\n--- Page Break ---\n\n');
  const markdown = `# Extracted PDF Content\n\n` + markdownSections.join('\n\n---\n\n');

  return { fullText, markdown, pageTexts };
}
