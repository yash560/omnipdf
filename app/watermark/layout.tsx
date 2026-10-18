import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watermark PDF Online Free — 100% In-Browser & Secure',
  description: 'Stamp an image or text over your PDF in seconds. Customize typography, transparency, and position. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/watermark',
  },
  openGraph: {
    title: 'Watermark PDF Online Free | FileCraft by TheWebVale',
    description: 'Stamp an image or text over your PDF in seconds. Customize typography, transparency, and position.',
    url: 'https://filecraft.thewebvale.com/watermark',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Watermark PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watermark PDF Online Free | FileCraft by TheWebVale',
    description: 'Stamp an image or text over your PDF in seconds. Customize typography, transparency, and position.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
