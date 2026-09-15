'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudCheck, Loader2, HardDrive, CheckCircle2 } from 'lucide-react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedTime: number | null;
  cloudSynced?: boolean;
  isUnsaved?: boolean;
}

export function AutoSaveIndicator({
  isSaving,
  lastSavedTime,
  cloudSynced = true,
  isUnsaved = false,
}: AutoSaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState('just now');

  useEffect(() => {
    if (!lastSavedTime) return;

    const update = () => {
      const diffSec = Math.floor((Date.now() - lastSavedTime) / 1000);
      if (diffSec < 5) {
        setTimeAgo('just now');
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else {
        const mins = Math.floor(diffSec / 60);
        setTimeAgo(`${mins}m ago`);
      }
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [lastSavedTime]);

  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold shadow-xs">
        <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
        <span>Auto-saving draft...</span>
      </div>
    );
  }

  if (isUnsaved) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shadow-xs">
      <CloudCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>Auto-saved {timeAgo}</span>
    </div>
  );
}
