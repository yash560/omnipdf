import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support & Help Center — FileCraft by TheWebVale',
  description: 'Get help, submit support tickets, report issues, and read documentation for FileCraft Universal File OS.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/support',
  },
  openGraph: {
    title: 'Support & Help Center — FileCraft by TheWebVale',
    description: 'Get help, submit support tickets, report issues, and read documentation for FileCraft Universal File OS.',
    url: 'https://filecraft.thewebvale.com/support',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
