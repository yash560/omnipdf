import { DriveItem } from '@/lib/drive/drive-types';

export type ToolCategory = 
  | 'pdf' 
  | 'image' 
  | 'spreadsheet' 
  | 'media' 
  | 'document' 
  | 'ai' 
  | 'security' 
  | 'utility';

export interface FileCraftTool {
  id: string;
  name: string;
  href: string;
  category: ToolCategory;
  categoryLabel: string;
  description: string;
  iconName: string;
  badge?: 'AI' | 'Popular' | 'Fast' | 'New' | 'Pro';
  supportedExtensions: string[]; // e.g. ['pdf'] or ['jpg', 'png', 'webp'] or ['*']
  keywords: string[];
}

export const ALL_FILECRAFT_TOOLS: FileCraftTool[] = [
  // --- PDF SUITE ---
  {
    id: 'edit',
    name: 'PDF Editor & Annotator',
    href: '/edit',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Add text, shapes, forms, drawings, highlights and signatures.',
    iconName: 'FileEdit',
    badge: 'Popular',
    supportedExtensions: ['pdf'],
    keywords: ['edit', 'annotate', 'draw', 'text', 'highlight', 'fill', 'form', 'pdf', 'write'],
  },
  {
    id: 'compress',
    name: 'PDF Compressor',
    href: '/compress',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Shrink PDF file size with multi-tier lossless stream compression.',
    iconName: 'Minimize2',
    badge: 'Fast',
    supportedExtensions: ['pdf'],
    keywords: ['compress', 'shrink', 'reduce size', 'optimize', 'smaller', 'pdf', 'mb to kb'],
  },
  {
    id: 'merge',
    name: 'PDF Merger',
    href: '/merge',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Combine multiple PDF files and images into a single document.',
    iconName: 'Layers',
    badge: 'Popular',
    supportedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    keywords: ['merge', 'combine', 'join', 'concat', 'bind', 'collate', 'append'],
  },
  {
    id: 'split',
    name: 'Split & Extract Pages',
    href: '/split',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Separate page ranges or extract individual pages into new PDFs.',
    iconName: 'Scissors',
    badge: 'Fast',
    supportedExtensions: ['pdf'],
    keywords: ['split', 'extract', 'cut', 'pages', 'separate', 'burst', 'divide', 'range'],
  },
  {
    id: 'sign',
    name: 'e-Sign Document',
    href: '/sign',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Draw, type, or upload legal signatures and initials with audit seals.',
    iconName: 'PenTool',
    badge: 'Popular',
    supportedExtensions: ['pdf', 'png', 'jpg'],
    keywords: ['sign', 'signature', 'initials', 'legal', 'stamp', 'authorize', 'esign'],
  },
  {
    id: 'ocr',
    name: 'Extract Text / OCR',
    href: '/ocr',
    category: 'ai',
    categoryLabel: 'AI & OCR',
    description: 'Extract editable text from scanned documents, receipts and photos.',
    iconName: 'FileText',
    badge: 'AI',
    supportedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp'],
    keywords: ['ocr', 'text', 'extract', 'scan', 'read', 'recognize', 'tesseract', 'gemini'],
  },
  {
    id: 'organize',
    name: 'Organize & Rotate Pages',
    href: '/organize',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Drag-and-drop page re-ordering, 90° rotation, and page deletion.',
    iconName: 'ArrowUpDown',
    supportedExtensions: ['pdf'],
    keywords: ['organize', 'reorder', 'rotate', 'delete page', 'sort pages', 'rearrange'],
  },
  {
    id: 'crop',
    name: 'Document & Image Cropper',
    href: '/crop',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Crop margins, trim whitespace, and set custom aspect ratios.',
    iconName: 'Crop',
    supportedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
    keywords: ['crop', 'trim', 'cut margins', 'aspect ratio', 'resize view'],
  },
  {
    id: 'protect',
    name: 'Protect & Encrypt PDF',
    href: '/protect',
    category: 'security',
    categoryLabel: 'Security',
    description: 'Apply AES-256 password protection and permission restrictions.',
    iconName: 'Lock',
    supportedExtensions: ['pdf'],
    keywords: ['protect', 'password', 'encrypt', 'lock', 'secure', 'aes', 'permissions'],
  },
  {
    id: 'unlock',
    name: 'Unlock & Decrypt PDF',
    href: '/unlock',
    category: 'security',
    categoryLabel: 'Security',
    description: 'Remove password and copy restrictions from encrypted PDFs.',
    iconName: 'Unlock',
    supportedExtensions: ['pdf'],
    keywords: ['unlock', 'decrypt', 'remove password', 'unprotect', 'strip encryption'],
  },
  {
    id: 'watermark',
    name: 'Stamp Watermark',
    href: '/watermark',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Apply text or image watermarks with custom opacity, angle and size.',
    iconName: 'Stamp',
    supportedExtensions: ['pdf'],
    keywords: ['watermark', 'stamp', 'confidential', 'draft', 'overlay', 'logo watermark'],
  },
  {
    id: 'page-numbers',
    name: 'Page Numbers & Footers',
    href: '/page-numbers',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Add dynamic "Page X of Y" headers, footers and custom offsets.',
    iconName: 'Hash',
    supportedExtensions: ['pdf'],
    keywords: ['page numbers', 'footer', 'header', 'numbering', 'pagination', 'bates'],
  },
  {
    id: 'redact',
    name: 'Redact & Blackout PII',
    href: '/redact',
    category: 'security',
    categoryLabel: 'Security',
    description: 'Permanently remove and blackout sensitive text, SSN, PAN and credit cards.',
    iconName: 'EyeOff',
    badge: 'Pro',
    supportedExtensions: ['pdf', 'png', 'jpg'],
    keywords: ['redact', 'blackout', 'sanitize', 'pii', 'confidential', 'hide text', 'censor'],
  },
  {
    id: 'compare',
    name: 'Compare Two Documents',
    href: '/compare',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Visual side-by-side diff highlighting modified text and layout changes.',
    iconName: 'GitCompare',
    badge: 'New',
    supportedExtensions: ['pdf', 'png', 'jpg'],
    keywords: ['compare', 'diff', 'side by side', 'changes', 'version diff', 'audit diff'],
  },
  {
    id: 'flatten',
    name: 'Flatten PDF Forms',
    href: '/flatten',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Lock interactive form fields, layers and annotations into static pages.',
    iconName: 'Layers',
    supportedExtensions: ['pdf'],
    keywords: ['flatten', 'lock fields', 'static', 'unfillable', 'rasterize layers'],
  },
  {
    id: 'repair',
    name: 'Repair Corrupted PDF',
    href: '/repair',
    category: 'utility',
    categoryLabel: 'Utilities',
    description: 'Reconstruct broken cross-reference tables and damaged PDF headers.',
    iconName: 'Wrench',
    supportedExtensions: ['pdf'],
    keywords: ['repair', 'fix', 'corrupted', 'damaged', 'rebuild xref', 'broken pdf'],
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to High-Res JPG/PNG',
    href: '/pdf-to-jpg',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Render every PDF page into crisp 300 DPI image files or ZIP archive.',
    iconName: 'Image',
    supportedExtensions: ['pdf'],
    keywords: ['pdf to jpg', 'pdf to image', 'convert pdf to png', 'extract images from pdf'],
  },
  {
    id: 'pdf-to-docx',
    name: 'PDF to Word DOCX',
    href: '/pdf-to-docx',
    category: 'document',
    categoryLabel: 'Documents',
    description: 'Convert PDF layouts and text into editable Microsoft Word documents.',
    iconName: 'FileText',
    badge: 'Popular',
    supportedExtensions: ['pdf'],
    keywords: ['pdf to word', 'pdf to docx', 'editable word', 'convert to word'],
  },
  {
    id: 'pdf-to-pptx',
    name: 'PDF to PowerPoint PPTX',
    href: '/pdf-to-pptx',
    category: 'document',
    categoryLabel: 'Documents',
    description: 'Convert PDF slide decks into editable PowerPoint presentations.',
    iconName: 'Presentation',
    supportedExtensions: ['pdf'],
    keywords: ['pdf to pptx', 'pdf to powerpoint', 'slides', 'presentation'],
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Plain Text & Markdown',
    href: '/pdf-to-text',
    category: 'document',
    categoryLabel: 'Documents',
    description: 'Strip formatting and export raw readable text or clean Markdown.',
    iconName: 'FileCode2',
    supportedExtensions: ['pdf'],
    keywords: ['pdf to text', 'pdf to markdown', 'extract raw text', 'txt', 'md'],
  },
  {
    id: 'jpg-to-pdf',
    name: 'Images to PDF Converter',
    href: '/jpg-to-pdf',
    category: 'image',
    categoryLabel: 'Image Lab',
    description: 'Convert JPG, PNG, WEBP, and HEIC photos into a unified PDF document.',
    iconName: 'ImagePlus',
    badge: 'Popular',
    supportedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'heic'],
    keywords: ['jpg to pdf', 'images to pdf', 'photo to pdf', 'convert picture to pdf'],
  },

  // --- IMAGE LAB ---
  {
    id: 'bg-remover',
    name: 'AI Background Remover',
    href: '/bg-remover',
    category: 'image',
    categoryLabel: 'Image Lab',
    description: '100% in-browser AI model extracting clean transparent PNG cutouts.',
    iconName: 'Sparkles',
    badge: 'AI',
    supportedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
    keywords: ['bg remover', 'background removal', 'transparent', 'cutout', 'isolate subject', 'ai cutout'],
  },
  {
    id: 'image-compress',
    name: 'Smart Image Compressor',
    href: '/image-compress',
    category: 'image',
    categoryLabel: 'Image Lab',
    description: 'Compress PNG, JPG, and WebP images to exact target file sizes in KB/MB.',
    iconName: 'Minimize2',
    badge: 'Fast',
    supportedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'avif'],
    keywords: ['image compress', 'shrink photo', 'reduce image size', 'lossless', 'target kb'],
  },
  {
    id: 'image-converter',
    name: 'Universal Image Converter',
    href: '/image-converter',
    category: 'image',
    categoryLabel: 'Image Lab',
    description: 'Convert seamlessly between WEBP, PNG, JPG, AVIF, SVG, BMP, and ICO.',
    iconName: 'RefreshCw',
    supportedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'bmp', 'svg', 'ico', 'tiff', 'gif'],
    keywords: ['image converter', 'png to jpg', 'webp to png', 'heic to jpg', 'convert format'],
  },
  {
    id: 'image-resizer',
    name: 'Social & Passport Resizer',
    href: '/image-resizer',
    category: 'image',
    categoryLabel: 'Image Lab',
    description: 'Preset sizes for Instagram, YouTube, LinkedIn, Passport 2x2, and DPI adjustments.',
    iconName: 'Maximize2',
    supportedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
    keywords: ['resize', 'dimensions', 'passport size', 'instagram banner', 'youtube thumbnail', 'dpi'],
  },
  {
    id: 'color-palette',
    name: 'Color Palette Extractor',
    href: '/color-palette',
    category: 'image',
    categoryLabel: 'Image Lab',
    description: 'Quantize dominant color palettes with HEX, RGB, Tailwind codes & WCAG contrast.',
    iconName: 'Palette',
    badge: 'New',
    supportedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'],
    keywords: ['color palette', 'palette', 'hex codes', 'extract colors', 'dominant color', 'tailwind'],
  },
  {
    id: 'exif-cleaner',
    name: 'EXIF Privacy Scrubber',
    href: '/exif-cleaner',
    category: 'security',
    categoryLabel: 'Security',
    description: 'Inspect and permanently remove GPS coordinates, camera model, and timestamp metadata.',
    iconName: 'ShieldCheck',
    supportedExtensions: ['jpg', 'jpeg', 'png', 'tiff', 'heic', 'webp'],
    keywords: ['exif', 'metadata', 'gps', 'privacy', 'remove location', 'camera tags', 'scrub'],
  },

  // --- DATA & SPREADSHEETS ---
  {
    id: 'data-visualizer',
    name: 'Instant Data Visualizer',
    href: '/data-visualizer',
    category: 'spreadsheet',
    categoryLabel: 'Tabular Data',
    description: 'Transform CSV and Excel tables into interactive SVG Bar, Line, Pie, and Donut charts.',
    iconName: 'BarChart3',
    badge: 'Popular',
    supportedExtensions: ['csv', 'xlsx', 'xls', 'tsv', 'json'],
    keywords: ['chart', 'graph', 'visualize', 'csv to chart', 'excel chart', 'pie chart', 'bar graph'],
  },
  {
    id: 'csv-cleaner',
    name: 'CSV & Excel Cleaner',
    href: '/csv-cleaner',
    category: 'spreadsheet',
    categoryLabel: 'Tabular Data',
    description: 'Remove duplicates, trim trailing whitespace, fix date formats, and fill blank cells.',
    iconName: 'CheckSquare',
    supportedExtensions: ['csv', 'tsv', 'xlsx', 'xls'],
    keywords: ['clean csv', 'deduplicate rows', 'trim whitespace', 'sanitize table', 'fix dates'],
  },
  {
    id: 'csv-json-excel',
    name: 'CSV ↔ Excel ↔ JSON Matrix',
    href: '/csv-json-excel',
    category: 'spreadsheet',
    categoryLabel: 'Tabular Data',
    description: 'Bidirectional converter between CSV, Microsoft Excel, JSON objects, and SQL INSERTs.',
    iconName: 'Table',
    badge: 'Fast',
    supportedExtensions: ['csv', 'xlsx', 'xls', 'json', 'tsv'],
    keywords: ['csv to json', 'excel to json', 'json to csv', 'csv to excel', 'convert spreadsheet'],
  },
  {
    id: 'ai-table-extractor',
    name: 'AI Table & Receipt Extractor',
    href: '/ai-table-extractor',
    category: 'ai',
    categoryLabel: 'AI Suite',
    description: 'AI vision scans tables from PDFs/photos and outputs clean structured CSV/Excel.',
    iconName: 'TableProperties',
    badge: 'AI',
    supportedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
    keywords: ['table extractor', 'extract table from pdf', 'scan receipt to excel', 'ai table'],
  },
  {
    id: 'invoice-extractor',
    name: 'Smart Invoice & Bill Parser',
    href: '/invoice-extractor',
    category: 'ai',
    categoryLabel: 'AI Suite',
    description: 'Extract line items, GSTIN, invoice dates, vendor name, and total tax amount.',
    iconName: 'Receipt',
    badge: 'AI',
    supportedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
    keywords: ['invoice', 'bill', 'receipt', 'gstin', 'extract invoice', 'line items', 'tax total'],
  },

  // --- AUDIO & VIDEO ---
  {
    id: 'audio-trimmer',
    name: 'Audio Waveform Trimmer',
    href: '/audio-trimmer',
    category: 'media',
    categoryLabel: 'Audio & Video',
    description: 'Interactive visual waveform audio editor with millisecond trimming and fade in/out.',
    iconName: 'Scissors',
    supportedExtensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
    keywords: ['trim audio', 'cut mp3', 'audio cutter', 'ringtone', 'waveform editor', 'fade in'],
  },
  {
    id: 'audio-extractor',
    name: 'Extract Audio from Video',
    href: '/audio-extractor',
    category: 'media',
    categoryLabel: 'Audio & Video',
    description: 'Rip uncompressed WAV or 320kbps MP3 audio tracks directly from video files.',
    iconName: 'Music',
    supportedExtensions: ['mp4', 'mov', 'webm', 'mkv', 'avi'],
    keywords: ['extract audio', 'video to mp3', 'rip audio', 'video to sound', 'mp4 to wav'],
  },
  {
    id: 'ai-audio-summary',
    name: 'AI Audio & Meeting Summary',
    href: '/ai-audio-summary',
    category: 'ai',
    categoryLabel: 'AI Suite',
    description: 'Transcribe voice recordings and generate structured executive meeting action items.',
    iconName: 'Bot',
    badge: 'AI',
    supportedExtensions: ['mp3', 'wav', 'm4a', 'ogg', 'mp4', 'webm'],
    keywords: ['transcribe', 'speech to text', 'meeting notes', 'voice summary', 'whisper ai'],
  },

  // --- DOCUMENTS & E-BOOKS ---
  {
    id: 'docx-to-markdown',
    name: 'Word DOCX to Clean Markdown',
    href: '/docx-to-markdown',
    category: 'document',
    categoryLabel: 'Documents',
    description: 'Convert DOCX files into formatted GitHub Markdown with extracted tables and images.',
    iconName: 'FileText',
    badge: 'Popular',
    supportedExtensions: ['docx', 'doc', 'odt', 'rtf'],
    keywords: ['docx to md', 'word to markdown', 'convert docx', 'extract text from word'],
  },
  {
    id: 'epub-converter',
    name: 'eBook & EPUB Studio',
    href: '/epub-converter',
    category: 'document',
    categoryLabel: 'Documents',
    description: 'Read, extract, and convert EPUB eBooks to PDF and readable Markdown chapters.',
    iconName: 'BookOpen',
    supportedExtensions: ['epub', 'mobi', 'azw3'],
    keywords: ['epub', 'ebook', 'kindle', 'convert epub to pdf', 'read epub'],
  },

  // --- SECURITY & DEVELOPER UTILITIES ---
  {
    id: 'base64-studio',
    name: 'Base64 & Hex Studio',
    href: '/base64-studio',
    category: 'security',
    categoryLabel: 'Security & Dev',
    description: 'Encode and decode files to Base64 data URIs, Hex arrays, and binary inspection.',
    iconName: 'Binary',
    supportedExtensions: ['*'],
    keywords: ['base64', 'data uri', 'hex', 'encode base64', 'decode binary', 'inspector'],
  },
  {
    id: 'hash-verifier',
    name: 'Checksum & Hash Verifier',
    href: '/hash-verifier',
    category: 'security',
    categoryLabel: 'Security & Dev',
    description: 'Calculate and verify cryptographic SHA-256, SHA-512, MD5, and SHA-1 checksums.',
    iconName: 'Hash',
    badge: 'Fast',
    supportedExtensions: ['*'],
    keywords: ['hash', 'sha256', 'md5', 'checksum', 'verify integrity', 'sha512'],
  },
  {
    id: 'diff-checker',
    name: 'Myers Diff & Code Compare',
    href: '/diff-checker',
    category: 'security',
    categoryLabel: 'Security & Dev',
    description: 'Side-by-side Myers diff algorithm highlighting line and character modifications.',
    iconName: 'GitCompare',
    supportedExtensions: ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'py', 'sql', 'html', 'css', 'yaml', 'yml'],
    keywords: ['diff', 'compare text', 'code diff', 'side by side compare', 'changes'],
  },
  {
    id: 'qr-barcode',
    name: 'QR & Barcode Generator',
    href: '/qr-barcode',
    category: 'utility',
    categoryLabel: 'Utilities',
    description: 'Generate customizable SVG QR codes and standard Code-128/EAN barcodes.',
    iconName: 'QrCode',
    supportedExtensions: ['*'],
    keywords: ['qr code', 'barcode', 'generate qr', 'ean', 'code128', 'wifi qr', 'vcard'],
  },
  {
    id: 'burn-share',
    name: 'Burn & Share (Zero-Knowledge)',
    href: '/burn-share',
    category: 'security',
    categoryLabel: 'Security',
    description: 'Self-destructing end-to-end encrypted file sharing links (1-view or timer expiry).',
    iconName: 'Flame',
    badge: 'Pro',
    supportedExtensions: ['*'],
    keywords: ['burn share', 'self destruct', 'encrypted share', 'secret file', 'zero knowledge'],
  },
  {
    id: 'ai-file-renamer',
    name: 'AI Batch File Renamer',
    href: '/ai-file-renamer',
    category: 'ai',
    categoryLabel: 'AI Suite',
    description: 'AI inspects file contents and suggests standardized, clean, organized filenames.',
    iconName: 'Sparkles',
    badge: 'AI',
    supportedExtensions: ['*'],
    keywords: ['rename', 'ai renamer', 'clean filename', 'organize files', 'standardize names'],
  },
  {
    id: 'chat-file',
    name: 'Chat with Document (AI RAG)',
    href: '/chat-file',
    category: 'ai',
    categoryLabel: 'AI Suite',
    description: 'Ask deep multi-turn questions, summarize findings, and verify citations with Gemini.',
    iconName: 'MessageSquare',
    badge: 'AI',
    supportedExtensions: ['pdf', 'docx', 'txt', 'md', 'csv', 'xlsx', 'json'],
    keywords: ['chat with pdf', 'ask ai', 'gemini rag', 'document q&a', 'summarize document'],
  }
];

/**
 * Returns prioritized recommended tools for a specific DriveItem based on its type, extension, size, and category
 */
export function getRecommendedToolsForFile(item: DriveItem): FileCraftTool[] {
  if (item.type === 'folder') {
    return [
      ALL_FILECRAFT_TOOLS.find((t) => t.id === 'merge')!,
      ALL_FILECRAFT_TOOLS.find((t) => t.id === 'ai-file-renamer')!,
      ALL_FILECRAFT_TOOLS.find((t) => t.id === 'chat-file')!,
    ].filter(Boolean);
  }

  const ext = (item.extension || '').toLowerCase().replace(/^\./, '');
  const cat = item.category;

  const scored = ALL_FILECRAFT_TOOLS.map((tool) => {
    let score = 0;

    // Direct extension match
    if (tool.supportedExtensions.includes(ext)) {
      score += 50;
    }

    // Direct category match
    if (tool.category === cat) {
      score += 40;
    }

    // Wildcard support
    if (tool.supportedExtensions.includes('*')) {
      score += 10;
    }

    // Special situational heuristics
    if (cat === 'pdf') {
      if (['edit', 'compress', 'split', 'sign', 'ocr', 'protect', 'chat-file'].includes(tool.id)) {
        score += 35;
      }
      if (item.size > 5 * 1024 * 1024 && tool.id === 'compress') {
        score += 30; // Large PDF -> highly recommend compress
      }
    } else if (cat === 'image') {
      if (['bg-remover', 'image-compress', 'image-converter', 'image-resizer', 'jpg-to-pdf', 'ocr'].includes(tool.id)) {
        score += 35;
      }
      if (item.size > 2 * 1024 * 1024 && tool.id === 'image-compress') {
        score += 30;
      }
    } else if (cat === 'spreadsheet') {
      if (['data-visualizer', 'csv-cleaner', 'csv-json-excel', 'chat-file'].includes(tool.id)) {
        score += 35;
      }
    } else if (cat === 'media') {
      if (['audio-trimmer', 'audio-extractor', 'ai-audio-summary'].includes(tool.id)) {
        score += 35;
      }
    } else if (cat === 'document') {
      if (['docx-to-markdown', 'chat-file', 'ocr'].includes(tool.id)) {
        score += 35;
      }
    }

    return { tool, score };
  });

  // Filter out completely incompatible tools (unless wildcard) and sort by score descending
  return scored
    .filter((s) => s.score > 15)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.tool);
}

/**
 * Searches and filters all FileCraft tools matching a query string, with optional file-context prioritization
 */
export function searchFileCraftTools(query: string, item?: DriveItem | null): FileCraftTool[] {
  const q = query.trim().toLowerCase();
  
  if (!q) {
    if (item) {
      return getRecommendedToolsForFile(item);
    }
    return ALL_FILECRAFT_TOOLS;
  }

  const ext = item && item.type === 'file' ? (item.extension || '').toLowerCase().replace(/^\./, '') : '';

  return ALL_FILECRAFT_TOOLS.filter((t) => {
    // Search in name, category, description, keywords
    const matchName = t.name.toLowerCase().includes(q);
    const matchDesc = t.description.toLowerCase().includes(q);
    const matchCat = t.categoryLabel.toLowerCase().includes(q);
    const matchKeywords = t.keywords.some((k) => k.toLowerCase().includes(q));

    return matchName || matchDesc || matchCat || matchKeywords;
  }).sort((a, b) => {
    // Prioritize direct name startsWith matches
    const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
    const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
    if (aStarts !== bStarts) return bStarts - aStarts;

    // Prioritize compatibility with current file
    if (ext) {
      const aCompat = a.supportedExtensions.includes(ext) || a.supportedExtensions.includes('*') ? 1 : 0;
      const bCompat = b.supportedExtensions.includes(ext) || b.supportedExtensions.includes('*') ? 1 : 0;
      if (aCompat !== bCompat) return bCompat - aCompat;
    }

    return 0;
  });
}
