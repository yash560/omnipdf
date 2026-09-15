import { PDFTool } from '@/types/pdf';

export const PDF_TOOLS: PDFTool[] = [
  // Organize
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    slug: 'merge',
    description: 'Combine multiple PDF files into one single organized document in your desired order.',
    category: 'organize',
    icon: 'Layers',
    color: '#ef4444', // Red / Coral
    gradient: 'from-rose-500 to-red-600',
    popular: true,
    badge: 'Popular',
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    slug: 'split',
    description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    category: 'organize',
    icon: 'Scissors',
    color: '#f97316', // Orange
    gradient: 'from-orange-500 to-amber-600',
    popular: true,
  },
  {
    id: 'organize-pdf',
    name: 'Organize PDF',
    slug: 'organize',
    description: 'Sort, reorder, delete, rotate, and duplicate pages visually with a drag-and-drop grid.',
    category: 'organize',
    icon: 'LayoutGrid',
    color: '#f59e0b', // Amber
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    slug: 'rotate',
    description: 'Rotate your PDF pages 90, 180, or 270 degrees. Save individual or all pages permanently.',
    category: 'organize',
    icon: 'RotateCw',
    color: '#84cc16', // Lime
    gradient: 'from-lime-500 to-green-600',
  },
  {
    id: 'crop-pdf',
    name: 'Crop PDF',
    slug: 'crop',
    description: 'Trim margins, crop page headers/footers, and resize document dimensions precisely.',
    category: 'organize',
    icon: 'Crop',
    color: '#10b981', // Emerald
    gradient: 'from-emerald-500 to-teal-600',
  },

  // Optimize
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    slug: 'compress',
    description: 'Reduce file size while maintaining maximum PDF quality. Extreme, recommended, or light modes.',
    category: 'optimize',
    icon: 'Minimize2',
    color: '#06b6d4', // Cyan
    gradient: 'from-cyan-500 to-blue-600',
    popular: true,
    badge: 'High Speed',
  },
  {
    id: 'repair-pdf',
    name: 'Repair PDF',
    slug: 'repair',
    description: 'Recover corrupted or damaged PDF files and reconstruct corrupted document structures.',
    category: 'optimize',
    icon: 'Wrench',
    color: '#0284c7', // Sky
    gradient: 'from-sky-500 to-indigo-600',
  },

  // Edit
  {
    id: 'edit-pdf',
    name: 'Edit PDF (Canvas Studio)',
    slug: 'edit',
    description: 'Add text, shapes, freehand ink, highlights, images, sticky notes, and stamps to your PDF.',
    category: 'edit',
    icon: 'FileEdit',
    color: '#3b82f6', // Blue
    gradient: 'from-blue-600 to-indigo-700',
    popular: true,
    badge: 'Studio',
  },
  {
    id: 'watermark-pdf',
    name: 'Watermark PDF',
    slug: 'watermark',
    description: 'Stamp an image or text over your PDF in seconds. Customize typography, transparency, and position.',
    category: 'edit',
    icon: 'Stamp',
    color: '#6366f1', // Indigo
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'page-numbers',
    name: 'Page Numbers',
    slug: 'page-numbers',
    description: 'Add page numbers with customized formatting, position, margins, and typography styling.',
    category: 'edit',
    icon: 'Hash',
    color: '#8b5cf6', // Violet
    gradient: 'from-violet-500 to-purple-600',
  },

  // Security
  {
    id: 'sign-pdf',
    name: 'e-Sign PDF',
    slug: 'sign',
    description: 'Sign documents yourself or place signatures, initials, dates, and text with audit trails.',
    category: 'security',
    icon: 'PenTool',
    color: '#a855f7', // Purple
    gradient: 'from-purple-600 to-fuchsia-600',
    popular: true,
    badge: 'Verified',
  },
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    slug: 'protect',
    description: 'Encrypt your PDF with standard AES passwords and restrict unauthorized viewing or printing.',
    category: 'security',
    icon: 'Lock',
    color: '#d946ef', // Fuchsia
    gradient: 'from-fuchsia-500 to-pink-600',
  },
  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    slug: 'unlock',
    description: 'Remove password security from your protected PDF so you can read and share freely.',
    category: 'security',
    icon: 'Unlock',
    color: '#ec4899', // Pink
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'redact-pdf',
    name: 'Redact PDF',
    slug: 'redact',
    description: 'Permanently remove or blackout sensitive text, names, numbers, and private data.',
    category: 'security',
    icon: 'EyeOff',
    color: '#18181b', // Dark / Zinc
    gradient: 'from-zinc-700 to-neutral-900',
    badge: 'Privacy',
  },
  {
    id: 'flatten-pdf',
    name: 'Flatten PDF',
    slug: 'flatten',
    description: 'Bake all interactive form fields and annotations into static uneditable document streams.',
    category: 'security',
    icon: 'FileCheck',
    color: '#64748b', // Slate
    gradient: 'from-slate-600 to-gray-800',
  },

  // Convert
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    slug: 'jpg-to-pdf',
    description: 'Transform JPG, PNG, and WebP images to PDF. Adjust orientation, margins, and page sizes.',
    category: 'convert',
    icon: 'Image',
    color: '#14b8a6', // Teal
    gradient: 'from-teal-500 to-emerald-600',
    popular: true,
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    slug: 'pdf-to-jpg',
    description: 'Extract every page of your PDF into crisp, high-resolution 300 DPI JPG/PNG images + ZIP.',
    category: 'convert',
    icon: 'Images',
    color: '#059669', // Green
    gradient: 'from-emerald-600 to-green-700',
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text / MD',
    slug: 'pdf-to-text',
    description: 'Extract raw text, paragraphs, and structured markdown from your document effortlessly.',
    category: 'convert',
    icon: 'FileText',
    color: '#2563eb', // Blue
    gradient: 'from-blue-500 to-cyan-600',
  },

  // Smart & AI
  {
    id: 'ocr-pdf',
    name: 'OCR PDF (Searchable)',
    slug: 'ocr',
    description: 'Convert scanned PDFs and paper documents into fully searchable, selectable text.',
    category: 'smart',
    icon: 'ScanText',
    color: '#7c3aed', // Violet
    gradient: 'from-violet-600 to-indigo-700',
    badge: 'WASM AI',
  },
  {
    id: 'compare-pdf',
    name: 'Compare PDF (Diff)',
    slug: 'compare',
    description: 'Spot differences between two revisions of a PDF with side-by-side visual diffing.',
    category: 'smart',
    icon: 'Columns2',
    color: '#ea580c', // Orange
    gradient: 'from-amber-600 to-orange-700',
  },
];
