import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Universal Unarchiver Online Free — 100% In-Browser & Secure',
  description: 'Extract ZIP, TAR, GZ, TGZ archives in your browser with directory tree browser and selective file preview. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/unarchiver',
  },
  openGraph: {
    title: 'Universal Unarchiver Online Free | FileCraft by TheWebVale',
    description: 'Extract ZIP, TAR, GZ, TGZ archives in your browser with directory tree browser and selective file preview.',
    url: 'https://filecraft.thewebvale.com/unarchiver',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Universal Unarchiver — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Universal Unarchiver Online Free | FileCraft by TheWebVale',
    description: 'Extract ZIP, TAR, GZ, TGZ archives in your browser with directory tree browser and selective file preview.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
