import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF to PowerPoint (PPTX) Online Free — 100% In-Browser & Secure',
  description: 'Convert PDF slide decks and presentations into editable widescreen 16:9 PowerPoint .pptx files. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/pdf-to-pptx',
  },
  openGraph: {
    title: 'PDF to PowerPoint (PPTX) Online Free | FileCraft by TheWebVale',
    description: 'Convert PDF slide decks and presentations into editable widescreen 16:9 PowerPoint .pptx files.',
    url: 'https://filecraft.thewebvale.com/pdf-to-pptx',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'PDF to PowerPoint (PPTX) — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF to PowerPoint (PPTX) Online Free | FileCraft by TheWebVale',
    description: 'Convert PDF slide decks and presentations into editable widescreen 16:9 PowerPoint .pptx files.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
