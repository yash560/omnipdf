import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cloud Workspace Dashboard — FileCraft by TheWebVale',
  description: 'Access your encrypted cloud drive, active sessions, and document analytics on FileCraft.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/dashboard',
  },
  openGraph: {
    title: 'Cloud Workspace Dashboard — FileCraft by TheWebVale',
    description: 'Access your encrypted cloud drive, active sessions, and document analytics on FileCraft.',
    url: 'https://filecraft.thewebvale.com/dashboard',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
