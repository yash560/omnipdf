import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Merge PDF Online Free — Combine Multiple PDF Files',
  description: 'Merge multiple PDF files into one clean document 100% in-browser with zero uploads. Reorder, rotate, and combine with FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/merge',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
