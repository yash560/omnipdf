'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Tooltip({
  content,
  shortcut,
  side = 'top',
  align = 'center',
  delay = 180,
  children,
  className = '',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (disabled || !content) {
    return <>{children}</>;
  }

  // Positioning classes
  let positionClasses = '';
  switch (side) {
    case 'top':
      positionClasses = 'bottom-full mb-2';
      break;
    case 'bottom':
      positionClasses = 'top-full mt-2';
      break;
    case 'left':
      positionClasses = 'right-full mr-2 top-1/2 -translate-y-1/2';
      break;
    case 'right':
      positionClasses = 'left-full ml-2 top-1/2 -translate-y-1/2';
      break;
  }

  // Alignment classes for top/bottom
  if (side === 'top' || side === 'bottom') {
    switch (align) {
      case 'start':
        positionClasses += ' left-0';
        break;
      case 'center':
        positionClasses += ' left-1/2 -translate-x-1/2';
        break;
      case 'end':
        positionClasses += ' right-0';
        break;
    }
  }

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute pointer-events-none z-50 whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 text-3xs font-semibold shadow-xl backdrop-blur-xs border border-zinc-700/50 dark:border-zinc-300/50 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 ${positionClasses}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 dark:bg-zinc-200 text-zinc-300 dark:text-zinc-700 font-mono text-[9px] font-bold border border-zinc-700/50 dark:border-zinc-300/50">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
