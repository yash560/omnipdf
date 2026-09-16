'use client';

import React, { useMemo } from 'react';
import { Sparkles, Shield } from 'lucide-react';
import { useDrive } from '@/lib/drive/drive-context';

interface DriveSearchPillsProps {
  onSelectQuery: (query: string) => void;
  activeQuery?: string;
  isVaultUnlocked?: boolean;
  onOpenVaultModal?: () => void;
}

interface DynamicSearchPill {
  label: string;
  query: string;
  count: number;
}

export function DriveSearchPills({
  onSelectQuery,
  activeQuery = '',
  isVaultUnlocked = false,
  onOpenVaultModal,
}: DriveSearchPillsProps) {
  const { items } = useDrive();

  const dynamicPills = useMemo(() => {
    if (!items || items.length === 0) return [];

    const accessible = items.filter((it) => !it.isTrash);
    if (accessible.length === 0) return [];

    const pillConfigs = [
      {
        label: '💼 Salary Slips',
        query: 'salary slip',
        match: (it: any) => {
          const n = it.name.toLowerCase();
          const tags = (it.tags || []).map((t: string) => t.toLowerCase());
          return n.includes('salary') || n.includes('payslip') || tags.includes('salary slip');
        },
      },
      {
        label: '🚗 Vehicle Papers',
        query: 'vehicle insurance',
        match: (it: any) => {
          const n = it.name.toLowerCase();
          const tags = (it.tags || []).map((t: string) => t.toLowerCase());
          return (
            (it.aiCategory || '').toLowerCase().includes('vehicle') ||
            tags.includes('amaze') ||
            tags.includes('pulsar') ||
            tags.includes('activa') ||
            n.includes('rc') ||
            n.includes('puc') ||
            n.includes('insurance')
          );
        },
      },
      {
        label: '🏠 Property Taxes',
        query: 'property tax',
        match: (it: any) => {
          const n = it.name.toLowerCase();
          const tags = (it.tags || []).map((t: string) => t.toLowerCase());
          return (
            (it.aiCategory || '').toLowerCase().includes('property') ||
            tags.includes('property') ||
            n.includes('tax') ||
            n.includes('registry')
          );
        },
      },
      {
        label: '📜 Career & Letters',
        query: 'relieving letter',
        match: (it: any) => {
          const n = it.name.toLowerCase();
          return n.includes('relieving') || n.includes('offer') || n.includes('experience');
        },
      },
      {
        label: '🛂 Identity & KYC',
        query: 'aadhaar pan',
        match: (it: any) => {
          const n = it.name.toLowerCase();
          const tags = (it.tags || []).map((t: string) => t.toLowerCase());
          return (
            tags.includes('aadhaar') ||
            tags.includes('pan card') ||
            tags.includes('voter id') ||
            tags.includes('passbook') ||
            n.includes('aadhaar') ||
            n.includes('pan') ||
            n.includes('voter')
          );
        },
      },
      {
        label: '⏰ Expiring Soon',
        query: 'expiry',
        match: (it: any) => it.expiryStatus === 'expiring_soon' || it.expiryStatus === 'expired',
      },
      {
        label: '💳 Banking & Cards',
        query: 'bank passbook',
        match: (it: any) => {
          const n = it.name.toLowerCase();
          const tags = (it.tags || []).map((t: string) => t.toLowerCase());
          return tags.includes('passbook') || tags.includes('bank') || n.includes('passbook') || n.includes('cheque');
        },
      },
    ];

    const results: DynamicSearchPill[] = [];
    for (const config of pillConfigs) {
      const count = accessible.filter(config.match).length;
      if (count > 0) {
        results.push({ label: config.label, query: config.query, count });
      }
    }
    return results;
  }, [items]);

  const vaultCount = useMemo(() => {
    return (items || []).filter((it) => it.isVault && !it.isTrash).length;
  }, [items]);

  if (dynamicPills.length === 0 && (!onOpenVaultModal || vaultCount === 0)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 py-1 px-0.5 mb-3 select-none overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
      <div className="flex items-center gap-1.5 text-3xs font-extrabold uppercase tracking-wider text-zinc-400 shrink-0 px-1">
        <Sparkles className="w-3.5 h-3.5 text-rose-500" />
        <span>Recommended:</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {dynamicPills.map((pill, i) => {
          const isSelected = activeQuery.toLowerCase() === pill.query.toLowerCase();
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectQuery(isSelected ? '' : pill.query)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs border shrink-0 ${
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
                {pill.count}
              </span>
            </button>
          );
        })}

        {!isVaultUnlocked && vaultCount > 0 && onOpenVaultModal && (
          <button
            type="button"
            onClick={onOpenVaultModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer shrink-0"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Search Vault ({vaultCount} docs)</span>
          </button>
        )}
      </div>
    </div>
  );
}

