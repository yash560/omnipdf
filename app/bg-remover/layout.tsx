import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Background Remover Online Free — 100% In-Browser & Secure',
  description: '100% In-browser cutout engine for portraits & product photos. Zero server uploads or API limits. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/bg-remover',
  },
  openGraph: {
    title: 'AI Background Remover Online Free | FileCraft by TheWebVale',
    description: '100% In-browser cutout engine for portraits & product photos. Zero server uploads or API limits.',
    url: 'https://filecraft.thewebvale.com/bg-remover',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'AI Background Remover — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Background Remover Online Free | FileCraft by TheWebVale',
    description: '100% In-browser cutout engine for portraits & product photos. Zero server uploads or API limits.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
