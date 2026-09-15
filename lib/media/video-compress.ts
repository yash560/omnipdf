/**
 * In-Browser Video Compression & Downscaling Engine
 * Uses HTML5 Video, Canvas 2D frame scaling, and MediaRecorder API
 */

export interface VideoCompressOptions {
  targetResolution: '1080p' | '720p' | '480p' | '360p';
  videoBitrateMbps: number; // e.g. 1.0, 2.5, 5.0
  onProgress?: (progressPercent: number) => void;
}

export interface VideoCompressResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  durationSeconds: number;
}

const RES_MAP: Record<string, { width: number; height: number }> = {
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
  '480p': { width: 854, height: 480 },
  '360p': { width: 640, height: 360 },
};

export async function compressVideo(
  file: File,
  options: VideoCompressOptions
): Promise<VideoCompressResult> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const duration = video.duration || 1;

      const target = RES_MAP[options.targetResolution] || RES_MAP['720p'];
      const scale = Math.min(1, Math.min(target.width / srcW, target.height / srcH));
      const dstW = Math.round(srcW * scale);
      const dstH = Math.round(srcH * scale);

      const canvas = document.createElement('canvas');
      canvas.width = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(30);

      // Try webm or mp4 depending on browser support
      let mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: options.videoBitrateMbps * 1000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(objectUrl);
        const outBlob = new Blob(chunks, { type: mimeType });
        const originalSize = file.size;
        const compressedSize = outBlob.size;
        const savingsPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

        resolve({
          blob: outBlob,
          dataUrl: URL.createObjectURL(outBlob),
          originalSize,
          compressedSize,
          savingsPercent,
          durationSeconds: duration,
        });
      };

      recorder.start(100);
      video.play();

      const drawFrame = () => {
        if (video.paused || video.ended) {
          recorder.stop();
          return;
        }

        ctx.drawImage(video, 0, 0, dstW, dstH);
        if (options.onProgress && duration > 0) {
          options.onProgress(Math.min(99, Math.round((video.currentTime / duration) * 100)));
        }
        requestAnimationFrame(drawFrame);
      };

      drawFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode video file'));
    };

    video.src = objectUrl;
  });
}
