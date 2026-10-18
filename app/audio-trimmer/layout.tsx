import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Waveform Trimmer Online Free — 100% In-Browser & Secure',
  description: 'Interactive audio waveform visualizer. Cut, trim, fade-in, fade-out, and export clean audio clips. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/audio-trimmer',
  },
  openGraph: {
    title: 'Audio Waveform Trimmer Online Free | FileCraft by TheWebVale',
    description: 'Interactive audio waveform visualizer. Cut, trim, fade-in, fade-out, and export clean audio clips.',
    url: 'https://filecraft.thewebvale.com/audio-trimmer',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Audio Waveform Trimmer — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Audio Waveform Trimmer Online Free | FileCraft by TheWebVale',
    description: 'Interactive audio waveform visualizer. Cut, trim, fade-in, fade-out, and export clean audio clips.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
