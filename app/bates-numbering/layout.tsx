import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bates Numbering & Stamping Online Free — 100% In-Browser & Secure',
  description: 'Enterprise and legal document discovery indexing with sequential prefixes, padded digits, and margins. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/bates-numbering',
  },
  openGraph: {
    title: 'Bates Numbering & Stamping Online Free | FileCraft by TheWebVale',
    description: 'Enterprise and legal document discovery indexing with sequential prefixes, padded digits, and margins.',
    url: 'https://filecraft.thewebvale.com/bates-numbering',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Bates Numbering & Stamping — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bates Numbering & Stamping Online Free | FileCraft by TheWebVale',
    description: 'Enterprise and legal document discovery indexing with sequential prefixes, padded digits, and margins.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
