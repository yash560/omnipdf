import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subtitle SRT/VTT Creator Online Free — 100% In-Browser & Secure',
  description: 'Interactive subtitle timing editor with live video playback sync. Convert between SRT, VTT, and JSON. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/subtitle-editor',
  },
  openGraph: {
    title: 'Subtitle SRT/VTT Creator Online Free | FileCraft by TheWebVale',
    description: 'Interactive subtitle timing editor with live video playback sync. Convert between SRT, VTT, and JSON.',
    url: 'https://filecraft.thewebvale.com/subtitle-editor',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Subtitle SRT/VTT Creator — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Subtitle SRT/VTT Creator Online Free | FileCraft by TheWebVale',
    description: 'Interactive subtitle timing editor with live video playback sync. Convert between SRT, VTT, and JSON.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
