import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fast ZIP Creator Online Free — 100% In-Browser & Secure',
  description: 'Create multi-file ZIP packages with configurable compression levels and folder trees. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/zip-creator',
  },
  openGraph: {
    title: 'Fast ZIP Creator Online Free | FileCraft by TheWebVale',
    description: 'Create multi-file ZIP packages with configurable compression levels and folder trees.',
    url: 'https://filecraft.thewebvale.com/zip-creator',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Fast ZIP Creator — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fast ZIP Creator Online Free | FileCraft by TheWebVale',
    description: 'Create multi-file ZIP packages with configurable compression levels and folder trees.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
