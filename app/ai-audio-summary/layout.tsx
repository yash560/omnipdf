import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meeting & Audio AI Summarizer Online Free — 100% In-Browser & Secure',
  description: 'Transcribe audio memos & meetings to executive summaries, key decisions, and action item checklists. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/ai-audio-summary',
  },
  openGraph: {
    title: 'Meeting & Audio AI Summarizer Online Free | FileCraft by TheWebVale',
    description: 'Transcribe audio memos & meetings to executive summaries, key decisions, and action item checklists.',
    url: 'https://filecraft.thewebvale.com/ai-audio-summary',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Meeting & Audio AI Summarizer — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meeting & Audio AI Summarizer Online Free | FileCraft by TheWebVale',
    description: 'Transcribe audio memos & meetings to executive summaries, key decisions, and action item checklists.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
