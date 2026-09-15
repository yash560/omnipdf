import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { WatermarkConfig } from '@/types/pdf';

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

/**
 * Apply text or image watermark to all pages of a PDF
 */
export async function applyWatermark(
  data: ArrayBuffer | Uint8Array,
  config: WatermarkConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const color = hexToRgb(config.color || '#000000');

  let embeddedImage: any = null;
  if (config.type === 'image' && config.imageDataUrl) {
    if (config.imageDataUrl.startsWith('data:image/png')) {
      embeddedImage = await pdfDoc.embedPng(config.imageDataUrl);
    } else {
      embeddedImage = await pdfDoc.embedJpg(config.imageDataUrl);
    }
  }

  for (const page of pages) {
    const { width, height } = page.getSize();
    const text = config.text || 'CONFIDENTIAL';
    const textWidth = font.widthOfTextAtSize(text, config.fontSize);
    const textHeight = font.heightAtSize(config.fontSize);

    if (config.position === 'mosaic') {
      // Draw grid of watermarks diagonally
      const stepX = textWidth + 120;
      const stepY = textHeight + 100;

      for (let x = -width; x < width * 2; x += stepX) {
        for (let y = -height; y < height * 2; y += stepY) {
          if (config.type === 'text') {
            page.drawText(text, {
              x,
              y,
              size: config.fontSize,
              font,
              color: rgb(color.r, color.g, color.b),
              opacity: config.opacity,
              rotate: degrees(config.rotation || 45),
            });
          }
        }
      }
    } else {
      // Calculate coordinates based on 3x3 anchor grid
      let x = (width - textWidth) / 2;
      let y = (height - textHeight) / 2;

      switch (config.position) {
        case 'top-left':
          x = 40;
          y = height - textHeight - 40;
          break;
        case 'top-center':
          x = (width - textWidth) / 2;
          y = height - textHeight - 40;
          break;
        case 'top-right':
          x = width - textWidth - 40;
          y = height - textHeight - 40;
          break;
        case 'middle-left':
          x = 40;
          y = (height - textHeight) / 2;
          break;
        case 'center':
          x = (width - textWidth) / 2;
          y = (height - textHeight) / 2;
          break;
        case 'middle-right':
          x = width - textWidth - 40;
          y = (height - textHeight) / 2;
          break;
        case 'bottom-left':
          x = 40;
          y = 40;
          break;
        case 'bottom-center':
          x = (width - textWidth) / 2;
          y = 40;
          break;
        case 'bottom-right':
          x = width - textWidth - 40;
          y = 40;
          break;
      }

      if (config.type === 'text') {
        page.drawText(text, {
          x,
          y,
          size: config.fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity: config.opacity,
          rotate: degrees(config.rotation || 0),
        });
      } else if (embeddedImage) {
        const imgDims = embeddedImage.scale(0.5);
        page.drawImage(embeddedImage, {
          x: (width - imgDims.width) / 2,
          y: (height - imgDims.height) / 2,
          width: imgDims.width,
          height: imgDims.height,
          opacity: config.opacity,
          rotate: degrees(config.rotation || 0),
        });
      }
    }
  }

  return await pdfDoc.save();
}
