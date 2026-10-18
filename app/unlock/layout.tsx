import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unlock PDF Online Free — 100% In-Browser & Secure',
  description: 'Remove password restrictions from your protected PDF so you can read and share freely. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/unlock',
  },
  openGraph: {
    title: 'Unlock PDF Online Free | FileCraft by TheWebVale',
    description: 'Remove password restrictions from your protected PDF so you can read and share freely.',
    url: 'https://filecraft.thewebvale.com/unlock',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Unlock PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unlock PDF Online Free | FileCraft by TheWebVale',
    description: 'Remove password restrictions from your protected PDF so you can read and share freely.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
