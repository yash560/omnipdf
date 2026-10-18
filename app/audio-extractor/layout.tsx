import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Extractor & Converter Online Free — 100% In-Browser & Secure',
  description: 'Rip audio tracks from video (MP4/WebM to WAV/MP3) or convert audio sample rates and channels. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/audio-extractor',
  },
  openGraph: {
    title: 'Audio Extractor & Converter Online Free | FileCraft by TheWebVale',
    description: 'Rip audio tracks from video (MP4/WebM to WAV/MP3) or convert audio sample rates and channels.',
    url: 'https://filecraft.thewebvale.com/audio-extractor',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Audio Extractor & Converter — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Audio Extractor & Converter Online Free | FileCraft by TheWebVale',
    description: 'Rip audio tracks from video (MP4/WebM to WAV/MP3) or convert audio sample rates and channels.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
