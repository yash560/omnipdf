'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DriveItem, FOLDER_COLORS } from '@/lib/drive/drive-types';
import { requestAsyncThumbnail, getCachedThumbnail } from '@/lib/drive/thumbnail-manager';
import {
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Film,
  FolderArchive,
  FileCode,
  File,
  Folder,
} from 'lucide-react';

interface DriveThumbnailProps {
  item: DriveItem;
  view?: 'grid' | 'column' | 'table' | 'hero' | 'small';
  className?: string;
  imgClassName?: string;
}

export function DriveThumbnail({
  item,
  view = 'grid',
  className = '',
  imgClassName = '',
}: DriveThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 1. Check L1 Memory Cache Synchronously
  useEffect(() => {
    setImageLoaded(false);
    setLoadError(false);
    setThumbnailUrl(null);

    // If folder, no visual image thumbnail
    if (item.type === 'folder') return;

    // Fast check for existing cache
    getCachedThumbnail(item).then((cached) => {
      if (cached) {
        setThumbnailUrl(cached);
      }
    });
  }, [item.id, item.updatedAt, item.type]);

  // 2. Viewport-Based Lazy Loading via IntersectionObserver
  useEffect(() => {
    if (item.type === 'folder' || thumbnailUrl) return;

    const el = containerRef.current;
    if (!el) return;

    // If browser doesn't support IntersectionObserver, trigger immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Pre-load 200px before scrolling into view
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [item.id, item.type, thumbnailUrl]);

  // 3. Request Thumbnail on Viewport Entry
  useEffect(() => {
    if (!isInViewport || item.type === 'folder' || thumbnailUrl) return;

    const handle = requestAsyncThumbnail(item);

    handle.promise
      .then((url) => {
        if (url) {
          setThumbnailUrl(url);
        }
      })
      .catch(() => {
        setLoadError(true);
      });

    return () => {
      handle.cancel();
    };
  }, [isInViewport, item, thumbnailUrl]);

  // Render Category Icon Fallback
  const renderCategoryIcon = () => {
    const isSmall = view === 'table' || view === 'small';
    const iconSize = isSmall ? 'w-4 h-4' : view === 'column' ? 'w-12 h-12' : 'w-8 h-8';

    if (item.type === 'folder') {
      const colorConfig = FOLDER_COLORS[item.color || 'default'] || FOLDER_COLORS.default;
      return <Folder className={`${iconSize} fill-current ${colorConfig.textClass}`} />;
    }

    switch (item.category) {
      case 'pdf':
        return <FileText className={`${iconSize} text-rose-500`} />;
      case 'image':
        return <ImageIcon className={`${iconSize} text-purple-500`} />;
      case 'spreadsheet':
        return <TableIcon className={`${iconSize} text-emerald-500`} />;
      case 'media':
        return <Film className={`${iconSize} text-amber-500`} />;
      case 'archive':
        return <FolderArchive className={`${iconSize} text-cyan-500`} />;
      case 'code':
        return <FileCode className={`${iconSize} text-blue-500`} />;
      default:
        return <File className={`${iconSize} text-zinc-400`} />;
    }
  };

  // View style mappings
  const containerClasses =
    view === 'grid'
      ? 'w-full h-full flex items-center justify-center relative overflow-hidden bg-zinc-50 dark:bg-zinc-950/80'
      : view === 'column'
      ? 'w-full h-full flex items-center justify-center relative overflow-hidden bg-zinc-100 dark:bg-zinc-800/60'
      : view === 'table' || view === 'small'
      ? 'w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800'
      : 'w-full h-full flex items-center justify-center relative overflow-hidden';

  const isPdf = item.category === 'pdf' || item.name.toLowerCase().endsWith('.pdf');

  return (
    <div ref={containerRef} className={`${containerClasses} ${className}`}>
      {/* Background Category Icon (Always renders immediately for zero CLS) */}
      <div
        className={`flex items-center justify-center transition-opacity duration-300 ${
          thumbnailUrl && imageLoaded && !loadError ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {renderCategoryIcon()}
      </div>

      {/* Asynchronously Loaded Visual Thumbnail */}
      {thumbnailUrl && !loadError && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setLoadError(true)}
            className={`absolute inset-0 w-full h-full ${
              view === 'grid'
                ? isPdf
                  ? 'object-contain p-2 bg-zinc-100/50 dark:bg-zinc-900/50'
                  : 'object-cover'
                : view === 'column'
                ? 'object-contain p-2'
                : 'object-cover'
            } transition-all duration-300 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-98'
            } ${imgClassName}`}
          />

          {/* Subtle PDF Page Badge on Grid view */}
          {isPdf && imageLoaded && view === 'grid' && (
            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono font-bold text-white tracking-wider pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
              PDF
            </div>
          )}
        </>
      )}
    </div>
  );
}
