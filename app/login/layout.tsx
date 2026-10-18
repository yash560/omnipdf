import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to FileCraft — Access Your Sovereign Cloud Drive',
  description: 'Log in to FileCraft to manage private family vaults, cloud storage, and AI page studio tools.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/login',
  },
  openGraph: {
    title: 'Sign In to FileCraft — Access Your Sovereign Cloud Drive',
    description: 'Log in to FileCraft to manage private family vaults, cloud storage, and AI page studio tools.',
    url: 'https://filecraft.thewebvale.com/login',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
