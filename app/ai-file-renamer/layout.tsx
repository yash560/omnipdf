import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Batch File Smart Renamer Online Free — 100% In-Browser & Secure',
  description: 'Drop 50+ messy filenames and let AI deduce document context and generate clean naming structures. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/ai-file-renamer',
  },
  openGraph: {
    title: 'Batch File Smart Renamer Online Free | FileCraft by TheWebVale',
    description: 'Drop 50+ messy filenames and let AI deduce document context and generate clean naming structures.',
    url: 'https://filecraft.thewebvale.com/ai-file-renamer',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Batch File Smart Renamer — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Batch File Smart Renamer Online Free | FileCraft by TheWebVale',
    description: 'Drop 50+ messy filenames and let AI deduce document context and generate clean naming structures.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
