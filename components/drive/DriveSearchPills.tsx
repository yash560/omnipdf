'use client';

import React from 'react';
import { Sparkles, TrendingUp, Shield, Clock, FileText, ArrowRight } from 'lucide-react';

interface DriveSearchPillsProps {
  onSelectQuery: (query: string) => void;
  activeQuery?: string;
  isVaultUnlocked?: boolean;
  onOpenVaultModal?: () => void;
}

const SEARCH_PILLS = [
  { label: '💼 Salary Slips', query: 'salary slip', badge: '24' },
  { label: '🚗 Amaze & Pulsar', query: 'vehicle insurance', badge: '35' },
  { label: '🏠 Property Taxes', query: 'property tax', badge: '71' },
  { label: '📜 Relieving Letters', query: 'relieving letter', badge: '18' },
  { label: '🛂 KYC Proofs', query: 'aadhaar pan', badge: '69' },
  { label: '⚠️ Expiring Soon', query: 'expiry', badge: 'Radar' },
  { label: '💳 Bank Statements', query: 'bank passbook', badge: '12' },
];

export function DriveSearchPills({
  onSelectQuery,
  activeQuery = '',
  isVaultUnlocked = false,
  onOpenVaultModal,
}: DriveSearchPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 px-1 pr-6 mb-4 select-none" style={{ touchAction: 'pan-x' }}>
      <div className="flex items-center gap-1.5 text-3xs font-extrabold uppercase tracking-wider text-zinc-400 shrink-0 px-1">
        <Sparkles className="w-3.5 h-3.5 text-rose-500" />
        <span>Recommended:</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {SEARCH_PILLS.map((pill, i) => {
          const isSelected = activeQuery.toLowerCase() === pill.query.toLowerCase();
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectQuery(isSelected ? '' : pill.query)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs border ${
                isSelected
                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/20 font-bold'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-3xs font-mono font-bold px-1.5 py-0.2 rounded-md ${
                  isSelected
                    ? 'bg-black/20 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {pill.badge}
              </span>
            </button>
          );
        })}

        {!isVaultUnlocked && onOpenVaultModal && (
          <button
            type="button"
            onClick={onOpenVaultModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Search Vault (54 docs)</span>
          </button>
        )}
      </div>
    </div>
  );
}
