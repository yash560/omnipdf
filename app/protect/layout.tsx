import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Protect PDF Online Free — 100% In-Browser & Secure',
  description: 'Encrypt your PDF with standard passwords and restrict unauthorized viewing or printing. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/protect',
  },
  openGraph: {
    title: 'Protect PDF Online Free | FileCraft by TheWebVale',
    description: 'Encrypt your PDF with standard passwords and restrict unauthorized viewing or printing.',
    url: 'https://filecraft.thewebvale.com/protect',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Protect PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Protect PDF Online Free | FileCraft by TheWebVale',
    description: 'Encrypt your PDF with standard passwords and restrict unauthorized viewing or printing.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
