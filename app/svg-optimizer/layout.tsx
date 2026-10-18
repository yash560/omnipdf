import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SVG Optimizer & Vectorizer Online Free — 100% In-Browser & Secure',
  description: 'Clean bloated Illustrator/Figma SVG code and vectorize bitmap raster images into crisp SVG paths. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/svg-optimizer',
  },
  openGraph: {
    title: 'SVG Optimizer & Vectorizer Online Free | FileCraft by TheWebVale',
    description: 'Clean bloated Illustrator/Figma SVG code and vectorize bitmap raster images into crisp SVG paths.',
    url: 'https://filecraft.thewebvale.com/svg-optimizer',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'SVG Optimizer & Vectorizer — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVG Optimizer & Vectorizer Online Free | FileCraft by TheWebVale',
    description: 'Clean bloated Illustrator/Figma SVG code and vectorize bitmap raster images into crisp SVG paths.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
