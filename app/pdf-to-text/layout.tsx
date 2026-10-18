import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF to Text / MD Online Free — 100% In-Browser & Secure',
  description: 'Extract raw text, paragraphs, and structured markdown from your document effortlessly. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/pdf-to-text',
  },
  openGraph: {
    title: 'PDF to Text / MD Online Free | FileCraft by TheWebVale',
    description: 'Extract raw text, paragraphs, and structured markdown from your document effortlessly.',
    url: 'https://filecraft.thewebvale.com/pdf-to-text',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'PDF to Text / MD — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF to Text / MD Online Free | FileCraft by TheWebVale',
    description: 'Extract raw text, paragraphs, and structured markdown from your document effortlessly.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
