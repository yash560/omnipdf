/**
 * Smart Image Compressor with Target File Size Binary Search
 */

export interface CompressResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  width: number;
  height: number;
  qualityUsed: number;
}

export async function compressImage(
  file: File,
  quality: number = 0.8,
  maxWidth?: number
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (maxWidth && width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP or JPEG for compression
      const format = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression blob failed'));
            return;
          }
          const compressedSize = blob.size;
          const originalSize = file.size;
          const savingsPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

          resolve({
            blob,
            dataUrl: URL.createObjectURL(blob),
            originalSize,
            compressedSize,
            savingsPercent,
            width,
            height,
            qualityUsed: quality,
          });
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Binary search for target file size in KB
 */
export async function compressToTargetSize(
  file: File,
  targetBytes: number
): Promise<CompressResult> {
  let low = 0.05;
  let high = 0.95;
  let bestResult: CompressResult | null = null;

  for (let i = 0; i < 6; i++) {
    const mid = (low + high) / 2;
    const result = await compressImage(file, mid);
    bestResult = result;

    if (result.compressedSize > targetBytes) {
      high = mid - 0.05;
    } else {
      low = mid + 0.05;
    }
  }

  // If still too large after quality drop, downscale dimensions
  if (bestResult && bestResult.compressedSize > targetBytes) {
    const scaleFactor = Math.sqrt(targetBytes / bestResult.compressedSize) * 0.9;
    const targetWidth = Math.max(300, Math.round(bestResult.width * scaleFactor));
    bestResult = await compressImage(file, 0.7, targetWidth);
  }

  return bestResult!;
}
