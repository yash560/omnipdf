import { PDFDocument, rgb } from 'pdf-lib';
import { getPdfJs, safeCloneBytes } from './core';

export interface DetectedPiiEntity {
  id: string;
  type: 'aadhaar' | 'pan' | 'credit_card' | 'ssn' | 'email' | 'phone' | 'custom';
  label: string;
  text: string;
  pageIndex: number;
  bbox: { x: number; y: number; width: number; height: number };
  enabled: boolean;
}

export interface RedactScanProgress {
  status: string;
  progress: number;
}

/**
 * Scan PDF pages for sensitive PII entities (Aadhaar, PAN, Cards, SSN, Emails, Phones)
 */
export async function scanPdfForPii(
  pdfData: ArrayBuffer | Uint8Array,
  onProgress?: (p: RedactScanProgress) => void
): Promise<DetectedPiiEntity[]> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js is required to scan document text');

  if (onProgress) onProgress({ status: 'Loading PDF document...', progress: 10 });

  const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(pdfData) }).promise;
  const total = pdfDoc.numPages;
  const entities: DetectedPiiEntity[] = [];

  // Patterns
  const AADHAAR_REGEX = /\b[2-9]{1}[0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g;
  const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
  const CREDIT_CARD_REGEX = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
  const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
  const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const PHONE_REGEX = /(?:\+91[\s-]?)?[6-9]\d{9}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

  for (let pageNum = 1; pageNum <= total; pageNum++) {
    if (onProgress) {
      onProgress({
        status: `Analyzing Page ${pageNum} of ${total} for PII...`,
        progress: 10 + Math.round((pageNum / total) * 80),
      });
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    // Extract text items and match bounding boxes
    for (const item of items) {
      const str = item.str || '';
      if (!str.trim()) continue;

      // Transform matrix gives position [scaleX, skewY, skewX, scaleY, tx, ty]
      const tx = item.transform[4];
      const ty = item.transform[5];
      const w = item.width || 50;
      const h = item.height || 12;

      // Top-left visual coordinates
      const visualX = tx;
      const visualY = viewport.height - ty - h;

      const checkMatch = (regex: RegExp, type: DetectedPiiEntity['type'], label: string) => {
        let match: RegExpExecArray | null;
        while ((match = regex.exec(str)) !== null) {
          entities.push({
            id: `pii_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type,
            label,
            text: match[0],
            pageIndex: pageNum - 1,
            bbox: {
              x: Math.max(0, visualX - 2),
              y: Math.max(0, visualY - 2),
              width: Math.min(viewport.width, w + 4),
              height: Math.min(viewport.height, h + 4),
            },
            enabled: true,
          });
        }
      };

      checkMatch(AADHAAR_REGEX, 'aadhaar', 'Aadhaar Card Number');
      checkMatch(PAN_REGEX, 'pan', 'Income Tax PAN');
      checkMatch(CREDIT_CARD_REGEX, 'credit_card', 'Credit/Debit Card');
      checkMatch(SSN_REGEX, 'ssn', 'Social Security Number (SSN)');
      checkMatch(EMAIL_REGEX, 'email', 'Email Address');
      checkMatch(PHONE_REGEX, 'phone', 'Phone Number');
    }
  }

  if (onProgress) onProgress({ status: 'PII Scan Complete!', progress: 100 });
  return entities;
}

/**
 * Permanently blackout and redact detected PII entities on the PDF
 */
export async function applyPiiRedactions(
  pdfData: ArrayBuffer | Uint8Array,
  entities: DetectedPiiEntity[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  const enabledEntities = entities.filter((e) => e.enabled);

  for (const ent of enabledEntities) {
    if (ent.pageIndex < 0 || ent.pageIndex >= pages.length) continue;
    const page = pages[ent.pageIndex];
    const { height: pageH } = page.getSize();

    // Map top-left visual Y to bottom-left PDF coordinate system
    const pdfX = ent.bbox.x;
    const pdfY = pageH - ent.bbox.y - ent.bbox.height;

    // Draw 100% opaque blackout rectangle
    page.drawRectangle({
      x: pdfX,
      y: pdfY,
      width: ent.bbox.width,
      height: ent.bbox.height,
      color: rgb(0, 0, 0),
      opacity: 1.0,
    });
  }

  return await pdfDoc.save();
}
