import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF to JPG Online Free — 100% In-Browser & Secure',
  description: 'Extract every page of your PDF into crisp, high-resolution 300 DPI JPG/PNG images + ZIP. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/pdf-to-jpg',
  },
  openGraph: {
    title: 'PDF to JPG Online Free | FileCraft by TheWebVale',
    description: 'Extract every page of your PDF into crisp, high-resolution 300 DPI JPG/PNG images + ZIP.',
    url: 'https://filecraft.thewebvale.com/pdf-to-jpg',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'PDF to JPG — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF to JPG Online Free | FileCraft by TheWebVale',
    description: 'Extract every page of your PDF into crisp, high-resolution 300 DPI JPG/PNG images + ZIP.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
