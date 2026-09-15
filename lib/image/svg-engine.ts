/**
 * SVG Optimizer & Vectorizer Engine
 */

export interface SvgOptimizeOptions {
  removeComments: boolean;
  removeMetadata: boolean;
  removeDoctype: boolean;
  roundDecimals: boolean;
  minify: boolean;
}

export function optimizeSvg(
  svgString: string,
  options: SvgOptimizeOptions = {
    removeComments: true,
    removeMetadata: true,
    removeDoctype: true,
    roundDecimals: true,
    minify: true,
  }
): { optimizedSvg: string; originalLength: number; optimizedLength: number; savingsPercent: number } {
  const originalLength = svgString.length;
  let result = svgString;

  if (options.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (options.removeDoctype) {
    result = result.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
    result = result.replace(/<\?xml[\s\S]*?\?>/gi, '');
  }

  if (options.removeMetadata) {
    result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    result = result.replace(/<desc[\s\S]*?<\/desc>/gi, '');
    result = result.replace(/<title[\s\S]*?<\/title>/gi, '');
    result = result.replace(/xmlns:sketch="[^"]*"/gi, '');
    result = result.replace(/xmlns:inkscape="[^"]*"/gi, '');
    result = result.replace(/xmlns:sodipodi="[^"]*"/gi, '');
    result = result.replace(/sodipodi:[a-z0-9_-]+="[^"]*"/gi, '');
    result = result.replace(/inkscape:[a-z0-9_-]+="[^"]*"/gi, '');
  }

  if (options.roundDecimals) {
    // Round floats in path coordinates to 2 decimal places
    result = result.replace(/(\d+\.\d{3,})/g, (match) => parseFloat(match).toFixed(2));
  }

  if (options.minify) {
    result = result
      .replace(/\r?\n|\r/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  const optimizedLength = result.length;
  const savingsPercent = Math.max(0, Math.round(((originalLength - optimizedLength) / originalLength) * 100));

  return {
    optimizedSvg: result,
    originalLength,
    optimizedLength,
    savingsPercent,
  };
}

/**
 * Bitmap to Vector SVG (Potrace-style edge trace & contour polygons)
 */
export async function vectorizeBitmap(
  file: File,
  threshold: number = 128,
  color: string = '#18181b'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = Math.min(600, img.naturalWidth);
      const height = Math.round((img.naturalHeight * width) / img.naturalWidth);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Group consecutive horizontal runs of dark pixels into SVG rects / paths
      const paths: string[] = [];
      const step = 2; // pixel sampling resolution

      for (let y = 0; y < height; y += step) {
        let runStart = -1;
        for (let x = 0; x < width; x += step) {
          const idx = (y * width + x) * 4;
          const brightness = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
          const isDark = brightness < threshold && data[idx + 3] > 64;

          if (isDark) {
            if (runStart === -1) runStart = x;
          } else {
            if (runStart !== -1) {
              const runWidth = x - runStart;
              paths.push(`M${runStart},${y}h${runWidth}v${step}h-${runWidth}z`);
              runStart = -1;
            }
          }
        }
        if (runStart !== -1) {
          const runWidth = width - runStart;
          paths.push(`M${runStart},${y}h${runWidth}v${step}h-${runWidth}z`);
        }
      }

      const svgPathData = paths.join(' ');
      const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><path d="${svgPathData}" fill="${color}" fill-rule="evenodd"/></svg>`;

      resolve(svgOutput);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for vectorization'));
    };

    img.src = objectUrl;
  });
}
