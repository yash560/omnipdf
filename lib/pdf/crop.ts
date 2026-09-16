import { PDFDocument } from 'pdf-lib';

export interface CropMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface CropBoxCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOptions {
  mode: 'margins' | 'box';
  margins?: CropMargins;
  box?: CropBoxCoords;
  unit?: 'pt' | 'px' | 'mm' | 'percent';
  pageSelection?: 'all' | 'custom';
  pageNumbers?: number[];
}

/**
 * Precision PDF Crop Engine
 * Adjusts MediaBox, CropBox, and TrimBox on PDF pages
 */
export async function cropPdf(
  data: ArrayBuffer | Uint8Array,
  options: CropOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const total = pages.length;

  const targetPages =
    options.pageSelection === 'custom' && options.pageNumbers && options.pageNumbers.length > 0
      ? options.pageNumbers
      : Array.from({ length: total }, (_, i) => i + 1);

  for (const pageNum of targetPages) {
    if (pageNum < 1 || pageNum > total) continue;
    const page = pages[pageNum - 1];
    const { width, height } = page.getSize();

    if (options.mode === 'margins' && options.margins) {
      let { top, bottom, left, right } = options.margins;

      // Handle percentage or unit conversions
      if (options.unit === 'percent') {
        left = (left / 100) * width;
        right = (right / 100) * width;
        top = (top / 100) * height;
        bottom = (bottom / 100) * height;
      } else if (options.unit === 'mm') {
        const mmToPt = 72 / 25.4;
        left *= mmToPt;
        right *= mmToPt;
        top *= mmToPt;
        bottom *= mmToPt;
      }

      const newX = Math.max(0, left);
      const newY = Math.max(0, bottom);
      const newWidth = Math.max(20, width - left - right);
      const newHeight = Math.max(20, height - top - bottom);

      page.setMediaBox(newX, newY, newWidth, newHeight);
      page.setCropBox(newX, newY, newWidth, newHeight);
    } else if (options.mode === 'box' && options.box) {
      let { x, y, width: boxW, height: boxH } = options.box;

      if (options.unit === 'percent') {
        x = (x / 100) * width;
        y = (y / 100) * height;
        boxW = (boxW / 100) * width;
        boxH = (boxH / 100) * height;
      }

      // Convert from top-left visual Y to bottom-left PDF coordinate system
      const pdfY = height - y - boxH;

      const safeX = Math.max(0, Math.min(width - 20, x));
      const safeY = Math.max(0, Math.min(height - 20, pdfY));
      const safeW = Math.max(20, Math.min(width - safeX, boxW));
      const safeH = Math.max(20, Math.min(height - safeY, boxH));

      page.setMediaBox(safeX, safeY, safeW, safeH);
      page.setCropBox(safeX, safeY, safeW, safeH);
    }
  }

  return await pdfDoc.save();
}
