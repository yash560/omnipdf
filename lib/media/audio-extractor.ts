/**
 * In-Browser Audio Extractor & Converter (Web Audio API)
 */

export interface AudioExtractOptions {
  sampleRate: 44100 | 48000 | 22050 | 16000;
  channels: 1 | 2; // Mono or Stereo
}

export async function extractAudioTrack(
  file: File,
  options: AudioExtractOptions = { sampleRate: 44100, channels: 2 }
): Promise<{ blob: Blob; dataUrl: string; duration: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const duration = audioBuffer.duration;
  const numChannels = Math.min(options.channels, audioBuffer.numberOfChannels);
  const sampleRate = options.sampleRate;

  // Use OfflineAudioContext for rendering
  const offlineCtx = new OfflineAudioContext(
    numChannels,
    Math.ceil(sampleRate * duration),
    sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);

  return {
    blob: wavBlob,
    dataUrl: URL.createObjectURL(wavBlob),
    duration,
  };
}

/**
 * Encode AudioBuffer to standard PCM 16-bit WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.getChannelData(1);
    result = new Float32Array(ch0.length + ch1.length);
    for (let i = 0; i < ch0.length; i++) {
      result[i * 2] = ch0[i];
      result[i * 2 + 1] = ch1[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = result.length * bytesPerSample;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}
