import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// PDF.js dynamic loader for browser runtime
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

export async function getPdfJs() {
  if (typeof window === 'undefined') return null;
  if (!pdfjsLib) {
    const pdfjs = await import('pdfjs-dist');
    // Set standard unpkg or cdnjs worker url
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    pdfjsLib = pdfjs;
  }
  return pdfjsLib;
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function safeCloneBytes(data: ArrayBuffer | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return copy;
  }
  const uint = new Uint8Array(data);
  const copy = new Uint8Array(uint.byteLength);
  copy.set(uint);
  return copy;
}

export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

export function downloadBytes(bytes: Uint8Array, filename: string, mimeType = 'application/pdf') {
  const copy = safeCloneBytes(bytes);
  const blob = new Blob([copy as any], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Render a single page of a PDF file to a high quality Data URL (image/png or image/jpeg)
 */
export async function renderPageToDataUrl(
  pdfData: ArrayBuffer | Uint8Array,
  pageNumber: number,
  scale = 1.5,
  rotation = 0
): Promise<{ dataUrl: string; width: number; height: number }> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js could not be loaded in this environment');

  const loadingTask = pdfjs.getDocument({
    data: safeCloneBytes(pdfData),
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);

  const viewport = page.getViewport({ scale, rotation });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) throw new Error('Could not create canvas 2d context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Background white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
    canvas,
  } as any).promise;

  const dataUrl = canvas.toDataURL('image/png', 0.95);
  return {
    dataUrl,
    width: viewport.width,
    height: viewport.height,
  };
}

/**
 * Generate thumbnails for all pages of a PDF
 */
export async function renderAllPageThumbnails(
  pdfData: ArrayBuffer | Uint8Array,
  maxPages = 50,
  scale = 0.5
): Promise<{ pageNumber: number; dataUrl: string; width: number; height: number }[]> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) return [];

  const loadingTask = pdfjs.getDocument({ data: safeCloneBytes(pdfData) });
  const pdfDoc = await loadingTask.promise;
  const total = Math.min(pdfDoc.numPages, maxPages);

  const thumbnails: { pageNumber: number; dataUrl: string; width: number; height: number }[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas,
    } as any).promise;

    thumbnails.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL('image/jpeg', 0.8),
      width: viewport.width,
      height: viewport.height,
    });
  }

  return thumbnails;
}

/**
 * Package multiple files into a single ZIP archive for instant browser download
 */
export async function createAndDownloadZip(
  files: { name: string; data: Uint8Array | Blob | string; isBase64?: boolean }[],
  zipFilename: string
) {
  const zip = new JSZip();

  for (const item of files) {
    if (item.isBase64 && typeof item.data === 'string') {
      const base64Data = item.data.replace(/^data:image\/\w+;base64,/, '');
      zip.file(item.name, base64Data, { base64: true });
    } else {
      zip.file(item.name, item.data);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipFilename);
}
