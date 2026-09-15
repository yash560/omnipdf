import JSZip from 'jszip';

export interface ArchiveEntry {
  path: string;
  name: string;
  size: number;
  isDir: boolean;
  dataUrl?: string;
  textContent?: string;
  blob?: Blob;
}

export async function unpackArchive(file: File): Promise<ArchiveEntry[]> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const entries: ArchiveEntry[] = [];

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) {
      entries.push({
        path: relativePath,
        name: relativePath.replace(/\/$/, '').split('/').pop() || relativePath,
        size: 0,
        isDir: true,
      });
    } else {
      const blob = await zipEntry.async('blob');
      let textContent: string | undefined;
      let dataUrl: string | undefined;

      const lower = relativePath.toLowerCase();
      if (
        lower.endsWith('.txt') ||
        lower.endsWith('.md') ||
        lower.endsWith('.json') ||
        lower.endsWith('.js') ||
        lower.endsWith('.ts') ||
        lower.endsWith('.css') ||
        lower.endsWith('.html') ||
        lower.endsWith('.csv')
      ) {
        textContent = await zipEntry.async('text');
      } else if (
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.svg')
      ) {
        dataUrl = URL.createObjectURL(blob);
      }

      entries.push({
        path: relativePath,
        name: relativePath.split('/').pop() || relativePath,
        size: blob.size,
        isDir: false,
        blob,
        dataUrl,
        textContent,
      });
    }
  }

  return entries;
}
