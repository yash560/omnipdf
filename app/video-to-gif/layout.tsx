import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video to Animated GIF Online Free — 100% In-Browser & Secure',
  description: 'Encode video clips into high-framerate animated GIFs with 256-color palette quantization. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/video-to-gif',
  },
  openGraph: {
    title: 'Video to Animated GIF Online Free | FileCraft by TheWebVale',
    description: 'Encode video clips into high-framerate animated GIFs with 256-color palette quantization.',
    url: 'https://filecraft.thewebvale.com/video-to-gif',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Video to Animated GIF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video to Animated GIF Online Free | FileCraft by TheWebVale',
    description: 'Encode video clips into high-framerate animated GIFs with 256-color palette quantization.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
