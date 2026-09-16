'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FileCraftLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'icon' | 'withText' | 'full';
  className?: string;
  withLink?: boolean;
  href?: string;
  animated?: boolean;
}

const sizeMap = {
  xs: 22,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

export function FileCraftLogo({
  size = 'md',
  variant = 'withText',
  className = '',
  withLink = false,
  href = '/',
  animated = true,
}: FileCraftLogoProps) {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 36;
  const isSmall = pixelSize <= 28;

  const IconElement = (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-md shadow-rose-500/15 border border-white/10 dark:border-zinc-800/80 bg-zinc-950 ${
        animated ? 'group-hover:scale-105 group-hover:shadow-rose-500/25 transition-all duration-300' : ''
      }`}
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
    >
      <Image
        src="/logo-sm.png"
        alt="FileCraft Logo"
        width={pixelSize * 2}
        height={pixelSize * 2}
        className="w-full h-full object-cover"
        priority={pixelSize >= 36}
      />
    </div>
  );

  const Content = (
    <div className={`inline-flex items-center gap-2.5 ${animated ? 'group' : ''} ${className}`}>
      {IconElement}
      {(variant === 'withText' || variant === 'full') && (
        <div className="flex flex-col select-none leading-none min-w-0">
          <div className="flex items-center gap-0.5">
            <span className={`font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent ${
              isSmall ? 'text-sm' : pixelSize >= 48 ? 'text-2xl' : 'text-lg sm:text-xl'
            }`}>
              File<span className="bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">Craft</span>
            </span>
          </div>
          {variant === 'full' && (
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase mt-0.5">
              Universal File OS
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link href={href} className="inline-flex items-center shrink-0 cursor-pointer">
        {Content}
      </Link>
    );
  }

  return Content;
}