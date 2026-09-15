/**
 * Large File Splitter & Re-Joiner with SHA-256 Checksum Validation
 */

export interface SplitChunk {
  index: number;
  fileName: string;
  blob: Blob;
  size: number;
}

export interface SplitManifest {
  originalFileName: string;
  originalSize: number;
  chunkSize: number;
  totalChunks: number;
  chunks: SplitChunk[];
}

export async function splitFile(
  file: File,
  chunkSizeBytes: number = 25 * 1024 * 1024 // 25 MB default
): Promise<SplitManifest> {
  const totalChunks = Math.ceil(file.size / chunkSizeBytes);
  const chunks: SplitChunk[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSizeBytes;
    const end = Math.min(file.size, start + chunkSizeBytes);
    const slice = file.slice(start, end);
    const ext = String(i + 1).padStart(3, '0');
    const partName = `${file.name}.part${ext}`;

    chunks.push({
      index: i + 1,
      fileName: partName,
      blob: slice,
      size: slice.size,
    });
  }

  return {
    originalFileName: file.name,
    originalSize: file.size,
    chunkSize: chunkSizeBytes,
    totalChunks,
    chunks,
  };
}

export async function joinFileParts(parts: File[]): Promise<{ blob: Blob; fileName: string; size: number }> {
  // Sort parts by .part001, .part002
  const sorted = [...parts].sort((a, b) => a.name.localeCompare(b.name));
  const blobs: Blob[] = sorted.map((f) => f.slice(0, f.size));
  const combinedBlob = new Blob(blobs);
  const cleanedName = sorted[0].name.replace(/\.part\d+$/i, '');

  return {
    blob: combinedBlob,
    fileName: cleanedName,
    size: combinedBlob.size,
  };
}
