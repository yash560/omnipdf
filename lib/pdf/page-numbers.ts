import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PageNumberConfig } from '@/types/pdf';

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

/**
 * Add page numbers across all pages of a PDF document
 */
export async function addPageNumbers(
  data: ArrayBuffer | Uint8Array,
  config: PageNumberConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color = hexToRgb(config.color || '#4b5563');
  const margin = config.margin || 30;

  for (let i = 0; i < totalPages; i++) {
    const pageIndex = i; // 0-indexed
    const pageNum = i + (config.startPage || 1);

    // Format text
    let text = `${pageNum}`;
    if (config.format === 'page-n') {
      text = `Page ${pageNum}`;
    } else if (config.format === 'page-n-of-total') {
      text = `Page ${pageNum} of ${totalPages}`;
    } else if (config.format === 'n-slash-total') {
      text = `${pageNum}/${totalPages}`;
    }

    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, config.fontSize);
    const textHeight = font.heightAtSize(config.fontSize);

    let x = (width - textWidth) / 2;
    let y = margin;

    switch (config.position) {
      case 'top-left':
        x = margin;
        y = height - textHeight - margin;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - textHeight - margin;
        break;
      case 'top-right':
        x = width - textWidth - margin;
        y = height - textHeight - margin;
        break;
      case 'bottom-left':
        x = margin;
        y = margin;
        break;
      case 'bottom-center':
        x = (width - textWidth) / 2;
        y = margin;
        break;
      case 'bottom-right':
        x = width - textWidth - margin;
        y = margin;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: config.fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  return await pdfDoc.save();
}
