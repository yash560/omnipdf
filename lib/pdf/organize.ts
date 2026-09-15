import { PDFDocument, degrees } from 'pdf-lib';

export interface PageAction {
  sourcePageIndex: number; // 0-indexed original page, or -1 for blank page
  rotation: number; // 0, 90, 180, 270 relative rotation
  deleted?: boolean;
}

/**
 * Reorganizes pages of a PDF: reorders, deletes, applies per-page rotations, or inserts blanks
 */
export async function organizePdf(
  data: ArrayBuffer | Uint8Array,
  pageActions: PageAction[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(data, { ignoreEncryption: true });
  const totalOriginalPages = sourcePdf.getPageCount();
  const outputPdf = await PDFDocument.create();

  // Filter out deleted pages
  const activeActions = pageActions.filter((a) => !a.deleted);

  // Group pages that need copying from source
  const indicesToCopy = activeActions
    .map((a) => a.sourcePageIndex)
    .filter((idx) => idx >= 0 && idx < totalOriginalPages);

  // Map of copied pages
  const copiedPages = await outputPdf.copyPages(sourcePdf, indicesToCopy);
  let copiedCounter = 0;

  for (const action of activeActions) {
    if (action.sourcePageIndex === -1) {
      // Add a standard letter/A4 blank page
      const blankPage = outputPdf.addPage([595.28, 841.89]); // A4 dimensions
      if (action.rotation) {
        blankPage.setRotation(degrees(action.rotation));
      }
    } else if (action.sourcePageIndex >= 0 && action.sourcePageIndex < totalOriginalPages) {
      const page = copiedPages[copiedCounter++];
      if (action.rotation) {
        const currentAngle = page.getRotation().angle;
        page.setRotation(degrees((currentAngle + action.rotation) % 360));
      }
      outputPdf.addPage(page);
    }
  }

  return await outputPdf.save();
}

/**
 * Rotate all pages of a PDF by a fixed angle (90, 180, 270)
 */
export async function rotateAllPages(
  data: ArrayBuffer | Uint8Array,
  angleDegrees: number
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(data, { ignoreEncryption: true });
  const pages = pdf.getPages();

  for (const page of pages) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angleDegrees) % 360));
  }

  return await pdf.save();
}
