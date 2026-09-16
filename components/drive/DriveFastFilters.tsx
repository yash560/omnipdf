'use client';

import React, { useMemo } from 'react';
import { User, Car, Tag, Check, X, Sparkles } from 'lucide-react';
import { Tooltip } from './DriveTooltip';
import { useDrive } from '@/lib/drive/drive-context';

interface DriveFastFiltersProps {
  activePerson?: string;
  onSelectPerson: (person?: string) => void;
  activeVehicle?: string;
  onSelectVehicle: (vehicle?: string) => void;
  activeCategory?: string;
  onSelectCategory: (category?: string) => void;
  onClearAll: () => void;
}

export const DriveFastFilters: React.FC<DriveFastFiltersProps> = ({
  activePerson,
  onSelectPerson,
  activeVehicle,
  onSelectVehicle,
  activeCategory,
  onSelectCategory,
  onClearAll,
}) => {
  const { items } = useDrive();

  const allPeople = ['Yash', 'Yogesh', 'Shreya', 'Simpal', 'Amarangana'];
  const allVehicles = ['Amaze', 'Pulsar', 'Activa', 'Star City'];
  const categoryConfigs = [
    { label: 'Identity & KYC', id: 'Identity & KYC' },
    { label: 'Employment', id: 'Employment & Career' },
    { label: 'Property & Land', id: 'Property & Real Estate' },
    { label: 'Banking & Cards', id: 'Banking & Cards' },
    { label: 'Vehicles & Transport', id: 'Vehicle & Transport' },
  ];

  const activeCount = (activePerson ? 1 : 0) + (activeVehicle ? 1 : 0) + (activeCategory ? 1 : 0);
  const hasActiveFilters = activeCount > 0;

  // Compute people who actually have items in the drive
  const availablePeople = useMemo(() => {
    if (!items || items.length === 0) return [];
    return allPeople.filter((p) => {
      const pLower = p.toLowerCase();
      return items.some((it) => {
        if (it.isTrash) return false;
        const n = it.name.toLowerCase();
        const tags = (it.tags || []).map((t) => t.toLowerCase());
        return tags.includes(pLower) || n.includes(pLower);
      });
    });
  }, [items]);

  // Compute vehicles that actually have items in the drive
  const availableVehicles = useMemo(() => {
    if (!items || items.length === 0) return [];
    return allVehicles.filter((v) => {
      const vLower = v.toLowerCase();
      return items.some((it) => {
        if (it.isTrash) return false;
        const n = it.name.toLowerCase();
        const tags = (it.tags || []).map((t) => t.toLowerCase());
        return tags.includes(vLower) || n.includes(vLower);
      });
    });
  }, [items]);

  // Compute categories that actually have items in the drive
  const availableCategories = useMemo(() => {
    if (!items || items.length === 0) return [];
    return categoryConfigs.filter((cat) => {
      return items.some((it) => {
        if (it.isTrash) return false;
        const aiCat = (it.aiCategory || '').toLowerCase();
        return aiCat.includes(cat.id.toLowerCase()) || (cat.id === 'Identity & KYC' && aiCat.includes('identity'));
      });
    });
  }, [items]);

  // If there are no items and no active filter applied, do not render the bar
  if (!hasActiveFilters && availablePeople.length === 0 && availableVehicles.length === 0 && availableCategories.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-3 sm:px-6 py-2 bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2 sm:gap-3 text-xs select-none shrink-0 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
      {/* People Filters */}
      {availablePeople.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1 text-zinc-400 font-bold uppercase text-[10px] tracking-wider mr-0.5 shrink-0">
            <User className="w-3 h-3 text-blue-500" />
            <span>People:</span>
          </div>
          {availablePeople.map((p) => {
            const isActive = activePerson?.toLowerCase() === p.toLowerCase();
            return (
              <Tooltip key={p} content={isActive ? `Clear filter for ${p}` : `Filter documents for ${p}`} side="bottom">
                <button
                  type="button"
                  onClick={() => onSelectPerson(isActive ? undefined : p)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-500 text-white border-blue-600 shadow-xs font-bold'
                      : 'bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                  aria-label={`Filter by ${p}`}
                >
                  {isActive && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                  <span>{p}</span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}

      {availablePeople.length > 0 && availableVehicles.length > 0 && (
        <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800 shrink-0" />
      )}

      {/* Vehicle Filters */}
      {availableVehicles.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1 text-zinc-400 font-bold uppercase text-[10px] tracking-wider mr-0.5 shrink-0">
            <Car className="w-3 h-3 text-amber-500" />
            <span>Vehicles:</span>
          </div>
          {availableVehicles.map((v) => {
            const isActive = activeVehicle?.toLowerCase() === v.toLowerCase();
            return (
              <Tooltip key={v} content={isActive ? `Clear filter for ${v}` : `Filter records for ${v}`} side="bottom">
                <button
                  type="button"
                  onClick={() => onSelectVehicle(isActive ? undefined : v)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-bold'
                      : 'bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                  aria-label={`Filter by ${v}`}
                >
                  {isActive && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                  <span>{v}</span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}

      {(availablePeople.length > 0 || availableVehicles.length > 0) && availableCategories.length > 0 && (
        <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800 shrink-0" />
      )}

      {/* Category Filters */}
      {availableCategories.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1 text-zinc-400 font-bold uppercase text-[10px] tracking-wider mr-0.5 shrink-0">
            <Tag className="w-3 h-3 text-violet-500" />
            <span>Categories:</span>
          </div>
          {availableCategories.map((c) => {
            const isActive = activeCategory === c.id;
            return (
              <Tooltip key={c.id} content={isActive ? `Clear filter for ${c.label}` : `Filter by ${c.label}`} side="bottom">
                <button
                  type="button"
                  onClick={() => onSelectCategory(isActive ? undefined : c.id)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-violet-600 text-white border-violet-700 shadow-xs font-bold'
                      : 'bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                  aria-label={`Filter by ${c.label}`}
                >
                  {isActive && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                  <span>{c.label}</span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Tooltip content="Clear all active fast filters" side="left">
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto px-2.5 py-1 text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer shrink-0"
            aria-label="Clear all filters"
          >
            <X className="w-3 h-3" />
            <span>Clear ({activeCount})</span>
          </button>
        </Tooltip>
      )}
    </div>
  );
};

