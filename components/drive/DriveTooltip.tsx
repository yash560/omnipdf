'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
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
  delay = 140,
  children,
  className = '',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    side: 'top' | 'bottom' | 'left' | 'right';
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();

    // If trigger element has 0 dimensions or is hidden, don't show
    if (rect.width === 0 && rect.height === 0) {
      setIsVisible(false);
      return;
    }

    // If element scrolled completely out of viewport, hide
    if (
      rect.bottom < 0 ||
      rect.top > window.innerHeight ||
      rect.right < 0 ||
      rect.left > window.innerWidth
    ) {
      setIsVisible(false);
      return;
    }

    const PADDING = 8;
    const ESTIMATED_HEIGHT = 30;
    const ESTIMATED_WIDTH = 120;

    let finalSide = side;

    // Viewport collision and smart flipping
    if (side === 'top' && rect.top - ESTIMATED_HEIGHT < PADDING) {
      finalSide = 'bottom';
    } else if (side === 'bottom' && rect.bottom + ESTIMATED_HEIGHT > window.innerHeight - PADDING) {
      finalSide = 'top';
    } else if (side === 'left' && rect.left - ESTIMATED_WIDTH < PADDING) {
      finalSide = 'right';
    } else if (side === 'right' && rect.right + ESTIMATED_WIDTH > window.innerWidth - PADDING) {
      finalSide = 'left';
    }

    let top = 0;
    let left = 0;

    switch (finalSide) {
      case 'top':
        top = rect.top - 6;
        if (align === 'start') {
          left = rect.left;
        } else if (align === 'end') {
          left = rect.right;
        } else {
          left = rect.left + rect.width / 2;
        }
        break;
      case 'bottom':
        top = rect.bottom + 6;
        if (align === 'start') {
          left = rect.left;
        } else if (align === 'end') {
          left = rect.right;
        } else {
          left = rect.left + rect.width / 2;
        }
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 6;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 6;
        break;
    }

    // Keep horizontal anchor inside viewport safely
    left = Math.max(PADDING, Math.min(left, window.innerWidth - PADDING));
    top = Math.max(PADDING, Math.min(top, window.innerHeight - PADDING));

    setCoords({ top, left, side: finalSide });
  }, [side, align]);

  const showTooltip = () => {
    if (disabled || !content) return;
    // Don't trigger on coarse touch-only devices
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    setCoords(null);
  };

  useEffect(() => {
    if (!isVisible) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible, updatePosition]);

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

  const getTransform = (s: 'top' | 'bottom' | 'left' | 'right', a: 'start' | 'center' | 'end') => {
    switch (s) {
      case 'top':
        if (a === 'start') return 'translate(0, -100%)';
        if (a === 'end') return 'translate(-100%, -100%)';
        return 'translate(-50%, -100%)';
      case 'bottom':
        if (a === 'start') return 'translate(0, 0)';
        if (a === 'end') return 'translate(-100%, 0)';
        return 'translate(-50%, 0)';
      case 'left':
        return 'translate(-100%, -50%)';
      case 'right':
        return 'translate(0, -50%)';
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={className ? className : 'inline-flex'}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={hideTooltip}
      >
        {children}
      </div>

      {mounted &&
        isVisible &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: getTransform(coords.side, align),
            }}
            className="pointer-events-none z-[999999] px-2 py-1 rounded-md bg-zinc-900/95 dark:bg-zinc-800/95 text-zinc-100 text-[11px] font-medium leading-tight shadow-md shadow-black/30 border border-zinc-700/60 dark:border-zinc-700/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 flex items-center gap-1.5 max-w-[280px] break-words"
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="px-1 py-0.2 rounded bg-zinc-800 dark:bg-zinc-700/90 text-zinc-300 font-mono text-[9px] font-bold border border-zinc-700/60 leading-tight shrink-0">
                {shortcut}
              </kbd>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

export default Tooltip;
