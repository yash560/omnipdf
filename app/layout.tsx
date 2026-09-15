import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppDock } from '@/components/WhatsAppDock';
import { CommandMenu } from '@/components/CommandMenu';
import { AuthProvider } from '@/lib/auth/auth-context';
import { AuthModal } from '@/components/auth/AuthModal';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FileCraft — 50+ In-Browser File & Document Powerhouse Tools',
  description: 'Craft, convert, compress, edit, e-sign, and process PDFs, Images, Spreadsheets, Audio/Video, Archives, and AI Intelligence 100% locally in your browser with zero uploads.',
  keywords: ['FileCraft', 'PDF editor', 'image converter', 'csv cleaner', 'audio trimmer', 'video compress', 'burn share', 'client-side files'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <WhatsAppDock />
          <CommandMenu />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
