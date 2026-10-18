import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Large File Splitter & Joiner Online Free — 100% In-Browser & Secure',
  description: 'Split massive files into email/Discord friendly chunks (e.g. 25MB) and re-join them with checksum check. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/file-splitter',
  },
  openGraph: {
    title: 'Large File Splitter & Joiner Online Free | FileCraft by TheWebVale',
    description: 'Split massive files into email/Discord friendly chunks (e.g. 25MB) and re-join them with checksum check.',
    url: 'https://filecraft.thewebvale.com/file-splitter',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Large File Splitter & Joiner — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Large File Splitter & Joiner Online Free | FileCraft by TheWebVale',
    description: 'Split massive files into email/Discord friendly chunks (e.g. 25MB) and re-join them with checksum check.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
