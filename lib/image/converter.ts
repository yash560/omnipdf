/**
 * In-browser Image Converter Engine
 * Converts between PNG, JPG, WEBP, AVIF, ICO, BMP, and SVG wrapper
 */

export type TargetImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif' | 'image/x-icon' | 'image/bmp' | 'image/svg+xml';

export interface ImageConvertOptions {
  format: TargetImageFormat;
  quality?: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
}

export async function convertImage(
  file: File,
  options: ImageConvertOptions
): Promise<{ blob: Blob; fileName: string; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth;
      let targetHeight = img.naturalHeight;

      if (options.maxWidth && targetWidth > options.maxWidth) {
        const ratio = options.maxWidth / targetWidth;
        targetWidth = options.maxWidth;
        targetHeight = Math.round(targetHeight * ratio);
      }
      if (options.maxHeight && targetHeight > options.maxHeight) {
        const ratio = options.maxHeight / targetHeight;
        targetHeight = options.maxHeight;
        targetWidth = Math.round(targetWidth * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      // If converting to JPEG or BMP, fill white background to prevent black alpha transparent artifacts
      if (options.format === 'image/jpeg' || options.format === 'image/bmp') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const extMap: Record<TargetImageFormat, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
        'image/avif': 'avif',
        'image/x-icon': 'ico',
        'image/bmp': 'bmp',
        'image/svg+xml': 'svg',
      };
      const ext = extMap[options.format] || 'png';
      const outputFileName = `${baseName}.${ext}`;

      // Handle SVG encapsulation
      if (options.format === 'image/svg+xml') {
        const pngDataUrl = canvas.toDataURL('image/png');
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}" viewBox="0 0 ${targetWidth} ${targetHeight}"><image width="${targetWidth}" height="${targetHeight}" href="${pngDataUrl}"/></svg>`;
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        resolve({
          blob: svgBlob,
          fileName: outputFileName,
          dataUrl: URL.createObjectURL(svgBlob),
          width: targetWidth,
          height: targetHeight,
        });
        return;
      }

      // Standard canvas toBlob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to dataURL
            const dataUrl = canvas.toDataURL(options.format, options.quality ?? 0.92);
            fetch(dataUrl)
              .then((res) => res.blob())
              .then((fallbackBlob) => {
                resolve({
                  blob: fallbackBlob,
                  fileName: outputFileName,
                  dataUrl,
                  width: targetWidth,
                  height: targetHeight,
                });
              })
              .catch(reject);
            return;
          }

          resolve({
            blob,
            fileName: outputFileName,
            dataUrl: URL.createObjectURL(blob),
            width: targetWidth,
            height: targetHeight,
          });
        },
        options.format,
        options.quality ?? 0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to decode image file: ${file.name}`));
    };

    img.src = objectUrl;
  });
}
