/**
 * Zero-Knowledge Client-Side AES-256-GCM Encryption for Burn-After-Reading Shares
 */

export interface EncryptedPayload {
  cipherBuffer: ArrayBuffer;
  iv: Uint8Array;
  keyBase64: string;
}

export async function encryptFileForShare(file: File): Promise<EncryptedPayload> {
  const arrayBuffer = await file.arrayBuffer();
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    arrayBuffer
  );

  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

  return {
    cipherBuffer,
    iv,
    keyBase64,
  };
}

export async function decryptSharePayload(
  cipherBuffer: ArrayBuffer,
  iv: Uint8Array,
  keyBase64: string
): Promise<ArrayBuffer> {
  const keyRaw = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'raw',
    keyRaw as any,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    cipherBuffer
  );
}
