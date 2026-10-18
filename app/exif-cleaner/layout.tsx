import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EXIF Privacy Scrubber Online Free — 100% In-Browser & Secure',
  description: 'Inspect camera lens, shutter, GPS map coordinates; 1-click strip all tracking metadata before sharing. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/exif-cleaner',
  },
  openGraph: {
    title: 'EXIF Privacy Scrubber Online Free | FileCraft by TheWebVale',
    description: 'Inspect camera lens, shutter, GPS map coordinates; 1-click strip all tracking metadata before sharing.',
    url: 'https://filecraft.thewebvale.com/exif-cleaner',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'EXIF Privacy Scrubber — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EXIF Privacy Scrubber Online Free | FileCraft by TheWebVale',
    description: 'Inspect camera lens, shutter, GPS map coordinates; 1-click strip all tracking metadata before sharing.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
