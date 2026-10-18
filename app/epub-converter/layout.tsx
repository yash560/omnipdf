import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eBook & EPUB Studio Online Free — 100% In-Browser & Secure',
  description: 'Read EPUB eBooks in-browser, extract text & chapters to Markdown/PDF, or package Markdown into EPUB. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/epub-converter',
  },
  openGraph: {
    title: 'eBook & EPUB Studio Online Free | FileCraft by TheWebVale',
    description: 'Read EPUB eBooks in-browser, extract text & chapters to Markdown/PDF, or package Markdown into EPUB.',
    url: 'https://filecraft.thewebvale.com/epub-converter',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'eBook & EPUB Studio — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eBook & EPUB Studio Online Free | FileCraft by TheWebVale',
    description: 'Read EPUB eBooks in-browser, extract text & chapters to Markdown/PDF, or package Markdown into EPUB.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
