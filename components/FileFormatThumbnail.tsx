'use client';

import React from 'react';
import {
  FileText,
  Table,
  Film,
  Music,
  FolderArchive,
  FileCode,
  File,
  Image as ImageIcon,
  Presentation,
} from 'lucide-react';

export function getFileFormatMeta(filename: string, mimeType?: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mime = (mimeType || '').toLowerCase();

  // 1. Spreadsheet
  if (
    ['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext) ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv')
  ) {
    return {
      category: 'spreadsheet',
      label: ext ? ext.toUpperCase() : 'XLSX',
      sublabel: 'Spreadsheet',
      icon: Table,
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      cardBorderClass: 'border-emerald-200/60 dark:border-emerald-800/50',
      badgeClass: 'bg-emerald-600 text-white',
      accentGlow: 'shadow-emerald-500/10',
    };
  }

  // 2. PDF
  if (ext === 'pdf' || mime === 'application/pdf') {
    return {
      category: 'pdf',
      label: 'PDF',
      sublabel: 'Document',
      icon: FileText,
      colorClass: 'text-rose-500 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40',
      cardBorderClass: 'border-rose-200/60 dark:border-rose-800/50',
      badgeClass: 'bg-rose-600 text-white',
      accentGlow: 'shadow-rose-500/10',
    };
  }

  // 3. Word / Document
  if (
    ['docx', 'doc', 'rtf', 'odt', 'txt', 'md', 'epub'].includes(ext) ||
    mime.includes('word') ||
    mime.includes('document')
  ) {
    return {
      category: 'document',
      label: ext ? ext.toUpperCase() : 'DOCX',
      sublabel: 'Document',
      icon: FileText,
      colorClass: 'text-blue-500 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40',
      cardBorderClass: 'border-blue-200/60 dark:border-blue-800/50',
      badgeClass: 'bg-blue-600 text-white',
      accentGlow: 'shadow-blue-500/10',
    };
  }

  // 4. Presentation
  if (
    ['pptx', 'ppt', 'key', 'odp'].includes(ext) ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) {
    return {
      category: 'presentation',
      label: ext ? ext.toUpperCase() : 'PPTX',
      sublabel: 'Slides',
      icon: Presentation,
      colorClass: 'text-amber-500 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      cardBorderClass: 'border-amber-200/60 dark:border-amber-800/50',
      badgeClass: 'bg-amber-600 text-white',
      accentGlow: 'shadow-amber-500/10',
    };
  }

  // 5. Image
  if (
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'heic', 'tiff'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    return {
      category: 'image',
      label: ext ? ext.toUpperCase() : 'IMG',
      sublabel: 'Image',
      icon: ImageIcon,
      colorClass: 'text-purple-500 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40',
      cardBorderClass: 'border-purple-200/60 dark:border-purple-800/50',
      badgeClass: 'bg-purple-600 text-white',
      accentGlow: 'shadow-purple-500/10',
    };
  }

  // 6. Archive
  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'].includes(ext) ||
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('tar')
  ) {
    return {
      category: 'archive',
      label: ext ? ext.toUpperCase() : 'ZIP',
      sublabel: 'Archive',
      icon: FolderArchive,
      colorClass: 'text-amber-500 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      cardBorderClass: 'border-amber-200/60 dark:border-amber-800/50',
      badgeClass: 'bg-amber-600 text-white',
      accentGlow: 'shadow-amber-500/10',
    };
  }

  // 7. Video
  if (
    ['mp4', 'mov', 'webm', 'mkv', 'avi', 'wmv', 'flv'].includes(ext) ||
    mime.startsWith('video/')
  ) {
    return {
      category: 'video',
      label: ext ? ext.toUpperCase() : 'VIDEO',
      sublabel: 'Video',
      icon: Film,
      colorClass: 'text-violet-500 dark:text-violet-400',
      bgClass: 'bg-violet-50 dark:bg-violet-950/40',
      cardBorderClass: 'border-violet-200/60 dark:border-violet-800/50',
      badgeClass: 'bg-violet-600 text-white',
      accentGlow: 'shadow-violet-500/10',
    };
  }

  // 8. Audio
  if (
    ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'].includes(ext) ||
    mime.startsWith('audio/')
  ) {
    return {
      category: 'audio',
      label: ext ? ext.toUpperCase() : 'AUDIO',
      sublabel: 'Audio',
      icon: Music,
      colorClass: 'text-pink-500 dark:text-pink-400',
      bgClass: 'bg-pink-50 dark:bg-pink-950/40',
      cardBorderClass: 'border-pink-200/60 dark:border-pink-800/50',
      badgeClass: 'bg-pink-600 text-white',
      accentGlow: 'shadow-pink-500/10',
    };
  }

  // 9. Code / Data
  if (
    ['json', 'js', 'ts', 'tsx', 'jsx', 'py', 'html', 'css', 'sql', 'yaml', 'yml', 'xml', 'sh', 'c', 'cpp', 'rs', 'go', 'java'].includes(ext)
  ) {
    return {
      category: 'code',
      label: ext ? ext.toUpperCase() : 'CODE',
      sublabel: 'Code / Data',
      icon: FileCode,
      colorClass: 'text-cyan-500 dark:text-cyan-400',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
      cardBorderClass: 'border-cyan-200/60 dark:border-cyan-800/50',
      badgeClass: 'bg-cyan-600 text-white',
      accentGlow: 'shadow-cyan-500/10',
    };
  }

  // 10. Fallback
  return {
    category: 'other',
    label: ext ? ext.toUpperCase() : 'FILE',
    sublabel: 'Document',
    icon: File,
    colorClass: 'text-zinc-500 dark:text-zinc-400',
    bgClass: 'bg-zinc-100 dark:bg-zinc-800/60',
    cardBorderClass: 'border-zinc-200 dark:border-zinc-700',
    badgeClass: 'bg-zinc-700 text-white',
    accentGlow: 'shadow-zinc-500/10',
  };
}

interface FileFormatThumbnailProps {
  name: string;
  mimeType?: string;
  previewUrl?: string;
  rotation?: number;
  className?: string;
  imgClassName?: string;
}

export function FileFormatThumbnail({
  name,
  mimeType,
  previewUrl,
  rotation = 0,
  className = '',
  imgClassName = '',
}: FileFormatThumbnailProps) {
  const meta = getFileFormatMeta(name, mimeType);
  const IconComponent = meta.icon;

  if (previewUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center overflow-hidden relative ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={name}
          className={`w-full h-full object-contain transition-transform duration-300 ${imgClassName}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        {/* Subtle Category Pill in corner */}
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-zinc-950/70 backdrop-blur-xs text-[9px] font-mono font-black text-white tracking-wider pointer-events-none shadow-xs">
          {meta.label}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-3 rounded-xl ${meta.bgClass} ${meta.cardBorderClass} border relative overflow-hidden transition-all select-none ${className}`}
    >
      {/* Decorative Grid Motif for Spreadsheets */}
      {meta.category === 'spreadsheet' && (
        <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:12px_12px]" />
      )}

      {/* Decorative Line Motif for Code / Text */}
      {(meta.category === 'code' || meta.category === 'document') && (
        <div className="absolute inset-x-3 top-3 space-y-1.5 opacity-20 dark:opacity-10 pointer-events-none">
          <div className="h-1 bg-current rounded-full w-3/4" />
          <div className="h-1 bg-current rounded-full w-1/2" />
          <div className="h-1 bg-current rounded-full w-5/6" />
        </div>
      )}

      {/* Main Category Icon */}
      <div className={`p-3 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm ${meta.cardBorderClass} border ${meta.accentGlow} mb-2 relative z-10`}>
        <IconComponent className={`w-8 h-8 ${meta.colorClass} stroke-[1.8]`} />
      </div>

      {/* Format Badge */}
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase shadow-2xs relative z-10 ${meta.badgeClass}`}>
        {meta.label}
      </span>

      {/* Format Subtitle */}
      <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 relative z-10 tracking-tight">
        {meta.sublabel}
      </span>
    </div>
  );
}
