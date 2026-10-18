import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Invoice & Receipt to Excel Online Free — 100% In-Browser & Secure',
  description: 'Extract vendor, dates, tax breakdown, and all line-item tables from invoices into structured Excel & CSV. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/invoice-extractor',
  },
  openGraph: {
    title: 'AI Invoice & Receipt to Excel Online Free | FileCraft by TheWebVale',
    description: 'Extract vendor, dates, tax breakdown, and all line-item tables from invoices into structured Excel & CSV.',
    url: 'https://filecraft.thewebvale.com/invoice-extractor',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'AI Invoice & Receipt to Excel — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Invoice & Receipt to Excel Online Free | FileCraft by TheWebVale',
    description: 'Extract vendor, dates, tax breakdown, and all line-item tables from invoices into structured Excel & CSV.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
