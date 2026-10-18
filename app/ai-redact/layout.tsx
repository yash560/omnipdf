import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Smart PII Redactor Online Free — 100% In-Browser & Secure',
  description: '1-Click auto-discovery & permanent vector blackout for Aadhaar, PAN, SSNs, credit cards, phones, and emails. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/ai-redact',
  },
  openGraph: {
    title: 'AI Smart PII Redactor Online Free | FileCraft by TheWebVale',
    description: '1-Click auto-discovery & permanent vector blackout for Aadhaar, PAN, SSNs, credit cards, phones, and emails.',
    url: 'https://filecraft.thewebvale.com/ai-redact',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'AI Smart PII Redactor — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Smart PII Redactor Online Free | FileCraft by TheWebVale',
    description: '1-Click auto-discovery & permanent vector blackout for Aadhaar, PAN, SSNs, credit cards, phones, and emails.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
