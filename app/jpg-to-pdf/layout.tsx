import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JPG to PDF Online Free — 100% In-Browser & Secure',
  description: 'Transform JPG, PNG, and WebP images to PDF. Adjust orientation, margins, and page sizes. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/jpg-to-pdf',
  },
  openGraph: {
    title: 'JPG to PDF Online Free | FileCraft by TheWebVale',
    description: 'Transform JPG, PNG, and WebP images to PDF. Adjust orientation, margins, and page sizes.',
    url: 'https://filecraft.thewebvale.com/jpg-to-pdf',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'JPG to PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JPG to PDF Online Free | FileCraft by TheWebVale',
    description: 'Transform JPG, PNG, and WebP images to PDF. Adjust orientation, margins, and page sizes.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
