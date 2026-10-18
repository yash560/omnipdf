import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Universal Image Converter Online Free — 100% In-Browser & Secure',
  description: 'Bi-directional batch conversion: HEIC, WEBP, PNG, JPG, AVIF, ICO, SVG, and BMP in your browser. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/image-converter',
  },
  openGraph: {
    title: 'Universal Image Converter Online Free | FileCraft by TheWebVale',
    description: 'Bi-directional batch conversion: HEIC, WEBP, PNG, JPG, AVIF, ICO, SVG, and BMP in your browser.',
    url: 'https://filecraft.thewebvale.com/image-converter',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Universal Image Converter — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Universal Image Converter Online Free | FileCraft by TheWebVale',
    description: 'Bi-directional batch conversion: HEIC, WEBP, PNG, JPG, AVIF, ICO, SVG, and BMP in your browser.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
