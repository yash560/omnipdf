import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Steganography Online Free — 100% In-Browser & Secure',
  description: 'Hide confidential text and secret files invisibly inside PNG images with optional AES encryption. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/steganography',
  },
  openGraph: {
    title: 'Image Steganography Online Free | FileCraft by TheWebVale',
    description: 'Hide confidential text and secret files invisibly inside PNG images with optional AES encryption.',
    url: 'https://filecraft.thewebvale.com/steganography',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Image Steganography — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Image Steganography Online Free | FileCraft by TheWebVale',
    description: 'Hide confidential text and secret files invisibly inside PNG images with optional AES encryption.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
