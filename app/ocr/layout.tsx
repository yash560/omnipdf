import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free OCR Text Extractor — Extract Text from Images & Scanned PDFs',
  description: 'Extract text from scanned PDFs and images with client-side WebAssembly OCR. Zero uploads, 100% private with FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/ocr',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
