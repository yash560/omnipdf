import { PDFDocument, degrees } from 'pdf-lib';

export interface LightboxPageItem {
  id: string;
  sourceDocId: string;
  sourceDocName: string;
  pageIndex: number; // 0-indexed in source doc
  displayPageNumber: number;
  rotation: number; // 0, 90, 180, 270
  thumbnailDataUrl?: string;
}

export interface SourceDocument {
  id: string;
  name: string;
  data: ArrayBuffer | Uint8Array;
}

/**
 * Merge and assemble a master PDF from light-box assembled pages across multiple source documents
 */
export async function assembleMasterPdf(
  sources: SourceDocument[],
  pagesOrder: LightboxPageItem[]
): Promise<Uint8Array> {
  const masterDoc = await PDFDocument.create();

  // Load all source PDF documents
  const loadedDocs = new Map<string, PDFDocument>();
  for (const src of sources) {
    const doc = await PDFDocument.load(src.data, { ignoreEncryption: true });
    loadedDocs.set(src.id, doc);
  }

  for (const item of pagesOrder) {
    const srcDoc = loadedDocs.get(item.sourceDocId);
    if (!srcDoc) continue;

    const [copiedPage] = await masterDoc.copyPages(srcDoc, [item.pageIndex]);

    if (item.rotation) {
      const currentAngle = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentAngle + item.rotation) % 360));
    }

    masterDoc.addPage(copiedPage);
  }

  return await masterDoc.save({ useObjectStreams: true });
}
