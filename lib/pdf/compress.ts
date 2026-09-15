import { PDFDocument } from 'pdf-lib';
import { getPdfJs, safeCloneBytes } from './core';

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

/**
 * Compress PDF using stream optimization and image re-encoding
 */
export async function compressPdf(
  data: ArrayBuffer | Uint8Array,
  qualityLevel: 'extreme' | 'recommended' | 'less' = 'recommended',
  onProgress?: (progress: number) => void
): Promise<{ bytes: Uint8Array; stats: CompressionStats }> {
  const originalSize = data.byteLength;
  if (onProgress) onProgress(20);

  // Quality settings
  const scaleMap = {
    extreme: 0.9,
    recommended: 1.3,
    less: 1.8,
  };
  const jpegQualityMap = {
    extreme: 0.45,
    recommended: 0.7,
    less: 0.88,
  };

  const scale = scaleMap[qualityLevel];
  const jpegQuality = jpegQualityMap[qualityLevel];

  // Rasterize each page with compressed JPEG streams and rebuild optimized document
  const pdfjs = await getPdfJs();
  if (!pdfjs) {
    // Fallback: standard pdf-lib repack
    const doc = await PDFDocument.load(data, { ignoreEncryption: true });
    const bytes = await doc.save({ useObjectStreams: true });
    return {
      bytes,
      stats: {
        originalSize,
        compressedSize: bytes.byteLength,
        savedPercentage: Math.max(0, Math.round(((originalSize - bytes.byteLength) / originalSize) * 100)),
      },
    };
  }

  const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(data) }).promise;
  const total = pdfDoc.numPages;
  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= total; i++) {
    if (onProgress) onProgress(20 + Math.round((i / total) * 70));
    const page = await pdfDoc.getPage(i);
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
      viewport: viewport,
      canvas,
    } as any).promise;

    const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const embeddedImg = await newPdf.embedJpg(jpegDataUrl);

    // Page dimensions matching original aspect ratio
    const originalViewport = page.getViewport({ scale: 1.0 });
    const newPdfPage = newPdf.addPage([originalViewport.width, originalViewport.height]);

    newPdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }

  if (onProgress) onProgress(95);

  const compressedBytes = await newPdf.save({ useObjectStreams: true });
  const compressedSize = compressedBytes.byteLength;
  const savedPercentage = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

  if (onProgress) onProgress(100);

  return {
    bytes: compressedBytes,
    stats: {
      originalSize,
      compressedSize,
      savedPercentage,
    },
  };
}
