import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Asset & Format Resizer Online Free — 100% In-Browser & Secure',
  description: 'One-click crops for Instagram (1:1, 9:16), YouTube (16:9), Twitter, Passport photos & custom px. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/image-resizer',
  },
  openGraph: {
    title: 'Asset & Format Resizer Online Free | FileCraft by TheWebVale',
    description: 'One-click crops for Instagram (1:1, 9:16), YouTube (16:9), Twitter, Passport photos & custom px.',
    url: 'https://filecraft.thewebvale.com/image-resizer',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Asset & Format Resizer — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asset & Format Resizer Online Free | FileCraft by TheWebVale',
    description: 'One-click crops for Instagram (1:1, 9:16), YouTube (16:9), Twitter, Passport photos & custom px.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
