import { PDFDocument, degrees } from 'pdf-lib';

export interface MergeSource {
  data: ArrayBuffer | Uint8Array;
  name?: string;
  selectedPages?: number[]; // 1-indexed, or omit for all
  rotation?: number; // additional rotation
}

/**
 * Merge multiple PDF documents into a single PDF
 */
export async function mergePdfs(
  sources: MergeSource[],
  onProgress?: (progress: number, currentFile: string) => void
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    if (onProgress) {
      onProgress(Math.round(((i + 1) / sources.length) * 100), src.name || `Document ${i + 1}`);
    }

    const pdf = await PDFDocument.load(src.data, { ignoreEncryption: true });
    const totalPages = pdf.getPageCount();
    
    // Determine which page indices (0-indexed) to copy
    let pageIndices: number[] = [];
    if (src.selectedPages && src.selectedPages.length > 0) {
      pageIndices = src.selectedPages
        .map((p) => p - 1)
        .filter((idx) => idx >= 0 && idx < totalPages);
    } else {
      pageIndices = Array.from({ length: totalPages }, (_, idx) => idx);
    }

    const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);

    for (const page of copiedPages) {
      if (src.rotation) {
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees((currentRot + src.rotation) % 360));
      }
      mergedPdf.addPage(page);
    }
  }

  return await mergedPdf.save();
}
