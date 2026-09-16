'use client';

import { useState, useRef, useCallback } from 'react';
import { triggerHaptic } from '@/lib/drive/haptics';

interface UseLongPressOptions {
  onLongPress: (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => void;
  onClick?: (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => void;
  threshold?: number; // ms to trigger long press (default: 420ms)
  moveTolerance?: number; // max px allowed to move before canceling hold (default: 10px)
  haptic?: boolean;
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 420,
  moveTolerance = 12,
  haptic = true,
}: UseLongPressOptions) {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressedRef = useRef(false);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => {
      isLongPressedRef.current = false;
      const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as React.MouseEvent).clientY;

      if (clientX !== undefined && clientY !== undefined) {
        startPosRef.current = { x: clientX, y: clientY };
      }

      setIsPressing(true);

      timerRef.current = setTimeout(() => {
        isLongPressedRef.current = true;
        setIsPressing(false);
        if (haptic) {
          triggerHaptic('medium');
        }
        onLongPress(e);
      }, threshold);
    },
    [onLongPress, threshold, haptic]
  );

  const move = useCallback(
    (e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => {
      if (!startPosRef.current || !timerRef.current) return;

      const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as React.MouseEvent).clientY;

      if (clientX !== undefined && clientY !== undefined) {
        const dx = Math.abs(clientX - startPosRef.current.x);
        const dy = Math.abs(clientY - startPosRef.current.y);

        // If finger scrolled or moved beyond tolerance, cancel the hold
        if (dx > moveTolerance || dy > moveTolerance) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
          setIsPressing(false);
        }
      }
    },
    [moveTolerance]
  );

  const stop = useCallback(
    (e: React.TouchEvent | React.MouseEvent | React.PointerEvent, shouldTriggerClick = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setIsPressing(false);

      if (!isLongPressedRef.current && shouldTriggerClick && onClick) {
        onClick(e);
      }

      startPosRef.current = null;
    },
    [onClick]
  );

  return {
    isPressing,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        // Only trigger on primary touch/pointer button
        if (e.button === 0 || e.pointerType === 'touch') {
          start(e);
        }
      },
      onPointerMove: move,
      onPointerUp: (e: React.PointerEvent) => stop(e, true),
      onPointerCancel: (e: React.PointerEvent) => stop(e, false),
      onContextMenu: (e: React.MouseEvent) => {
        if (isLongPressedRef.current) {
          e.preventDefault();
        }
      },
    },
  };
}
