import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF to Word (DOCX) Online Free — 100% In-Browser & Secure',
  description: 'Convert PDF documents and text into editable Microsoft Word (.docx) files with preserved headings. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/pdf-to-docx',
  },
  openGraph: {
    title: 'PDF to Word (DOCX) Online Free | FileCraft by TheWebVale',
    description: 'Convert PDF documents and text into editable Microsoft Word (.docx) files with preserved headings.',
    url: 'https://filecraft.thewebvale.com/pdf-to-docx',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'PDF to Word (DOCX) — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF to Word (DOCX) Online Free | FileCraft by TheWebVale',
    description: 'Convert PDF documents and text into editable Microsoft Word (.docx) files with preserved headings.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
