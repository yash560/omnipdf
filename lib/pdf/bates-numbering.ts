import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface BatesConfig {
  prefix: string;
  suffix: string;
  startNumber: number;
  digitCount: number; // e.g. 6 -> 000001
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  fontSize?: number;
  color?: string; // hex
  margin?: number; // pt
  pageSelection?: 'all' | 'custom';
  pageNumbers?: number[];
}

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

/**
 * Apply sequential Bates numbering across PDF document pages
 */
export async function applyBatesNumbering(
  pdfData: ArrayBuffer | Uint8Array,
  config: BatesConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const total = pages.length;
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = config.fontSize || 10;
  const margin = config.margin ?? 36; // 0.5 inch default margin
  const colorObj = hexToRgb(config.color || '#000000');
  const rgbColor = rgb(colorObj.r, colorObj.g, colorObj.b);

  let currentNumber = config.startNumber;

  for (let i = 1; i <= total; i++) {
    const isIncluded =
      config.pageSelection !== 'custom' || (config.pageNumbers && config.pageNumbers.includes(i));

    if (!isIncluded) continue;

    const page = pages[i - 1];
    const { width, height } = page.getSize();

    const paddedNum = currentNumber.toString().padStart(config.digitCount, '0');
    const batesText = `${config.prefix}${paddedNum}${config.suffix}`;
    const textWidth = font.widthOfTextAtSize(batesText, fontSize);

    let x = margin;
    let y = margin;

    switch (config.position) {
      case 'top-left':
        x = margin;
        y = height - margin - fontSize;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - margin - fontSize;
        break;
      case 'top-right':
        x = width - margin - textWidth;
        y = height - margin - fontSize;
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
        x = width - margin - textWidth;
        y = margin;
        break;
    }

    page.drawText(batesText, {
      x,
      y,
      size: fontSize,
      font,
      color: rgbColor,
      opacity: 1.0,
    });

    currentNumber++;
  }

  return await pdfDoc.save();
}
