/**
 * Base64, Data URI, and Hex Binary Engine
 */

export interface Base64Result {
  base64: string;
  dataUri: string;
  hex: string;
  htmlImg: string;
  cssBackground: string;
  mimeType: string;
  fileSize: number;
}

export async function fileToBase64(file: File): Promise<Base64Result> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Chunked btoa to prevent call stack overflow on large files
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as any);
  }

  const base64 = btoa(binary);
  const mimeType = file.type || 'application/octet-stream';
  const dataUri = `data:${mimeType};base64,${base64}`;

  let hex = '';
  for (let i = 0; i < Math.min(1000, bytes.length); i++) {
    hex += bytes[i].toString(16).padStart(2, '0') + ' ';
  }
  if (bytes.length > 1000) hex += `... (${bytes.length - 1000} more bytes)`;

  return {
    base64,
    dataUri,
    hex,
    htmlImg: `<img src="${dataUri}" alt="${file.name}" />`,
    cssBackground: `background-image: url("${dataUri}");`,
    mimeType,
    fileSize: file.size,
  };
}

export function base64ToFile(base64Str: string, fileName = 'decoded_file.bin'): Blob {
  const cleanBase64 = base64Str.replace(/^data:[^;]+;base64,/, '').trim();
  const binary = atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes]);
}
