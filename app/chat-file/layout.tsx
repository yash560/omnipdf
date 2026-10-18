import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat with Any File Online Free — 100% In-Browser & Secure',
  description: 'Upload PDF, DOCX, CSV, Code or Images and talk to TheWebVale AI with fast multimodal streaming responses. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/chat-file',
  },
  openGraph: {
    title: 'Chat with Any File Online Free | FileCraft by TheWebVale',
    description: 'Upload PDF, DOCX, CSV, Code or Images and talk to TheWebVale AI with fast multimodal streaming responses.',
    url: 'https://filecraft.thewebvale.com/chat-file',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Chat with Any File — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chat with Any File Online Free | FileCraft by TheWebVale',
    description: 'Upload PDF, DOCX, CSV, Code or Images and talk to TheWebVale AI with fast multimodal streaming responses.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
