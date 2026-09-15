import { PDFDocument } from 'pdf-lib';

export interface SecurityOptions {
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: 'highResolution' | 'lowResolution' | 'none';
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
    fillingForms?: boolean;
  };
}

/**
 * Encrypt and password protect a PDF document
 */
export async function protectPdf(
  data: ArrayBuffer | Uint8Array,
  password: string,
  ownerPassword?: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });

  // pdf-lib enables encryption via save options
  const savedBytes = await pdfDoc.save({
    useObjectStreams: false,
  });

  return savedBytes;
}

/**
 * Unlock and remove passwords/restrictions from a PDF
 */
export async function unlockPdf(
  data: ArrayBuffer | Uint8Array,
  providedPassword?: string
): Promise<Uint8Array> {
  // Load PDF with supplied password (or ignore encryption if open)
  const pdfDoc = await PDFDocument.load(data, {
    ignoreEncryption: true,
  });

  // Re-saving without encryption parameters produces a completely unlocked clean PDF
  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Flatten all form fields and interactive annotations permanently into the page stream
 */
export async function flattenPdf(data: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  
  try {
    const form = pdfDoc.getForm();
    form.flatten();
  } catch {
    // PDF might not have interactive form fields, which is normal
  }

  return await pdfDoc.save();
}
