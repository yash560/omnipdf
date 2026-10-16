import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Split PDF Online Free — Extract Pages Instantly',
  description: 'Split PDF files into individual pages or extract specific page ranges 100% client-side with zero uploads using FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/split',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
