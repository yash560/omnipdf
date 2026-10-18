import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Word DOCX to Markdown/HTML Online Free — 100% In-Browser & Secure',
  description: 'Convert DOCX files into clean Markdown or semantic HTML with preserved tables, headings, and lists. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/docx-to-markdown',
  },
  openGraph: {
    title: 'Word DOCX to Markdown/HTML Online Free | FileCraft by TheWebVale',
    description: 'Convert DOCX files into clean Markdown or semantic HTML with preserved tables, headings, and lists.',
    url: 'https://filecraft.thewebvale.com/docx-to-markdown',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Word DOCX to Markdown/HTML — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Word DOCX to Markdown/HTML Online Free | FileCraft by TheWebVale',
    description: 'Convert DOCX files into clean Markdown or semantic HTML with preserved tables, headings, and lists.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
