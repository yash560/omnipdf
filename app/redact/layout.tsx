import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manual Redact PDF Online Free — 100% In-Browser & Secure',
  description: 'Permanently remove or blackout sensitive text, names, numbers, and private data. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/redact',
  },
  openGraph: {
    title: 'Manual Redact PDF Online Free | FileCraft by TheWebVale',
    description: 'Permanently remove or blackout sensitive text, names, numbers, and private data.',
    url: 'https://filecraft.thewebvale.com/redact',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Manual Redact PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manual Redact PDF Online Free | FileCraft by TheWebVale',
    description: 'Permanently remove or blackout sensitive text, names, numbers, and private data.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
