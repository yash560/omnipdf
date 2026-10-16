import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compress PDF Online — Reduce PDF File Size Free',
  description: 'Compress and shrink PDF file sizes without quality loss 100% client-side with zero uploads using FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/compress',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
