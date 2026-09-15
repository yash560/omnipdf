import { Annotation } from './pdf';

export interface SharePermissions {
  allowDownload: boolean; // Recipient can download the decrypted PDF
  allowPrint: boolean; // Recipient can print the document
  allowAnnotate: boolean; // Recipient can make and save visual annotations
  requirePasscode: boolean; // Document is locked behind a custom passcode/PIN
  passcodeHint?: string;
  watermarkText?: string; // Subtle diagonal anti-tamper watermark (e.g. "CONFIDENTIAL")
  burnAfterRead?: boolean; // Single view then permanently invalidated
  expiresAt: number | null; // Expiration epoch ms or null for perpetual
  maxViews: number | null; // Maximum allowed opens or null for unlimited
}

export interface EncryptedSharePackage {
  version: '1.0';
  id: string;
  algorithm: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256' | 'RAW_KEY';
  iterations: number;
  salt: string; // Base64 random 16-byte salt
  iv: string; // Base64 random 12-byte IV
  ciphertext: string; // Base64 encrypted JSON string of DecryptedSharePayload
  createdAt: number;
  expiresAt: number | null;
  maxViews: number | null;
  viewCount: number;
  permissions: SharePermissions;
  metadata: {
    filename: string;
    fileSize: number;
    pageCount: number;
    sha256Digest?: string;
  };
}

export interface DecryptedSharePayload {
  filename: string;
  pdfBase64: string; // Base64 representation of PDF binary
  annotations: Annotation[];
  pageViewports?: { [pageIndex: number]: { width: number; height: number } };
  createdAt: number;
  exportedAt: number;
  notes?: string;
}

export interface OpenSecurityAuditInfo {
  algorithm: string;
  keySizeBits: number;
  keyDerivationFunction: string;
  pbkdf2Iterations: number;
  saltHex: string;
  ivHex: string;
  sha256DigestHex: string;
  isZeroKnowledge: boolean;
  decryptionSteps: string[];
  typescriptCode: string;
  pythonCode: string;
}
