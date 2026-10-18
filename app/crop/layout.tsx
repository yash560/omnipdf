import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crop PDF Online Free — 100% In-Browser & Secure',
  description: 'Trim unwanted white margins, headers, and footers with live interactive bounding box preview. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/crop',
  },
  openGraph: {
    title: 'Crop PDF Online Free | FileCraft by TheWebVale',
    description: 'Trim unwanted white margins, headers, and footers with live interactive bounding box preview.',
    url: 'https://filecraft.thewebvale.com/crop',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Crop PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crop PDF Online Free | FileCraft by TheWebVale',
    description: 'Trim unwanted white margins, headers, and footers with live interactive bounding box preview.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
