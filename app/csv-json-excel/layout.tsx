import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSV / Excel / JSON Matrix Online Free — 100% In-Browser & Secure',
  description: 'Bi-directional spreadsheet converter with delimiter auto-detection, field mapping, and live data table. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/csv-json-excel',
  },
  openGraph: {
    title: 'CSV / Excel / JSON Matrix Online Free | FileCraft by TheWebVale',
    description: 'Bi-directional spreadsheet converter with delimiter auto-detection, field mapping, and live data table.',
    url: 'https://filecraft.thewebvale.com/csv-json-excel',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'CSV / Excel / JSON Matrix — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CSV / Excel / JSON Matrix Online Free | FileCraft by TheWebVale',
    description: 'Bi-directional spreadsheet converter with delimiter auto-detection, field mapping, and live data table.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
