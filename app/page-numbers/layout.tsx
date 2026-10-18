import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Numbers Online Free — 100% In-Browser & Secure',
  description: 'Add page numbers with customized formatting, position, margins, and typography styling. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/page-numbers',
  },
  openGraph: {
    title: 'Page Numbers Online Free | FileCraft by TheWebVale',
    description: 'Add page numbers with customized formatting, position, margins, and typography styling.',
    url: 'https://filecraft.thewebvale.com/page-numbers',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Page Numbers — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Page Numbers Online Free | FileCraft by TheWebVale',
    description: 'Add page numbers with customized formatting, position, margins, and typography styling.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
