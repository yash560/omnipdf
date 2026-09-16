import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import { getPdfJs, safeCloneBytes } from './core';

export interface DocxProgress {
  status: string;
  progress: number;
}

/**
 * Convert PDF pages and text streams into a structured Microsoft Word document (.docx)
 */
export async function convertPdfToDocx(
  pdfData: ArrayBuffer | Uint8Array,
  onProgress?: (p: DocxProgress) => void
): Promise<Blob> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js engine is required for DOCX conversion');

  if (onProgress) onProgress({ status: 'Analyzing document structure...', progress: 10 });

  const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(pdfData) }).promise;
  const total = pdfDoc.numPages;
  const docParagraphs: Paragraph[] = [];

  for (let pageNum = 1; pageNum <= total; pageNum++) {
    if (onProgress) {
      onProgress({
        status: `Extracting Page ${pageNum} of ${total} to DOCX...`,
        progress: 10 + Math.round((pageNum / total) * 80),
      });
    }

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    // Group items into lines based on Y coordinate
    const lineMap = new Map<number, string[]>();
    for (const item of items) {
      const str = item.str || '';
      if (!str.trim()) continue;

      const y = Math.round(item.transform[5] / 4) * 4; // Tolerance bucket
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push(str);
    }

    // Sort descending by Y (top of page first)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

    if (pageNum > 1) {
      docParagraphs.push(
        new Paragraph({
          text: `--- Page ${pageNum} ---`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    }

    for (const y of sortedY) {
      const lineText = lineMap.get(y)!.join(' ').trim();
      if (lineText) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: lineText,
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs.length > 0 ? docParagraphs : [new Paragraph({ text: 'Empty Document' })],
      },
    ],
  });

  if (onProgress) onProgress({ status: 'Packaging Word document...', progress: 95 });

  return await Packer.toBlob(doc);
}
