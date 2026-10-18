import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare PDF (Diff) Online Free — 100% In-Browser & Secure',
  description: 'Spot differences between two revisions of a PDF with side-by-side visual diffing. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/compare',
  },
  openGraph: {
    title: 'Compare PDF (Diff) Online Free | FileCraft by TheWebVale',
    description: 'Spot differences between two revisions of a PDF with side-by-side visual diffing.',
    url: 'https://filecraft.thewebvale.com/compare',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Compare PDF (Diff) — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare PDF (Diff) Online Free | FileCraft by TheWebVale',
    description: 'Spot differences between two revisions of a PDF with side-by-side visual diffing.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
