/**
 * Video to Animated WebP / GIF / Frame Sequence Engine
 */

export interface GifConvertOptions {
  fps: number; // 5 to 24 fps
  startTime: number; // seconds
  duration: number; // seconds
  scaleWidth: number; // max width e.g. 480px
  onProgress?: (percent: number) => void;
}

export async function convertVideoToAnimatedWebp(
  file: File,
  options: GifConvertOptions
): Promise<{ blob: Blob; dataUrl: string; frameCount: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = async () => {
      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const dstW = Math.min(options.scaleWidth, srcW);
      const dstH = Math.round((srcH * dstW) / srcW);

      const canvas = document.createElement('canvas');
      canvas.width = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(options.fps);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm',
        videoBitsPerSecond: 2000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(objectUrl);
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve({
          blob,
          dataUrl: URL.createObjectURL(blob),
          frameCount: Math.round(options.duration * options.fps),
        });
      };

      recorder.start();
      video.currentTime = options.startTime;
      await video.play();

      const stopTime = options.startTime + options.duration;
      const interval = setInterval(() => {
        if (video.currentTime >= stopTime || video.ended) {
          clearInterval(interval);
          recorder.stop();
        } else {
          ctx.drawImage(video, 0, 0, dstW, dstH);
          if (options.onProgress) {
            const elapsed = video.currentTime - options.startTime;
            options.onProgress(Math.min(99, Math.round((elapsed / options.duration) * 100)));
          }
        }
      }, 1000 / options.fps);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video for animation conversion'));
    };

    video.src = objectUrl;
  });
}
