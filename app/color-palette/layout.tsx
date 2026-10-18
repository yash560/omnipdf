import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Palette Extractor Online Free — 100% In-Browser & Secure',
  description: 'Extract dominant palettes, HEX, RGB, HSL, Tailwind names & WCAG contrast compliance from any image. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/color-palette',
  },
  openGraph: {
    title: 'Color Palette Extractor Online Free | FileCraft by TheWebVale',
    description: 'Extract dominant palettes, HEX, RGB, HSL, Tailwind names & WCAG contrast compliance from any image.',
    url: 'https://filecraft.thewebvale.com/color-palette',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Color Palette Extractor — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Color Palette Extractor Online Free | FileCraft by TheWebVale',
    description: 'Extract dominant palettes, HEX, RGB, HSL, Tailwind names & WCAG contrast compliance from any image.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
