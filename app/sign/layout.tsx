import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign PDF Online Free — Digital E-Signature Studio',
  description: 'Draw, type, or upload digital signatures and place them on PDF contracts 100% privately in-browser with FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/sign',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
