export type ScanFilter = 'original' | 'document_bw' | 'grayscale' | 'enhanced';

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

/**
 * Enumerates available video input devices (cameras)
 */
export async function getCameraDevices(): Promise<CameraDeviceInfo[]> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === 'videoinput')
      .map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${index + 1}`,
      }));
  } catch (err) {
    console.warn('Could not enumerate camera devices:', err);
    return [];
  }
}

/**
 * Initializes camera stream with optimal document capture constraints (1080p+, back camera preferred)
 */
export async function startCameraStream(
  deviceId?: string,
  facingMode: 'environment' | 'user' = 'environment'
): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access is not supported in this browser environment.');
  }

  const constraints: MediaStreamConstraints = {
    audio: false,
    video: deviceId
      ? {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      : {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Stops all tracks on a MediaStream safely
 */
export function stopCameraStream(stream: MediaStream | null) {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch (err) {
    console.warn('Error stopping camera tracks:', err);
  }
}

/**
 * Toggles torch/flashlight on mobile devices if supported by camera track
 */
export async function toggleTorch(stream: MediaStream | null, enabled: boolean): Promise<boolean> {
  if (!stream) return false;
  const track = stream.getVideoTracks()[0];
  if (!track) return false;

  const capabilities = (track.getCapabilities && (track.getCapabilities() as any)) || {};
  if (!capabilities.torch) return false;

  try {
    await (track as any).applyConstraints({
      advanced: [{ torch: enabled }],
    });
    return true;
  } catch (err) {
    console.warn('Torch constraint not supported:', err);
    return false;
  }
}

/**
 * Captures the current frame of a video element to a high-res canvas with optional rotation and filter
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  rotationDegrees: number = 0,
  filter: ScanFilter = 'original'
): { dataUrl: string; width: number; height: number; blob: Promise<Blob> } {
  const videoWidth = video.videoWidth || 1920;
  const videoHeight = video.videoHeight || 1080;

  const canvas = document.createElement('canvas');
  const isRotated90or270 = rotationDegrees % 180 !== 0;

  canvas.width = isRotated90or270 ? videoHeight : videoWidth;
  canvas.height = isRotated90or270 ? videoWidth : videoHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get 2d context for canvas capture.');

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotationDegrees * Math.PI) / 180);
  ctx.drawImage(video, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);
  ctx.restore();

  // Apply visual document enhancement filters
  applyScanFilterToCanvas(ctx, canvas.width, canvas.height, filter);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  const blobPromise = new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      'image/jpeg',
      0.92
    );
  });

  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    blob: blobPromise,
  };
}

/**
 * Applies document scanning image processing filters to canvas context
 */
export function applyScanFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: ScanFilter
) {
  if (filter === 'original') return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (filter === 'grayscale') {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i] = gray;
      data[i] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
    return;
  }

  if (filter === 'enhanced') {
    // Boost contrast & sharpness for ink clarity
    const contrast = 1.35; // 35% contrast boost
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

    for (let i = 0; i < data.length; i += 4) {
      // Contrast adjustment
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
    ctx.putImageData(imageData, 0, 0);
    return;
  }

  if (filter === 'document_bw') {
    // High-contrast flatbed scanner algorithm:
    // 1. Calculate average luminance
    // 2. Apply adaptive thresholding to turn paper white and text crisp black
    let sumGray = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sumGray += gray;
    }
    const avgLuminance = sumGray / (data.length / 4);
    const threshold = Math.max(105, Math.min(165, avgLuminance * 0.92));

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = gray > threshold ? 255 : Math.max(0, gray * 0.4); // soft black for smooth anti-aliasing
      data[i] = val;
      data[i] = val;
      data[i] = val;
    }
    ctx.putImageData(imageData, 0, 0);
  }
}

/**
 * Rotates an existing image data URL by 90/180/270 degrees
 */
export async function rotateImageDataUrl(dataUrl: string, degrees: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const is90or270 = degrees % 180 !== 0;
      const canvas = document.createElement('canvas');
      canvas.width = is90or270 ? img.height : img.width;
      canvas.height = is90or270 ? img.width : img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Failed to load image for rotation'));
    img.src = dataUrl;
  });
}
