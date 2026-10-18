import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base64 & Data URI Studio Online Free — 100% In-Browser & Secure',
  description: 'Convert files to Base64, Data URI, Hex strings, and back. Includes instant clipboard and HTML preview. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/base64-studio',
  },
  openGraph: {
    title: 'Base64 & Data URI Studio Online Free | FileCraft by TheWebVale',
    description: 'Convert files to Base64, Data URI, Hex strings, and back. Includes instant clipboard and HTML preview.',
    url: 'https://filecraft.thewebvale.com/base64-studio',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Base64 & Data URI Studio — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base64 & Data URI Studio Online Free | FileCraft by TheWebVale',
    description: 'Convert files to Base64, Data URI, Hex strings, and back. Includes instant clipboard and HTML preview.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
