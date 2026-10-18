import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Compressor & Resizer Online Free — 100% In-Browser & Secure',
  description: 'Compress video files client-side. Downscale resolution (1080p, 720p, 480p) & lower bitrate without uploading. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/video-compress',
  },
  openGraph: {
    title: 'Video Compressor & Resizer Online Free | FileCraft by TheWebVale',
    description: 'Compress video files client-side. Downscale resolution (1080p, 720p, 480p) & lower bitrate without uploading.',
    url: 'https://filecraft.thewebvale.com/video-compress',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Video Compressor & Resizer — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Compressor & Resizer Online Free | FileCraft by TheWebVale',
    description: 'Compress video files client-side. Downscale resolution (1080p, 720p, 480p) & lower bitrate without uploading.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
