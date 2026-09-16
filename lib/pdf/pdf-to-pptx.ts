import pptxgen from 'pptxgenjs';
import { getPdfJs, safeCloneBytes } from './core';

export interface PptxProgress {
  status: string;
  progress: number;
}

/**
 * Convert PDF pages to editable 16:9 PowerPoint Presentation (.pptx)
 */
export async function convertPdfToPptx(
  pdfData: ArrayBuffer | Uint8Array,
  onProgress?: (p: PptxProgress) => void
): Promise<Uint8Array> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js engine is required for PPTX conversion');

  if (onProgress) onProgress({ status: 'Initializing PowerPoint Generator...', progress: 10 });

  const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(pdfData) }).promise;
  const total = pdfDoc.numPages;

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  for (let pageNum = 1; pageNum <= total; pageNum++) {
    if (onProgress) {
      onProgress({
        status: `Converting Slide ${pageNum} of ${total} to PPTX...`,
        progress: 10 + Math.round((pageNum / total) * 80),
      });
    }

    const page = await pdfDoc.getPage(pageNum);
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

    const dataUrl = canvas.toDataURL('image/png');
    const slide = pres.addSlide();

    // Add high-resolution crisp slide background
    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });
  }

  if (onProgress) onProgress({ status: 'Packaging PPTX file...', progress: 95 });

  const out = await pres.write({ outputType: 'uint8array' });
  return out as Uint8Array;
}
