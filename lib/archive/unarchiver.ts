import JSZip from 'jszip';
import * as fflate from 'fflate';

export interface ArchiveEntry {
  path: string;
  name: string;
  size: number;
  isDir: boolean;
  dataUrl?: string;
  textContent?: string;
  blob?: Blob;
}

/**
 * Universal In-Browser Unarchiver
 * Unpacks .zip, .tar, .gz, .tgz, .gzip archives natively
 */
export async function unpackArchive(file: File): Promise<ArchiveEntry[]> {
  const fileName = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // 1. If Tar / Gzip archive
  if (fileName.endsWith('.tar') || fileName.endsWith('.tar.gz') || fileName.endsWith('.tgz') || fileName.endsWith('.gz')) {
    return unpackTarOrGz(uint8, file.name);
  }

  // 2. Default: ZIP Archive
  try {
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
  } catch (zipErr) {
    // Fallback attempt with fflate unzip
    return new Promise((resolve, reject) => {
      fflate.unzip(uint8, (err, unzipped) => {
        if (err) {
          reject(new Error(`Failed to unpack archive: ${err.message}`));
          return;
        }

        const entries: ArchiveEntry[] = [];
        for (const [path, data] of Object.entries(unzipped)) {
          const isDir = path.endsWith('/');
          const blob = new Blob([data as any]);
          entries.push({
            path,
            name: path.replace(/\/$/, '').split('/').pop() || path,
            size: data.length,
            isDir,
            blob,
            dataUrl: isDir ? undefined : URL.createObjectURL(blob),
          });
        }
        resolve(entries);
      });
    });
  }
}

/**
 * Handle GZIP decompression & basic TAR directory entry parsing
 */
function unpackTarOrGz(data: Uint8Array, originalName: string): ArchiveEntry[] {
  let tarBytes = data;

  // Decompress GZ if needed
  if (originalName.toLowerCase().endsWith('.gz') || originalName.toLowerCase().endsWith('.tgz')) {
    try {
      tarBytes = fflate.gunzipSync(data);
    } catch {
      tarBytes = data;
    }
  }

  // If simple .gz (not .tar.gz), return the single decompressed file
  if (originalName.toLowerCase().endsWith('.gz') && !originalName.toLowerCase().endsWith('.tar.gz')) {
    const extractedName = originalName.replace(/\.gz$/i, '');
    const blob = new Blob([tarBytes as any]);
    return [
      {
        path: extractedName,
        name: extractedName,
        size: tarBytes.length,
        isDir: false,
        blob,
        dataUrl: URL.createObjectURL(blob),
      },
    ];
  }

  // Parse UStar / standard POSIX TAR header records (512-byte blocks)
  const entries: ArchiveEntry[] = [];
  let offset = 0;

  while (offset < tarBytes.length - 512) {
    const headerBlock = tarBytes.subarray(offset, offset + 512);

    // Empty block signifies end of archive
    if (headerBlock.every((b) => b === 0)) break;

    const rawName = String.fromCharCode(...headerBlock.subarray(0, 100)).replace(/\0.*$/g, '').trim();
    if (!rawName) break;

    const sizeOctal = String.fromCharCode(...headerBlock.subarray(124, 136)).replace(/\0.*$/g, '').trim();
    const size = parseInt(sizeOctal, 8) || 0;
    const typeFlag = String.fromCharCode(headerBlock[156]);

    const isDir = typeFlag === '5' || rawName.endsWith('/');
    const fileData = isDir ? new Uint8Array(0) : tarBytes.subarray(offset + 512, offset + 512 + size);
    const blob = new Blob([fileData as any]);

    entries.push({
      path: rawName,
      name: rawName.replace(/\/$/, '').split('/').pop() || rawName,
      size: isDir ? 0 : size,
      isDir,
      blob,
      dataUrl: isDir ? undefined : URL.createObjectURL(blob),
    });

    // Advance to next 512-byte aligned record
    const contentBlocks = Math.ceil(size / 512);
    offset += 512 + contentBlocks * 512;
  }

  return entries;
}
