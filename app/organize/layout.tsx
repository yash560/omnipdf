import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organize PDF Online Free — 100% In-Browser & Secure',
  description: 'Sort, reorder, delete, rotate, and duplicate pages visually with a drag-and-drop grid. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/organize',
  },
  openGraph: {
    title: 'Organize PDF Online Free | FileCraft by TheWebVale',
    description: 'Sort, reorder, delete, rotate, and duplicate pages visually with a drag-and-drop grid.',
    url: 'https://filecraft.thewebvale.com/organize',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Organize PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organize PDF Online Free | FileCraft by TheWebVale',
    description: 'Sort, reorder, delete, rotate, and duplicate pages visually with a drag-and-drop grid.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
