import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Form Builder & AcroForms Online Free — 100% In-Browser & Secure',
  description: 'Add interactive fillable text fields, checkboxes, dropdown menus, and digital signature boxes to any PDF. 100% private in-browser processing with zero server uploads on FileCraft by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/form-builder',
  },
  openGraph: {
    title: 'PDF Form Builder & AcroForms Online Free | FileCraft by TheWebVale',
    description: 'Add interactive fillable text fields, checkboxes, dropdown menus, and digital signature boxes to any PDF.',
    url: 'https://filecraft.thewebvale.com/form-builder',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'PDF Form Builder & AcroForms — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Form Builder & AcroForms Online Free | FileCraft by TheWebVale',
    description: 'Add interactive fillable text fields, checkboxes, dropdown menus, and digital signature boxes to any PDF.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
