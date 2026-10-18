import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSV Cleaner & Deduplicator Online Free — 100% In-Browser & Secure',
  description: 'Trim whitespace, remove duplicate rows, format dates, normalize text case, and fill missing values. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/csv-cleaner',
  },
  openGraph: {
    title: 'CSV Cleaner & Deduplicator Online Free | FileCraft by TheWebVale',
    description: 'Trim whitespace, remove duplicate rows, format dates, normalize text case, and fill missing values.',
    url: 'https://filecraft.thewebvale.com/csv-cleaner',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'CSV Cleaner & Deduplicator — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CSV Cleaner & Deduplicator Online Free | FileCraft by TheWebVale',
    description: 'Trim whitespace, remove duplicate rows, format dates, normalize text case, and fill missing values.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
