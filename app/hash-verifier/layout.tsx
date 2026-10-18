import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checksum & Hash Verifier Online Free — 100% In-Browser & Secure',
  description: 'Calculate SHA-256, SHA-512, SHA-1, MD5, and CRC32 in seconds. Compare against expected hash. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/hash-verifier',
  },
  openGraph: {
    title: 'Checksum & Hash Verifier Online Free | FileCraft by TheWebVale',
    description: 'Calculate SHA-256, SHA-512, SHA-1, MD5, and CRC32 in seconds. Compare against expected hash.',
    url: 'https://filecraft.thewebvale.com/hash-verifier',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Checksum & Hash Verifier — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Checksum & Hash Verifier Online Free | FileCraft by TheWebVale',
    description: 'Calculate SHA-256, SHA-512, SHA-1, MD5, and CRC32 in seconds. Compare against expected hash.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
