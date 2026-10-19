import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Repair Corrupted PDF Online Free (100% In-Browser & Secure) — FileCraft',
  description: 'Recover corrupted, damaged, or unreadable PDF files by rebuilding cross-reference (XRef) tables and stream trailers. 100% private in-browser WebAssembly processing. Built by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/repair',
  },
  openGraph: {
    title: 'Repair Corrupted PDF Online Free | FileCraft by TheWebVale',
    description: 'Recover corrupted or damaged PDF files by reconstructing cross-reference tables and unclosed streams.',
    url: 'https://filecraft.thewebvale.com/repair',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Repair Corrupted PDF — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Repair Corrupted PDF Online Free | FileCraft by TheWebVale',
    description: 'Recover corrupted or damaged PDF files by reconstructing cross-reference tables and unclosed streams.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

const REPAIR_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      'name': 'FileCraft PDF Repair Utility',
      'applicationCategory': 'UtilitiesApplication',
      'operatingSystem': 'Web, All modern browsers',
      'url': 'https://filecraft.thewebvale.com/repair',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
      },
      'featureList': [
        'Reconstruct broken cross-reference (XRef) tables',
        'Recover unclosed binary content streams',
        'Extract recoverable text and images from damaged PDF files',
        '100% in-browser WebAssembly processing with zero server uploads',
      ],
      'author': {
        '@type': 'Organization',
        'name': 'TheWebVale',
        'url': 'https://www.thewebvale.com',
      },
    },
    {
      '@type': 'HowTo',
      'name': 'How to Repair a Corrupted or Damaged PDF Online for Free',
      'description': 'Recover and fix unreadable or broken PDF documents in seconds without sending your data to remote servers.',
      'step': [
        {
          '@type': 'HowToStep',
          'position': 1,
          'name': 'Upload Damaged PDF File',
          'text': 'Drag and drop your corrupted, unopenable, or damaged PDF file into FileCraft.',
        },
        {
          '@type': 'HowToStep',
          'position': 2,
          'name': 'Automatic Diagnostic & Stream Scan',
          'text': 'The WebAssembly engine parses the document byte stream, diagnosing broken XRef tables and truncated trailers.',
        },
        {
          '@type': 'HowToStep',
          'position': 3,
          'name': 'Reconstruct Document Structure',
          'text': 'FileCraft rebuilds the object tree and restores recoverable pages and embedded elements.',
        },
        {
          '@type': 'HowToStep',
          'position': 4,
          'name': 'Download Repaired Document',
          'text': 'Preview and download your recovered, standard-compliant PDF file instantly.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'Why do PDF files get corrupted or fail to open?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'PDF corruption typically occurs due to interrupted downloads, unexpected system crashes during saving, email transmission packet drops, or broken cross-reference (XRef) index tables.',
          },
        },
        {
          '@type': 'Question',
          'name': 'How does FileCraft fix broken PDFs without uploading them?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'FileCraft uses compiled WebAssembly binary parsers running inside your browser sandbox to scan raw byte streams, bypass damaged header pointers, and assemble a clean PDF catalog locally.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Is it safe to repair sensitive or confidential PDFs here?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes, absolutely. Because FileCraft does not upload your file to any cloud server or database, your financial records, contracts, and legal evidence remain 100% private on your machine.',
          },
        },
      ],
    },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(REPAIR_SCHEMA) }}
      />
      {children}
    </>
  );
}
