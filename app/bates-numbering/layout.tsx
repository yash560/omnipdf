import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bates Numbering PDF Online Free (100% In-Browser & Secure) — FileCraft',
  description: 'Apply sequential Bates numbering and legal stamping to PDF documents. 100% private in-browser WebAssembly processing with zero server uploads. Built by TheWebVale.',
  alternates: {
    canonical: 'https://filecraft.thewebvale.com/bates-numbering',
  },
  openGraph: {
    title: 'Bates Numbering PDF Online Free | FileCraft by TheWebVale',
    description: 'Enterprise and legal document discovery indexing with sequential prefixes, padded digits, and margins. 100% private in-browser.',
    url: 'https://filecraft.thewebvale.com/bates-numbering',
    siteName: 'FileCraft by TheWebVale',
    type: 'website',
    images: [
      {
        url: 'https://filecraft.thewebvale.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Bates Numbering & Stamping — FileCraft by TheWebVale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bates Numbering PDF Online Free | FileCraft by TheWebVale',
    description: 'Enterprise and legal document discovery indexing with sequential prefixes, padded digits, and margins. 100% private in-browser.',
    images: ['https://filecraft.thewebvale.com/og-image.png'],
    creator: '@thewebvale',
  },
};

const BATES_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      'name': 'FileCraft Bates Numbering Utility',
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web, All modern browsers',
      'url': 'https://filecraft.thewebvale.com/bates-numbering',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
      },
      'featureList': [
        'Client-side WebAssembly Bates stamping',
        'Sequential prefix and suffix customization',
        'Adjustable digit zero-padding and font sizes',
        'Zero cloud server document uploads',
      ],
      'author': {
        '@type': 'Organization',
        'name': 'TheWebVale',
        'url': 'https://www.thewebvale.com',
      },
    },
    {
      '@type': 'HowTo',
      'name': 'How to Apply Bates Numbering to a PDF Online for Free',
      'description': 'Step-by-step guide to index and stamp legal PDF documents with Bates numbers directly in your browser without uploading files.',
      'step': [
        {
          '@type': 'HowToStep',
          'position': 1,
          'name': 'Select or Drop PDF File',
          'text': 'Drag and drop your PDF legal document or evidence packet into FileCraft.',
        },
        {
          '@type': 'HowToStep',
          'position': 2,
          'name': 'Configure Bates Stamp Format',
          'text': 'Set your case prefix (e.g., CONFIDENTIAL- or PLTF-), starting number, and digit padding.',
        },
        {
          '@type': 'HowToStep',
          'position': 3,
          'name': 'Choose Position & Margin',
          'text': 'Select stamp placement (bottom-right, header, footer) and adjust font size and point margins.',
        },
        {
          '@type': 'HowToStep',
          'position': 4,
          'name': 'Apply and Download',
          'text': 'Click Apply Bates Numbering to process locally via WebAssembly and immediately download your stamped PDF.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What is Bates numbering on a PDF?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Bates numbering (or Bates stamping) is an indexing method used in legal discovery and enterprise document management to assign sequential, unique reference identifiers to each page of a document packet for tracking during trial, depositions, and evidentiary reviews.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Are my confidential legal documents uploaded to a server?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'No. FileCraft executes 100% client-side via in-browser WebAssembly. Your documents never leave your local device, ensuring complete attorney-client privilege and data confidentiality compliance.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Can I customize the prefix and starting number for Bates stamping?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. You can specify custom prefixes (such as DEF-, PLTF-, or CONFIDENTIAL-), suffixes, starting numbers, zero-padding length (e.g. 6 digits for 000001), and positioning.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BATES_SCHEMA) }}
      />
      {children}
    </>
  );
}
