import { audioBufferToWav } from './audio-extractor';

export interface TrimOptions {
  startTime: number; // seconds
  endTime: number; // seconds
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
}

export async function trimAudio(
  file: File,
  options: TrimOptions
): Promise<{ blob: Blob; dataUrl: string; duration: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const originalBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const sampleRate = originalBuffer.sampleRate;
  const numChannels = originalBuffer.numberOfChannels;

  const startSample = Math.max(0, Math.floor(options.startTime * sampleRate));
  const endSample = Math.min(originalBuffer.length, Math.floor(options.endTime * sampleRate));
  const trimLength = Math.max(1, endSample - startSample);

  const trimmedBuffer = audioCtx.createBuffer(numChannels, trimLength, sampleRate);

  for (let c = 0; c < numChannels; c++) {
    const origData = originalBuffer.getChannelData(c);
    const targetData = trimmedBuffer.getChannelData(c);

    for (let i = 0; i < trimLength; i++) {
      let sample = origData[startSample + i];

      // Fade-in curve
      if (options.fadeInSeconds && options.fadeInSeconds > 0) {
        const fadeInSamples = options.fadeInSeconds * sampleRate;
        if (i < fadeInSamples) {
          sample *= i / fadeInSamples;
        }
      }

      // Fade-out curve
      if (options.fadeOutSeconds && options.fadeOutSeconds > 0) {
        const fadeOutSamples = options.fadeOutSeconds * sampleRate;
        const remain = trimLength - i;
        if (remain < fadeOutSamples) {
          sample *= remain / fadeOutSamples;
        }
      }

      targetData[i] = sample;
    }
  }

  const wavBlob = audioBufferToWav(trimmedBuffer);
  return {
    blob: wavBlob,
    dataUrl: URL.createObjectURL(wavBlob),
    duration: trimLength / sampleRate,
  };
}

/**
 * Extract waveform peaks for Canvas rendering
 */
export async function extractWaveformPeaks(file: File, numPeaks = 100): Promise<number[]> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const data = audioBuffer.getChannelData(0);

  const step = Math.floor(data.length / numPeaks);
  const peaks: number[] = [];

  for (let i = 0; i < numPeaks; i++) {
    let max = 0;
    const start = i * step;
    for (let j = 0; j < step; j++) {
      const val = Math.abs(data[start + j] || 0);
      if (val > max) max = val;
    }
    peaks.push(max);
  }

  return peaks;
}
