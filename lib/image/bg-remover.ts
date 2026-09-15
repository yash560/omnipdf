/**
 * 100% In-Browser Background Removal & Alpha Matting Engine
 */

export interface BgRemovalOptions {
  tolerance: number; // 1 to 100
  feather: number; // 0 to 10
  mode: 'auto' | 'color' | 'edge';
  keyColor?: { r: number; g: number; b: number };
  replacementBg?: {
    type: 'transparent' | 'color' | 'gradient';
    color?: string;
    gradient?: string;
  };
}

export async function removeBackground(
  file: File,
  options: BgRemovalOptions
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas error'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Sample 4 corner pixels to determine background reference color
      const sampleCorners = [
        { r: data[0], g: data[1], b: data[2] }, // Top-Left
        { r: data[(width - 1) * 4], g: data[(width - 1) * 4 + 1], b: data[(width - 1) * 4 + 2] }, // Top-Right
        { r: data[(height - 1) * width * 4], g: data[(height - 1) * width * 4 + 1], b: data[(height - 1) * width * 4 + 2] }, // Bottom-Left
        { r: data[data.length - 4], g: data[data.length - 3], b: data[data.length - 2] }, // Bottom-Right
      ];

      // Use average of corners or custom keyColor
      const bgR = options.keyColor ? options.keyColor.r : Math.round((sampleCorners[0].r + sampleCorners[1].r + sampleCorners[2].r + sampleCorners[3].r) / 4);
      const bgG = options.keyColor ? options.keyColor.g : Math.round((sampleCorners[0].g + sampleCorners[1].g + sampleCorners[2].g + sampleCorners[3].g) / 4);
      const bgB = options.keyColor ? options.keyColor.b : Math.round((sampleCorners[0].b + sampleCorners[1].b + sampleCorners[2].b + sampleCorners[3].b) / 4);

      const tol = options.tolerance * 2.55; // scale 0-100 to 0-255

      // Alpha mask array
      const mask = new Uint8Array(width * height);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance in RGB color space
        const dist = Math.sqrt(
          Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
        );

        const pixelIdx = i / 4;
        if (dist < tol) {
          // Transparent / Background
          mask[pixelIdx] = 0;
          data[i + 3] = 0;
        } else if (dist < tol + (options.feather * 5)) {
          // Feathered gradient transition edge
          const alphaFactor = (dist - tol) / Math.max(1, options.feather * 5);
          const alpha = Math.round(alphaFactor * 255);
          mask[pixelIdx] = alpha;
          data[i + 3] = alpha;
        } else {
          // Foreground intact
          mask[pixelIdx] = 255;
        }
      }

      // If custom background replacement requested (solid color or gradient)
      const outCanvas = document.createElement('canvas');
      outCanvas.width = width;
      outCanvas.height = height;
      const outCtx = outCanvas.getContext('2d')!;

      if (options.replacementBg?.type === 'color' && options.replacementBg.color) {
        outCtx.fillStyle = options.replacementBg.color;
        outCtx.fillRect(0, 0, width, height);
      } else if (options.replacementBg?.type === 'gradient' && options.replacementBg.gradient) {
        const grad = outCtx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, '#ec4899');
        outCtx.fillStyle = grad;
        outCtx.fillRect(0, 0, width, height);
      }

      ctx.putImageData(imgData, 0, 0);
      outCtx.drawImage(canvas, 0, 0);

      outCanvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Background removal blob failed'));
          return;
        }
        resolve({
          blob,
          dataUrl: URL.createObjectURL(blob),
          width,
          height,
        });
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
