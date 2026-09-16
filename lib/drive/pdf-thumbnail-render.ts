import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import path from 'node:path';

// Canonical raster width we cache server-side; per-request sizes are cheap
// sharp resizes of this buffer, so the expensive PDF decode+render happens once.
export const PDF_THUMBNAIL_CANONICAL_WIDTH = 480;

let pdfjsPromise: Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')> | null = null;

function getPdfJsNode() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = '';
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

// Minimal canvas factory bridging pdf.js's rendering pipeline to @napi-rs/canvas
class NapiCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(Math.max(1, Math.ceil(width)), Math.max(1, Math.ceil(height)));
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
  reset(canvasAndContext: { canvas: any; context: any }, width: number, height: number) {
    canvasAndContext.canvas.width = Math.max(1, Math.ceil(width));
    canvasAndContext.canvas.height = Math.max(1, Math.ceil(height));
  }
  destroy(canvasAndContext: { canvas: any; context: any }) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    (canvasAndContext as any).canvas = null;
    (canvasAndContext as any).context = null;
  }
}

/**
 * Render page 1 of a PDF buffer to a PNG buffer, server-side, no browser required.
 * Returns null on any failure (corrupt/encrypted/empty PDF) rather than throwing,
 * so callers can fall back to the generic file icon without breaking the UI.
 */
export async function renderPdfFirstPageToPng(
  buffer: Buffer,
  targetWidth: number = PDF_THUMBNAIL_CANONICAL_WIDTH
): Promise<Buffer | null> {
  let loadingTask: any = null;
  let page: any = null;
  try {
    const pdfjs = await getPdfJsNode();

    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      standardFontDataUrl: path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/') + '/',
      cMapUrl: path.join(process.cwd(), 'node_modules/pdfjs-dist/cmaps/') + '/',
      cMapPacked: true,
      useSystemFonts: true,
    } as any);

    const doc = await loadingTask.promise;
    if (!doc || doc.numPages < 1) return null;

    page = await doc.getPage(1);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(3, Math.max(0.1, targetWidth / unscaledViewport.width));
    const viewport = page.getViewport({ scale });

    const canvasFactory = new NapiCanvasFactory();
    const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context as unknown as SKRSContext2D,
      viewport,
    }).promise;

    return canvas.toBuffer('image/png');
  } catch (err) {
    console.warn('[PdfThumbnailRender] Failed to render PDF page 1:', (err as Error)?.message);
    return null;
  } finally {
    try {
      page?.cleanup?.();
    } catch {}
    try {
      await loadingTask?.destroy?.();
    } catch {}
  }
}
