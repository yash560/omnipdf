/**
 * Image Resizer & Aspect Ratio Social Presets
 */

export interface ResizePreset {
  id: string;
  name: string;
  platform: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export const SOCIAL_PRESETS: ResizePreset[] = [
  { id: 'ig-post', name: 'Instagram Square Post', platform: 'Instagram', width: 1080, height: 1080, aspectRatio: '1:1' },
  { id: 'ig-story', name: 'Instagram Story / Reel', platform: 'Instagram', width: 1080, height: 1920, aspectRatio: '9:16' },
  { id: 'ig-portrait', name: 'Instagram Portrait', platform: 'Instagram', width: 1080, height: 1350, aspectRatio: '4:5' },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', platform: 'YouTube', width: 1280, height: 720, aspectRatio: '16:9' },
  { id: 'yt-banner', name: 'YouTube Channel Banner', platform: 'YouTube', width: 2560, height: 1440, aspectRatio: '16:9' },
  { id: 'x-header', name: 'X / Twitter Banner', platform: 'Twitter', width: 1500, height: 500, aspectRatio: '3:1' },
  { id: 'li-banner', name: 'LinkedIn Cover Banner', platform: 'LinkedIn', width: 1584, height: 396, aspectRatio: '4:1' },
  { id: 'passport', name: 'Passport / Visa Photo (2x2")', platform: 'Official', width: 600, height: 600, aspectRatio: '1:1' },
  { id: 'fb-cover', name: 'Facebook Page Cover', platform: 'Facebook', width: 820, height: 312, aspectRatio: '2.6:1' },
];

export interface ResizeOptions {
  width: number;
  height: number;
  fitMode: 'cover' | 'contain' | 'stretch' | 'pad';
  bgColor?: string;
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

export async function resizeImage(
  file: File,
  options: ResizeOptions
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const dstW = options.width;
      const dstH = options.height;

      const canvas = document.createElement('canvas');
      canvas.width = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas error'));
        return;
      }

      if (options.bgColor) {
        ctx.fillStyle = options.bgColor;
        ctx.fillRect(0, 0, dstW, dstH);
      }

      if (options.fitMode === 'stretch') {
        ctx.drawImage(img, 0, 0, dstW, dstH);
      } else if (options.fitMode === 'cover') {
        const scale = Math.max(dstW / srcW, dstH / srcH);
        const nw = srcW * scale;
        const nh = srcH * scale;
        const ox = (dstW - nw) / 2;
        const oy = (dstH - nh) / 2;
        ctx.drawImage(img, ox, oy, nw, nh);
      } else if (options.fitMode === 'contain' || options.fitMode === 'pad') {
        const scale = Math.min(dstW / srcW, dstH / srcH);
        const nw = srcW * scale;
        const nh = srcH * scale;
        const ox = (dstW - nw) / 2;
        const oy = (dstH - nh) / 2;
        if (!options.bgColor && options.fitMode === 'pad') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, dstW, dstH);
        }
        ctx.drawImage(img, ox, oy, nw, nh);
      }

      const format = options.format || 'image/png';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Resize blob failed'));
            return;
          }
          resolve({
            blob,
            dataUrl: URL.createObjectURL(blob),
            width: dstW,
            height: dstH,
          });
        },
        format,
        options.quality ?? 0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for resizing'));
    };

    img.src = objectUrl;
  });
}
