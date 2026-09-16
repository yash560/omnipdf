'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { triggerHaptic } from '@/lib/drive/haptics';

interface DrivePullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DrivePullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: DrivePullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const isPulling = useRef(false);

  const THRESHOLD = 65;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isPulling.current || touchStartY.current === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const rawDelta = currentY - touchStartY.current;

    const container = containerRef.current;
    if (container && container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    if (rawDelta > 0) {
      // Elastic rubber-band resistance
      const distance = Math.min(rawDelta * 0.45, 100);
      setPullDistance(distance);
      if (distance >= THRESHOLD && pullDistance < THRESHOLD) {
        triggerHaptic('light');
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || !isPulling.current || isRefreshing) return;

    isPulling.current = false;
    touchStartY.current = null;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(45); // Keep docked while refreshing
      triggerHaptic('success');
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full overflow-y-auto relative no-scrollbar"
    >
      {/* Pull-down spinner indicator */}
      <div
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? Math.min(pullDistance / 40, 1) : 0,
          transition: isPulling.current ? 'none' : 'height 240ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 200ms',
        }}
        className="w-full flex items-center justify-center overflow-hidden pointer-events-none select-none"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200">
          <RotateCcw
            style={{
              transform: `rotate(${pullDistance * 4}deg)`,
            }}
            className={`w-3.5 h-3.5 text-rose-500 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span>{isRefreshing ? 'Syncing Drive...' : pullDistance >= THRESHOLD ? 'Release to Sync' : 'Pull to Refresh'}</span>
        </div>
      </div>

      {children}
    </div>
  );
}
