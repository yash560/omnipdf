import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi-Document Lightbox Online Free — 100% In-Browser & Secure',
  description: 'Drop 2-10 documents into a visual lightbox. Reorder, rotate, delete, and assemble pages into 1 master PDF. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/multi-organize',
  },
  openGraph: {
    title: 'Multi-Document Lightbox Online Free | FileCraft by TheWebVale',
    description: 'Drop 2-10 documents into a visual lightbox. Reorder, rotate, delete, and assemble pages into 1 master PDF.',
    url: 'https://filecraft.thewebvale.com/multi-organize',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Multi-Document Lightbox — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multi-Document Lightbox Online Free | FileCraft by TheWebVale',
    description: 'Drop 2-10 documents into a visual lightbox. Reorder, rotate, delete, and assemble pages into 1 master PDF.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
