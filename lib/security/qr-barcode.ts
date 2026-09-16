import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export interface QrOptions {
  text: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  ecc?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

export interface BarcodeOptions {
  text: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'ITF14';
  width?: number;
  height?: number;
  displayValue?: boolean;
  lineColor?: string;
  background?: string;
  fontSize?: number;
}

/**
 * Generate standard ISO/IEC 18004 compliant SVG QR code
 */
export async function generateQrSvg(options: QrOptions): Promise<string> {
  const text = options.text || 'https://thewebvale.com';
  const size = options.size || 256;
  const fgColor = options.fgColor || '#000000';
  const bgColor = options.bgColor || '#ffffff';
  const ecc = options.ecc || 'M';
  const margin = options.margin ?? 2;

  const svgString = await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: ecc,
    margin,
    color: {
      dark: fgColor,
      light: bgColor,
    },
    width: size,
  });

  return svgString;
}

/**
 * Generate PNG Data URL for QR code (with optional center logo embedding)
 */
export async function generateQrDataUrl(
  options: QrOptions,
  logoDataUrl?: string
): Promise<string> {
  const text = options.text || 'https://thewebvale.com';
  const size = options.size || 512;
  const fgColor = options.fgColor || '#000000';
  const bgColor = options.bgColor || '#ffffff';
  const ecc = logoDataUrl ? 'H' : options.ecc || 'M';
  const margin = options.margin ?? 2;

  const baseDataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: ecc,
    margin,
    color: {
      dark: fgColor,
      light: bgColor,
    },
    width: size,
  });

  if (!logoDataUrl || typeof window === 'undefined') {
    return baseDataUrl;
  }

  // Draw logo on center of canvas
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(baseDataUrl);
      return;
    }

    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0);

      const logo = new Image();
      logo.onload = () => {
        const logoSize = Math.round(size * 0.22);
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        // White circular or rounded badge behind logo
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, logoSize * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        resolve(canvas.toDataURL('image/png'));
      };
      logo.onerror = () => resolve(baseDataUrl);
      logo.src = logoDataUrl;
    };
    qrImg.onerror = () => resolve(baseDataUrl);
    qrImg.src = baseDataUrl;
  });
}

/**
 * Generate standard 1D Barcode SVG (Code128, EAN-13, UPC, Code39)
 */
export function generateBarcodeSvg(options: BarcodeOptions): string {
  if (typeof document === 'undefined') return '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  
  try {
    JsBarcode(svg, options.text, {
      format: options.format || 'CODE128',
      width: options.width || 2,
      height: options.height || 60,
      displayValue: options.displayValue !== false,
      lineColor: options.lineColor || '#000000',
      background: options.background || '#ffffff',
      fontSize: options.fontSize || 14,
      margin: 10,
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  } catch (err) {
    console.error('JsBarcode render error:', err);
    throw new Error(`Invalid barcode format or checksum for "${options.text}"`);
  }
}
