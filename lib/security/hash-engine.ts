/**
 * Cryptographic Hash & Checksum Engine (Web Crypto SubtleCrypto + CRC32)
 */

export interface HashReport {
  sha256: string;
  sha512: string;
  sha384: string;
  sha1: string;
  crc32: string;
  fileSize: number;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function calculateCrc32(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xff];
  }
  return ((crc ^ -1) >>> 0).toString(16).padStart(8, '0');
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

export async function computeHashes(file: File): Promise<HashReport> {
  const buffer = await file.arrayBuffer();

  const [sha256Buf, sha512Buf, sha384Buf, sha1Buf] = await Promise.all([
    crypto.subtle.digest('SHA-256', buffer),
    crypto.subtle.digest('SHA-512', buffer),
    crypto.subtle.digest('SHA-384', buffer),
    crypto.subtle.digest('SHA-1', buffer),
  ]);

  return {
    sha256: bufferToHex(sha256Buf),
    sha512: bufferToHex(sha512Buf),
    sha384: bufferToHex(sha384Buf),
    sha1: bufferToHex(sha1Buf),
    crc32: calculateCrc32(buffer),
    fileSize: file.size,
  };
}
