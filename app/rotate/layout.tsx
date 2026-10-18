import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rotate PDF Online Free — 100% In-Browser & Secure',
  description: 'Rotate your PDF pages 90, 180, or 270 degrees. Save individual or all pages permanently. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/rotate',
  },
  openGraph: {
    title: 'Rotate PDF Online Free | FileCraft by TheWebVale',
    description: 'Rotate your PDF pages 90, 180, or 270 degrees. Save individual or all pages permanently.',
    url: 'https://filecraft.thewebvale.com/rotate',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Rotate PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rotate PDF Online Free | FileCraft by TheWebVale',
    description: 'Rotate your PDF pages 90, 180, or 270 degrees. Save individual or all pages permanently.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
