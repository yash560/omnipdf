/**
 * Color Palette Extractor & Accessibility Analyzer
 */

export interface ExtractedColor {
  hex: string;
  rgb: string;
  hsl: string;
  count: number;
  percentage: number;
  tailwindName: string;
  contrastWhite: number;
  contrastBlack: number;
  wcagWhite: 'AAA' | 'AA' | 'Fail';
  wcagBlack: 'AAA' | 'AA' | 'Fail';
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function matchTailwindName(hex: string): string {
  const colorMap: Record<string, string> = {
    '#ef4444': 'red-500',
    '#f97316': 'orange-500',
    '#f59e0b': 'amber-500',
    '#eab308': 'yellow-500',
    '#84cc16': 'lime-500',
    '#10b981': 'emerald-500',
    '#14b8a6': 'teal-500',
    '#06b6d4': 'cyan-500',
    '#0284c7': 'sky-500',
    '#3b82f6': 'blue-500',
    '#6366f1': 'indigo-500',
    '#8b5cf6': 'violet-500',
    '#a855f7': 'purple-500',
    '#d946ef': 'fuchsia-500',
    '#ec4899': 'pink-500',
    '#f43f5e': 'rose-500',
    '#ffffff': 'white',
    '#000000': 'black',
    '#71717a': 'zinc-500',
  };
  return colorMap[hex.toLowerCase()] || `brand-accent`;
}

export async function extractPalette(
  file: File,
  colorCount: number = 6
): Promise<ExtractedColor[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = 150;
      const height = Math.round((img.naturalHeight * width) / img.naturalWidth);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Quantize colors into buckets of 16 for clustering
      const colorBuckets = new Map<string, { r: number; g: number; b: number; count: number }>();
      let totalPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue; // ignore transparent pixels
        totalPixels++;

        const qr = Math.round(data[i] / 24) * 24;
        const qg = Math.round(data[i + 1] / 24) * 24;
        const qb = Math.round(data[i + 2] / 24) * 24;
        const key = `${qr},${qg},${qb}`;

        const existing = colorBuckets.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorBuckets.set(key, { r: qr, g: qg, b: qb, count: 1 });
        }
      }

      const sorted = Array.from(colorBuckets.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, colorCount);

      const whiteLum = 1.0;
      const blackLum = 0.0;

      const palette: ExtractedColor[] = sorted.map((c) => {
        const hex = rgbToHex(c.r, c.g, c.b);
        const rgb = `rgb(${c.r}, ${c.g}, ${c.b})`;
        const hsl = rgbToHsl(c.r, c.g, c.b);
        const lum = getLuminance(c.r, c.g, c.b);

        const contrastWhite = parseFloat(getContrastRatio(lum, whiteLum).toFixed(2));
        const contrastBlack = parseFloat(getContrastRatio(lum, blackLum).toFixed(2));

        return {
          hex,
          rgb,
          hsl,
          count: c.count,
          percentage: Math.round((c.count / Math.max(1, totalPixels)) * 100),
          tailwindName: matchTailwindName(hex),
          contrastWhite,
          contrastBlack,
          wcagWhite: contrastWhite >= 7 ? 'AAA' : contrastWhite >= 4.5 ? 'AA' : 'Fail',
          wcagBlack: contrastBlack >= 7 ? 'AAA' : contrastBlack >= 4.5 ? 'AA' : 'Fail',
        };
      });

      resolve(palette);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for palette extraction'));
    };

    img.src = objectUrl;
  });
}
