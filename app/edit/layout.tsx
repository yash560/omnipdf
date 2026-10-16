import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Full In-Browser PDF Editor Studio — Annotate, Draw & Modify',
  description: 'Comprehensive in-browser PDF editor to annotate, highlight, draw, redact, and add text to documents 100% client-side with FileCraft.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/edit',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
