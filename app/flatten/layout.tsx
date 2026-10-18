import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flatten PDF Online Free — 100% In-Browser & Secure',
  description: 'Bake all interactive form fields and annotations into static uneditable document streams. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/flatten',
  },
  openGraph: {
    title: 'Flatten PDF Online Free | FileCraft by TheWebVale',
    description: 'Bake all interactive form fields and annotations into static uneditable document streams.',
    url: 'https://filecraft.thewebvale.com/flatten',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Flatten PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flatten PDF Online Free | FileCraft by TheWebVale',
    description: 'Bake all interactive form fields and annotations into static uneditable document streams.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
