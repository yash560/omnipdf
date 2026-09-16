'use client';

import { useEffect } from 'react';

/**
 * useBodyScrollLock
 *
 * Locks body scroll when a modal/popup is open — prevents background
 * scrolling on both desktop and iOS Safari mobile (which ignores
 * `overflow: hidden` on body unless position is fixed).
 *
 * Uses a ref-counter approach so multiple overlapping modals don't
 * fight each other: the last one to unmount restores the scroll.
 */

let lockCount = 0;
let savedScrollY = 0;

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      // Save current scroll position before locking
      savedScrollY = window.scrollY;

      // iOS Safari fix: position:fixed is the only reliable way to
      // prevent body scroll on mobile Safari
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflowY = 'scroll'; // keep scrollbar width to avoid layout shift
    }

    lockCount++;

    return () => {
      lockCount--;

      if (lockCount === 0) {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isLocked]);
}
