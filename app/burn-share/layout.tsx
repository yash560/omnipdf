import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Burn-After-Reading Share Online Free — 100% In-Browser & Secure',
  description: 'End-to-end zero-knowledge client encrypted file transfer. Decrypts once in browser and self-destructs. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/burn-share',
  },
  openGraph: {
    title: 'Burn-After-Reading Share Online Free | FileCraft by TheWebVale',
    description: 'End-to-end zero-knowledge client encrypted file transfer. Decrypts once in browser and self-destructs.',
    url: 'https://filecraft.thewebvale.com/burn-share',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Burn-After-Reading Share — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Burn-After-Reading Share Online Free | FileCraft by TheWebVale',
    description: 'End-to-end zero-knowledge client encrypted file transfer. Decrypts once in browser and self-destructs.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
