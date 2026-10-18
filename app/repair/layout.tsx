import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Repair Corrupted PDF Online Free — 100% In-Browser & Secure',
  description: 'Recover corrupted or damaged PDF files by reconstructing cross-reference tables and unclosed streams. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/repair',
  },
  openGraph: {
    title: 'Repair Corrupted PDF Online Free | FileCraft by TheWebVale',
    description: 'Recover corrupted or damaged PDF files by reconstructing cross-reference tables and unclosed streams.',
    url: 'https://filecraft.thewebvale.com/repair',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Repair Corrupted PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Repair Corrupted PDF Online Free | FileCraft by TheWebVale',
    description: 'Recover corrupted or damaged PDF files by reconstructing cross-reference tables and unclosed streams.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
