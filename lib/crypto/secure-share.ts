import { 
  EncryptedSharePackage, 
  DecryptedSharePayload, 
  SharePermissions, 
  OpenSecurityAuditInfo 
} from '@/types/share';

// Safe ArrayBuffer <-> Base64 helpers with chunking to prevent callstack overflow
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a high-entropy 256-bit AES-GCM key for URL fragment (#key=...) sharing
 */
export async function generateZeroKnowledgeRawKey(): Promise<{ key: CryptoKey; base64Key: string }> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  const base64Key = arrayBufferToBase64(exported);
  return { key, base64Key };
}

/**
 * Import a 256-bit raw AES-GCM key from Base64
 */
export async function importRawKey(base64Key: string): Promise<CryptoKey> {
  const rawBytes = base64ToArrayBuffer(base64Key);
  return await crypto.subtle.importKey(
    'raw',
    rawBytes as any,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
}

/**
 * Derive a 256-bit AES-GCM key from a user passcode using PBKDF2 (100,000 iterations of SHA-256)
 */
export async function deriveKeyFromPasscode(
  passcode: string,
  saltBytes: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passcode) as any,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as any,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Compute SHA-256 hash of a string or buffer for integrity verification
 */
export async function computeSha256Digest(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', bytes as any);
  return bufferToHex(hash);
}

/**
 * Client-Side AES-256-GCM Zero-Knowledge Encryption
 */
export async function encryptSharePayload(
  payload: DecryptedSharePayload,
  keyOrPasscode: string | CryptoKey,
  isPasscode: boolean,
  permissions: SharePermissions,
  metadata: { filename: string; fileSize: number; pageCount: number }
): Promise<{ package: EncryptedSharePackage; urlKeyFragment?: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  let cryptoKey: CryptoKey;
  let urlKeyFragment: string | undefined;

  if (isPasscode) {
    if (typeof keyOrPasscode !== 'string') {
      throw new Error('Passcode must be a string');
    }
    cryptoKey = await deriveKeyFromPasscode(keyOrPasscode, salt, iterations);
  } else {
    if (typeof keyOrPasscode === 'string' && keyOrPasscode.length > 0) {
      cryptoKey = await importRawKey(keyOrPasscode);
      urlKeyFragment = keyOrPasscode;
    } else {
      const generated = await generateZeroKnowledgeRawKey();
      cryptoKey = generated.key;
      urlKeyFragment = generated.base64Key;
    }
  }

  const jsonString = JSON.stringify(payload);
  const plaintextBytes = new TextEncoder().encode(jsonString);

  // Authenticated encryption via AES-GCM (128-bit authentication tag appended automatically)
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
      tagLength: 128,
    },
    cryptoKey,
    plaintextBytes as any
  );

  const digest = await computeSha256Digest(plaintextBytes);
  const shareId = `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const encryptedPackage: EncryptedSharePackage = {
    version: '1.0',
    id: shareId,
    algorithm: 'AES-GCM-256',
    kdf: isPasscode ? 'PBKDF2-SHA256' : 'RAW_KEY',
    iterations: isPasscode ? iterations : 1,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    createdAt: Date.now(),
    expiresAt: permissions.expiresAt,
    maxViews: permissions.maxViews,
    viewCount: 0,
    permissions,
    metadata: {
      ...metadata,
      sha256Digest: digest,
    },
  };

  return { package: encryptedPackage, urlKeyFragment };
}

/**
 * Client-Side AES-256-GCM Zero-Knowledge Decryption
 */
export async function decryptSharePayload(
  pkg: EncryptedSharePackage,
  keyOrPasscode: string
): Promise<DecryptedSharePayload> {
  const salt = base64ToArrayBuffer(pkg.salt);
  const iv = base64ToArrayBuffer(pkg.iv);
  const ciphertextBytes = base64ToArrayBuffer(pkg.ciphertext);

  let cryptoKey: CryptoKey;

  if (pkg.kdf === 'PBKDF2-SHA256') {
    cryptoKey = await deriveKeyFromPasscode(keyOrPasscode, salt, pkg.iterations);
  } else {
    cryptoKey = await importRawKey(keyOrPasscode);
  }

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
        tagLength: 128,
      },
      cryptoKey,
      ciphertextBytes as any
    );

    const decryptedJson = new TextDecoder().decode(decryptedBuffer);
    const parsed: DecryptedSharePayload = JSON.parse(decryptedJson);
    return parsed;
  } catch (err: any) {
    throw new Error('Decryption failed: Invalid passcode/key or corrupted ciphertext.');
  }
}

/**
 * Generate Open Security & Mathematical Proof Audit Data with Runnable Scripts
 */
export function generateOpenSecurityAudit(
  pkg: EncryptedSharePackage,
  keyOrPasscode: string,
  isPasscode: boolean
): OpenSecurityAuditInfo {
  const saltBytes = base64ToArrayBuffer(pkg.salt);
  const ivBytes = base64ToArrayBuffer(pkg.iv);

  const saltHex = bufferToHex(saltBytes);
  const ivHex = bufferToHex(ivBytes);
  const sha256DigestHex = pkg.metadata.sha256Digest || 'Computed upon client decryption';

  const decryptionSteps = [
    `1. Algorithm: ${pkg.algorithm} (Authenticated Encryption with 128-bit integrity tag)`,
    pkg.kdf === 'PBKDF2-SHA256'
      ? `2. Key Derivation: PBKDF2 with HMAC-SHA-256, ${pkg.iterations.toLocaleString()} iterations and 16-byte random salt.`
      : `2. Key Mode: Direct 256-bit Raw Key transported in client URL fragment (#key=...). Never sent to server.`,
    `3. Initialization Vector: Unique 96-bit (12-byte) random IV [${ivHex.substring(0, 16)}...]`,
    `4. Integrity & Authentication: AES-GCM prevents tampering; any bit alteration causes immediate authentication rejection.`,
    `5. Zero-Knowledge Server Guarantee: Server only stores encrypted bytes. Decryption is 100% in-browser WebCrypto.`,
  ];

  const typescriptCode = `// Verifiable Independent TypeScript / Node.js Decryption Script
import { webcrypto } from 'crypto';
const crypto = webcrypto as unknown as Crypto;

async function decryptOmniPDFShare(
  ciphertextBase64: string,
  ivBase64: string,
  saltBase64: string,
  secretKeyOrPasscode: string,
  isPasscode: boolean
) {
  const iv = Buffer.from(ivBase64, 'base64');
  const salt = Buffer.from(saltBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');

  let key: CryptoKey;
  if (isPasscode) {
    const passKey = await crypto.subtle.importKey(
      'raw',
      Buffer.from(secretKeyOrPasscode),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      passKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
  } else {
    key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(secretKeyOrPasscode, 'base64'),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
  }

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    ciphertext
  );

  const payload = JSON.parse(new TextDecoder().decode(decrypted));
  console.log('Decrypted successfully:', payload.filename);
  return payload;
}`;

  const pythonCode = `# Verifiable Independent Python 3 Decryption Script
import base64
import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def decrypt_omnipdf_share(ciphertext_b64, iv_b64, salt_b64, secret_key_or_passcode, is_passcode=False):
    iv = base64.b64decode(iv_b64)
    salt = base64.b64decode(salt_b64)
    ciphertext_with_tag = base64.b64decode(ciphertext_b64)

    if is_passcode:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(secret_key_or_passcode.encode('utf-8'))
    else:
        key = base64.b64decode(secret_key_or_passcode)

    aesgcm = AESGCM(key)
    decrypted_bytes = aesgcm.decrypt(iv, ciphertext_with_tag, None)
    payload = json.loads(decrypted_bytes.decode('utf-8'))
    print(f"Decrypted successfully: {payload['filename']}")
    return payload
`;

  return {
    algorithm: pkg.algorithm,
    keySizeBits: 256,
    keyDerivationFunction: pkg.kdf,
    pbkdf2Iterations: pkg.iterations,
    saltHex,
    ivHex,
    sha256DigestHex,
    isZeroKnowledge: true,
    decryptionSteps,
    typescriptCode,
    pythonCode,
  };
}
