import { DriveCategory, DriveItem, QuickToolAction } from './drive-types';

export function categorizeFile(filename: string, mimeType?: string): DriveCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf' || mimeType?.includes('pdf')) {
    return 'pdf';
  }

  if (['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'bmp', 'ico', 'tiff', 'heic', 'heif'].includes(ext) || mimeType?.startsWith('image/')) {
    return 'image';
  }

  if (['csv', 'xlsx', 'xls', 'tsv', 'ods'].includes(ext) || mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || mimeType?.includes('csv')) {
    return 'spreadsheet';
  }

  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'srt', 'vtt'].includes(ext) || mimeType?.startsWith('video/') || mimeType?.startsWith('audio/')) {
    return 'media';
  }

  if (['docx', 'doc', 'epub', 'txt', 'rtf', 'odt'].includes(ext) || mimeType?.includes('word') || mimeType?.includes('epub')) {
    return 'document';
  }

  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext) || mimeType?.includes('zip') || mimeType?.includes('compressed') || mimeType?.includes('tar')) {
    return 'archive';
  }

  if (['json', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'scss', 'sql', 'sh', 'md', 'yaml', 'yml', 'xml', 'c', 'cpp', 'rs', 'go', 'php'].includes(ext)) {
    return 'code';
  }

  return 'other';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getFileCraftToolsForItem(item: DriveItem): QuickToolAction[] {
  if (item.type === 'folder') {
    return [
      { label: 'Download Folder as ZIP', href: '#zip', icon: 'FolderArchive', description: 'Package all files into a single ZIP' },
    ];
  }

  const queryParams = `?driveId=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}`;

  switch (item.category) {
    case 'pdf':
      return [
        { label: 'Open in PDF Editor', href: `/edit${queryParams}`, icon: 'FileEdit', description: 'Add text, forms, drawing & annotations' },
        { label: 'Compress PDF', href: `/compress${queryParams}`, icon: 'Minimize2', description: 'Reduce PDF file size without quality loss' },
        { label: 'Split & Extract Pages', href: `/split${queryParams}`, icon: 'Scissors', description: 'Extract page ranges or burst to individual files' },
        { label: 'e-Sign Document', href: `/sign${queryParams}`, icon: 'PenTool', description: 'Draw, place and stamp legal signatures' },
        { label: 'Extract Text / OCR', href: `/ocr${queryParams}`, icon: 'FileText', description: 'OCR scanned documents to text and Markdown' },
        { label: 'Protect / Lock', href: `/protect${queryParams}`, icon: 'Lock', description: 'Apply AES 128/256-bit encryption' },
        { label: 'Convert to Word / MD', href: `/docx-to-markdown${queryParams}`, icon: 'FileCode2', description: 'Export as structured Markdown' },
      ];

    case 'image':
      return [
        { label: 'AI Background Remover', href: `/bg-remover${queryParams}`, icon: 'Sparkles', description: '100% in-browser transparent cutout' },
        { label: 'Smart Image Compressor', href: `/image-compress${queryParams}`, icon: 'Minimize2', description: 'Compress to exact target file size' },
        { label: 'Universal Image Converter', href: `/image-converter${queryParams}`, icon: 'RefreshCw', description: 'Convert to WEBP, PNG, JPG, AVIF, ICO' },
        { label: 'Social & Passport Resizer', href: `/image-resizer${queryParams}`, icon: 'Maximize2', description: 'Crop to social presets & custom DPI' },
        { label: 'Color Palette Extractor', href: `/color-palette${queryParams}`, icon: 'Palette', description: 'Quantize colors with Tailwind codes & WCAG' },
        { label: 'EXIF Privacy Scrubber', href: `/exif-cleaner${queryParams}`, icon: 'ShieldCheck', description: 'Inspect & strip GPS / camera tracking tags' },
        { label: 'SVG Vectorizer & Optimizer', href: `/svg-optimizer${queryParams}`, icon: 'Layers', description: 'Trace raster images to vector SVG' },
      ];

    case 'spreadsheet':
      return [
        { label: 'Instant Data Visualizer', href: `/data-visualizer${queryParams}`, icon: 'BarChart3', description: 'Generate SVG Bar, Line, Pie, and Donut charts' },
        { label: 'CSV / Excel Cleaner', href: `/csv-cleaner${queryParams}`, icon: 'CheckSquare', description: 'Deduplicate rows, sanitize whitespace & dates' },
        { label: 'CSV ↔ Excel ↔ JSON Matrix', href: `/csv-json-excel${queryParams}`, icon: 'Table', description: 'Convert tabular formats with live grid' },
      ];

    case 'media':
      return [
        { label: 'Audio Waveform Trimmer', href: `/audio-trimmer${queryParams}`, icon: 'Scissors', description: 'Interactive visual waveform editor' },
        { label: 'Extract Audio from Video', href: `/audio-extractor${queryParams}`, icon: 'Music', description: 'Rip clean uncompressed 16-bit WAV' },
        { label: 'Video Compressor & Resizer', href: `/video-compress${queryParams}`, icon: 'Minimize2', description: 'Downscale & compress MP4/WebM video' },
        { label: 'Video to Animated GIF', href: `/video-to-gif${queryParams}`, icon: 'Film', description: 'Create lightweight looping GIFs and WebP' },
        { label: 'Subtitle SRT / VTT Editor', href: `/subtitle-editor${queryParams}`, icon: 'Subtitles', description: 'Sync timestamps and edit dialogue cues' },
      ];

    case 'document':
      return [
        { label: 'Word DOCX to Markdown', href: `/docx-to-markdown${queryParams}`, icon: 'FileText', description: 'Extract headings, lists, tables to Markdown' },
        { label: 'eBook & EPUB Studio', href: `/epub-converter${queryParams}`, icon: 'BookOpen', description: 'Read and create EPUB eBooks' },
      ];

    case 'archive':
      return [
        { label: 'Universal Unarchiver', href: `/unarchiver${queryParams}`, icon: 'FolderArchive', description: 'Unpack .zip, .tar, .gz in browser' },
        { label: 'ZIP Creator', href: `/zip-creator${queryParams}`, icon: 'Archive', description: 'Compress files into structured archives' },
        { label: 'Large File Splitter', href: `/file-splitter${queryParams}`, icon: 'Scissors', description: 'Split into exact chunks and rejoin' },
      ];

    case 'code':
      return [
        { label: 'Diff Checker', href: `/diff-checker${queryParams}`, icon: 'GitCompare', description: 'Line-by-line Myers diff comparison' },
        { label: 'Base64 & Hex Studio', href: `/base64-studio${queryParams}`, icon: 'Binary', description: 'Encode & decode Data URIs and bytes' },
        { label: 'Checksum & Hash Verifier', href: `/hash-verifier${queryParams}`, icon: 'Hash', description: 'Verify SHA-256, SHA-512, MD5' },
      ];

    default:
      return [
        { label: 'Checksum & Hash Verifier', href: `/hash-verifier${queryParams}`, icon: 'Hash', description: 'Verify SHA-256 integrity' },
        { label: 'Base64 & Hex Studio', href: `/base64-studio${queryParams}`, icon: 'Binary', description: 'Inspect raw binary bytes' },
        { label: 'Large File Splitter', href: `/file-splitter${queryParams}`, icon: 'Scissors', description: 'Chunk file for distribution' },
      ];
  }
}
