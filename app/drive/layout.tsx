import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FileCraft Cloud Drive — Private Sovereign BYOC Document Cloud',
  description: 'Self-hosted private cloud storage and document workspace with sub-4ms indexing, PBKDF2 personal vault, and AI RAG by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/drive',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
