import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Account — FileCraft by TheWebVale',
  description: 'Sign up for FileCraft for instant access to 50+ in-browser file tools and private cloud storage.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/register',
  },
  openGraph: {
    title: 'Create an Account — FileCraft by TheWebVale',
    description: 'Sign up for FileCraft for instant access to 50+ in-browser file tools and private cloud storage.',
    url: 'https://filecraft.thewebvale.com/register',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
