import JSZip from 'jszip';

export interface ZipFileItem {
  file: File;
  relativePath?: string;
}

export interface ZipOptions {
  compressionLevel: number; // 0 to 9
  zipName: string;
}

export async function createZipArchive(
  items: ZipFileItem[],
  options: ZipOptions = { compressionLevel: 6, zipName: 'archive.zip' }
): Promise<{ blob: Blob; size: number }> {
  const zip = new JSZip();

  items.forEach((item) => {
    const path = item.relativePath || item.file.name;
    zip.file(path, item.file);
  });

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: options.compressionLevel === 0 ? 'STORE' : 'DEFLATE',
    compressionOptions: {
      level: options.compressionLevel,
    },
  });

  return {
    blob,
    size: blob.size,
  };
}
