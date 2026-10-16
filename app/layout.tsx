import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppDock } from '@/components/WhatsAppDock';
import { CommandMenu } from '@/components/CommandMenu';
import { AuthProvider } from '@/lib/auth/auth-context';
import { AuthModal } from '@/components/auth/AuthModal';
import { AIProvider } from '@/lib/ai/ai-context';
import { UniversalAIChatDrawer } from '@/components/ai/UniversalAIChatDrawer';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://filecraft.thewebvale.com'),
  title: {
    default: 'FileCraft — 50+ In-Browser File & Document Powerhouse Tools | TheWebVale',
    template: '%s | FileCraft by TheWebVale',
  },
  description:
    'Craft, convert, compress, edit, e-sign, and process PDFs, Images, Spreadsheets, Audio/Video, Archives, and AI Intelligence 100% locally in your browser with zero uploads. Engineered by TheWebVale.',
  keywords: [
    'FileCraft',
    'TheWebVale',
    'in-browser PDF tools',
    'client-side PDF editor',
    'zero-upload file converter',
    'merge PDF free',
    'compress PDF no upload',
    'OCR text extractor',
    'image converter WebAssembly',
    'secure cloud drive',
    'private personal vault',
    'BYOC file storage',
    'smart document AI',
  ],
  authors: [
    { name: 'Yash Jain', url: 'https://thewebvale.com' },
    { name: 'TheWebVale', url: 'https://thewebvale.com' },
  ],
  creator: 'Yash Jain (TheWebVale)',
  publisher: 'TheWebVale',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'FileCraft — 50+ In-Browser File & Document OS by TheWebVale',
    description:
      'Craft, convert, compress, edit, e-sign, and process PDFs, Images, Spreadsheets, Audio/Video, Archives, and AI Intelligence 100% locally in your browser with zero uploads.',
    url: 'https://filecraft.thewebvale.com',
    siteName: 'FileCraft by TheWebVale',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'FileCraft — Universal File OS & Drive by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FileCraft — 50+ In-Browser File & Document OS by TheWebVale',
    description:
      'Craft, convert, compress, edit, e-sign, and process PDFs, Images, Spreadsheets, Audio/Video, Archives, and AI Intelligence 100% locally in your browser with zero uploads.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
  other: {
    'geo.region': 'IN-DL',
    'geo.placename': 'New Delhi',
    'geo.position': '28.6139;77.2090',
    ICBM: '28.6139, 77.2090',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://filecraft.thewebvale.com/#app',
      name: 'FileCraft Universal File OS & Drive',
      url: 'https://filecraft.thewebvale.com',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'All modern browsers (WebAssembly)',
      browserRequirements: 'Requires JavaScript and WebAssembly support',
      description:
        '50+ in-browser file engines for document conversion, PDF manipulation, media editing, and private cloud storage with 100% client-side privacy.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1280',
      },
      author: {
        '@type': 'Organization',
        name: 'TheWebVale',
        url: 'https://thewebvale.com',
      },
      creator: {
        '@type': 'Person',
        name: 'Yash Jain',
        url: 'https://thewebvale.com',
      },
      publisher: {
        '@type': 'Organization',
        name: 'TheWebVale',
        url: 'https://thewebvale.com',
        logo: 'https://thewebvale.com/logo.png',
      },
      featureList: [
        '57 specialized in-browser tools for PDFs, Images, Audio, Video, Spreadsheets',
        '100% Zero-Upload Client-Side WebAssembly privacy architecture',
        'Self-Hosted BYOC Cloud Drive with GridFS and 2GB chunked uploads',
        'PBKDF2 Military-Grade PIN-protected Personal Vault',
        'Gemini-powered Multi-Document AI RAG Assistant',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://filecraft.thewebvale.com/#website',
      url: 'https://filecraft.thewebvale.com',
      name: 'FileCraft OS',
      description: 'The sovereign Universal File OS & BYOC Cloud Drive engineered by TheWebVale.',
      publisher: {
        '@type': 'Organization',
        name: 'TheWebVale',
        url: 'https://thewebvale.com',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} font-sans`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col selection:bg-rose-500 selection:text-white">
        <AuthProvider>
          <AIProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
            <WhatsAppDock />
            <CommandMenu />
            <AuthModal />
            <UniversalAIChatDrawer />
          </AIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
