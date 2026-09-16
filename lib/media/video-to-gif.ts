import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export interface GifConvertOptions {
  fps: number; // 5 to 24 fps
  startTime: number; // seconds
  duration: number; // seconds
  scaleWidth: number; // max width e.g. 480px
  maxColors?: number; // 16 to 256
  onProgress?: (percent: number) => void;
}

/**
 * True in-browser Video to Animated GIF Encoder using gifenc
 * Extracts frames at exact timestamps, extracts optimal 256-color palette,
 * applies dithering, and generates real standard GIF binary blob.
 */
export async function convertVideoToAnimatedGif(
  file: File,
  options: GifConvertOptions
): Promise<{ blob: Blob; dataUrl: string; frameCount: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = async () => {
      try {
        const srcW = video.videoWidth;
        const srcH = video.videoHeight;
        const dstW = Math.min(options.scaleWidth, srcW);
        const dstH = Math.round((srcH * dstW) / srcW);

        const canvas = document.createElement('canvas');
        canvas.width = dstW;
        canvas.height = dstH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

        const fps = Math.max(2, Math.min(30, options.fps || 10));
        const duration = Math.min(options.duration, (video.duration || 5) - options.startTime);
        const totalFrames = Math.max(1, Math.round(duration * fps));
        const frameInterval = 1 / fps;
        const delayMs = Math.round(1000 / fps);

        const gif = GIFEncoder();
        const maxColors = options.maxColors || 256;

        let frameIdx = 0;

        const captureFrame = async (targetTime: number) => {
          return new Promise<void>((frameResolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              ctx.drawImage(video, 0, 0, dstW, dstH);
              const imgData = ctx.getImageData(0, 0, dstW, dstH);
              const rgba = imgData.data;

              // Quantize 256-color palette
              const palette = quantize(rgba, maxColors);
              // Apply palette to get color indices
              const index = applyPalette(rgba, palette);

              // Write frame to GIF stream
              gif.writeFrame(index, dstW, dstH, {
                palette,
                delay: delayMs,
              });

              frameIdx++;
              if (options.onProgress) {
                options.onProgress(Math.min(99, Math.round((frameIdx / totalFrames) * 100)));
              }
              frameResolve();
            };

            video.addEventListener('seeked', onSeeked);
            video.currentTime = targetTime;
          });
        };

        for (let i = 0; i < totalFrames; i++) {
          const currentTime = options.startTime + i * frameInterval;
          await captureFrame(currentTime);
        }

        gif.finish();
        const bytes = gif.bytes();
        const blob = new Blob([bytes], { type: 'image/gif' });

        URL.revokeObjectURL(objectUrl);
        resolve({
          blob,
          dataUrl: URL.createObjectURL(blob),
          frameCount: totalFrames,
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video for GIF encoding'));
    };

    video.src = objectUrl;
  });
}
