'use client';

import React from 'react';
import { User, Car, Tag, FileText, Check, X } from 'lucide-react';

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
  const people = ['Yash', 'Yogesh', 'Shreya', 'Simpal', 'Amarangana'];
  const vehicles = ['Amaze', 'Pulsar', 'Activa', 'Star City'];
  const categories = [
    { label: 'Identity & KYC', id: 'Identity & KYC' },
    { label: 'Employment', id: 'Employment & Career' },
    { label: 'Property & Land', id: 'Property & Real Estate' },
    { label: 'Banking & Cards', id: 'Banking & Cards' },
    { label: 'Policies', id: 'Vehicle & Transport' },
  ];

  const hasActiveFilters = Boolean(activePerson || activeVehicle || activeCategory);

  return (
    <div className="px-6 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4 overflow-x-auto no-scrollbar text-xs">
      {/* People Filters */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1 text-zinc-400 font-semibold uppercase text-3xs tracking-wider mr-1">
          <User className="w-3 h-3 text-zinc-400" />
          <span>People:</span>
        </div>
        {people.map((p) => {
          const isActive = activePerson?.toLowerCase() === p.toLowerCase();
          return (
            <button
              key={p}
              onClick={() => onSelectPerson(isActive ? undefined : p)}
              className={`px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1 ${
                isActive
                  ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold'
                  : 'bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              }`}
            >
              {isActive && <Check className="w-2.5 h-2.5" />}
              <span>{p}</span>
            </button>
          );
        })}
      </div>

      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 shrink-0" />

      {/* Vehicle Filters */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1 text-zinc-400 font-semibold uppercase text-3xs tracking-wider mr-1">
          <Car className="w-3 h-3 text-zinc-400" />
          <span>Vehicles:</span>
        </div>
        {vehicles.map((v) => {
          const isActive = activeVehicle?.toLowerCase() === v.toLowerCase();
          return (
            <button
              key={v}
              onClick={() => onSelectVehicle(isActive ? undefined : v)}
              className={`px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1 ${
                isActive
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
                  : 'bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              }`}
            >
              {isActive && <Check className="w-2.5 h-2.5" />}
              <span>{v}</span>
            </button>
          );
        })}
      </div>

      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 shrink-0" />

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1 text-zinc-400 font-semibold uppercase text-3xs tracking-wider mr-1">
          <Tag className="w-3 h-3 text-zinc-400" />
          <span>Category:</span>
        </div>
        {categories.map((c) => {
          const isActive = activeCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelectCategory(isActive ? undefined : c.id)}
              className={`px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1 ${
                isActive
                  ? 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30 font-bold'
                  : 'bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              }`}
            >
              {isActive && <Check className="w-2.5 h-2.5" />}
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="ml-auto px-2.5 py-1 text-2xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition shrink-0"
        >
          <X className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      )}
    </div>
  );
};
