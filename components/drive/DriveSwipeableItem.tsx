'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DriveItem } from '@/lib/drive/drive-types';
import { triggerHaptic } from '@/lib/drive/haptics';
import { Star, Trash2, Share2, Eye, MoreHorizontal, Check } from 'lucide-react';

interface DriveSwipeableItemProps {
  item: DriveItem;
  children: React.ReactNode;
  onStar?: () => void;
  onShare?: () => void;
  onTrash?: () => void;
  onOpenPreview?: () => void;
  onOpenOptions?: () => void;
  onLongPress?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DriveSwipeableItem({
  item,
  children,
  onStar,
  onShare,
  onTrash,
  onOpenPreview,
  onOpenOptions,
  onLongPress,
  onClick,
  disabled = false,
  className = '',
}: DriveSwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isScrolling = useRef<boolean | null>(null);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const didLongPress = useRef(false);

  // Close swipe tray if clicked outside
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalClick = () => {
      setTranslateX(0);
      setIsOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isScrolling.current = null;
    didLongPress.current = false;
    setIsPressing(true);

    // Start long-press timer (420ms)
    holdTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setIsPressing(false);
      triggerHaptic('medium');
      if (onLongPress) {
        onLongPress();
      }
    }, 420);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || touchStartX.current === null || touchStartY.current === null) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Detect if this is a vertical scroll or horizontal swipe
    if (isScrolling.current === null) {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
        isScrolling.current = true;
        // User is scrolling vertically, cancel hold timer
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }
        setIsPressing(false);
        return;
      } else if (Math.abs(deltaX) > 8) {
        isScrolling.current = false;
      }
    }

    // If scrolling vertically, let browser scroll naturally
    if (isScrolling.current === true) return;

    // User is swiping horizontally, cancel hold timer
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setIsPressing(false);

    // Calculate rubber-banded translation
    let newX = isOpen ? deltaX - 130 : deltaX;

    // Only allow left swipe (revealing actions) and slight right pull
    if (newX > 40) {
      newX = 40 * (1 + Math.log10(1 + (newX - 40) / 100)); // rubber band on right pull
    } else if (newX < -220) {
      newX = -220 - (Math.abs(newX) - 220) * 0.2; // rubber band on over-swipe left
    }

    setTranslateX(newX);
  };

  const handleTouchEnd = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setIsPressing(false);

    if (disabled || touchStartX.current === null) return;

    // Check over-swipe threshold for quick auto-action (> 180px swipe left)
    if (translateX < -180) {
      triggerHaptic('warning');
      if (onTrash) onTrash();
      setTranslateX(0);
      setIsOpen(false);
    } else if (translateX < -60) {
      // Snap open action tray
      triggerHaptic('light');
      setTranslateX(-130);
      setIsOpen(true);
    } else {
      // Snap closed
      setTranslateX(0);
      setIsOpen(false);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isScrolling.current = null;
  };

  const handleItemClick = (e: React.MouseEvent) => {
    if (didLongPress.current) {
      e.stopPropagation();
      return;
    }
    if (isOpen) {
      setTranslateX(0);
      setIsOpen(false);
      return;
    }
    if (onClick) onClick();
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl select-none ${className}`}>
      {/* Background Action Buttons Tray (Revealed on swipe left) */}
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-end z-0 px-2 gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-full transition-opacity duration-150 ${
          translateX !== 0 || isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Star Button */}
        {onStar && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('selection');
              onStar();
              setTranslateX(0);
              setIsOpen(false);
            }}
            className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center active:scale-95 transition-transform"
            title="Star"
          >
            <Star className={`w-4 h-4 ${item.isStarred ? 'fill-amber-400' : ''}`} />
          </button>
        )}

        {/* Share Button */}
        {onShare && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onShare();
              setTranslateX(0);
              setIsOpen(false);
            }}
            className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center active:scale-95 transition-transform"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {/* Trash / Delete Button */}
        {onTrash && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('warning');
              onTrash();
              setTranslateX(0);
              setIsOpen(false);
            }}
            className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center active:scale-95 transition-transform shadow-xs"
            title="Move to Trash"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Foreground Draggable Card / Row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleItemClick}
        style={{
          transform: `translateX(${translateX}px) scale(${isPressing ? 0.98 : 1})`,
          transition: touchStartX.current === null ? 'transform 240ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
        }}
        className="relative z-10 w-full bg-inherit"
      >
        {children}
      </div>
    </div>
  );
}
