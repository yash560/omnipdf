import { PDFDocument } from 'pdf-lib';

export interface SplitRange {
  name: string;
  pages: number[]; // 1-indexed
}

/**
 * Parses user range string like "1-3, 5, 8-10" into array of page numbers
 */
export function parsePageRangeString(rangeStr: string, maxPages: number): number[] {
  const pagesSet = new Set<number>();
  const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(maxPages, parseInt(endStr, 10) || maxPages);
      for (let p = start; p <= end; p++) {
        pagesSet.add(p);
      }
    } else {
      const p = parseInt(part, 10);
      if (p >= 1 && p <= maxPages) {
        pagesSet.add(p);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Split a single PDF into one or more PDF documents based on ranges or single pages
 */
export async function splitPdf(
  data: ArrayBuffer | Uint8Array,
  ranges: SplitRange[],
  onProgress?: (progress: number) => void
): Promise<{ filename: string; bytes: Uint8Array }[]> {
  const sourcePdf = await PDFDocument.load(data, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();
  const results: { filename: string; bytes: Uint8Array }[] = [];

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    if (onProgress) {
      onProgress(Math.round(((i + 1) / ranges.length) * 100));
    }

    const newPdf = await PDFDocument.create();
    const validIndices = range.pages
      .map((p) => p - 1)
      .filter((idx) => idx >= 0 && idx < totalPages);

    if (validIndices.length > 0) {
      const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));
      const bytes = await newPdf.save();
      results.push({
        filename: `${range.name}.pdf`,
        bytes,
      });
    }
  }

  return results;
}

/**
 * Burst every page into an individual single-page PDF
 */
export async function burstPdfPages(
  data: ArrayBuffer | Uint8Array,
  baseFilename = 'page',
  onProgress?: (progress: number) => void
): Promise<{ filename: string; bytes: Uint8Array }[]> {
  const sourcePdf = await PDFDocument.load(data, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();
  const ranges: SplitRange[] = [];

  for (let p = 1; p <= totalPages; p++) {
    ranges.push({
      name: `${baseFilename}_page_${p}`,
      pages: [p],
    });
  }

  return await splitPdf(data, ranges, onProgress);
}
