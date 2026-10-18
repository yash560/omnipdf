import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Smart Table Extractor Online Free — 100% In-Browser & Secure',
  description: 'Turn paper receipts, invoices, and screenshot tables into clean, structured Excel & CSV spreadsheets. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/ai-table-extractor',
  },
  openGraph: {
    title: 'AI Smart Table Extractor Online Free | FileCraft by TheWebVale',
    description: 'Turn paper receipts, invoices, and screenshot tables into clean, structured Excel & CSV spreadsheets.',
    url: 'https://filecraft.thewebvale.com/ai-table-extractor',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'AI Smart Table Extractor — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Smart Table Extractor Online Free | FileCraft by TheWebVale',
    description: 'Turn paper receipts, invoices, and screenshot tables into clean, structured Excel & CSV spreadsheets.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
