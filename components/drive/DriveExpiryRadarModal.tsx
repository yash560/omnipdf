'use client';

import React, { useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Clock, X, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { DriveItem, ExpiryStatus } from '@/lib/drive/drive-types';

interface DriveExpiryRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DriveItem[];
  onSelectItem: (item: DriveItem) => void;
}

export const DriveExpiryRadarModal: React.FC<DriveExpiryRadarModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
}) => {
  const [filter, setFilter] = useState<'all' | ExpiryStatus>('all');

  if (!isOpen) return null;

  const expiryItems = items.filter((it) => it.expiryStatus && it.expiryStatus !== 'none');
  const filtered = filter === 'all' ? expiryItems : expiryItems.filter((i) => i.expiryStatus === filter);

  const expiredCount = expiryItems.filter((i) => i.expiryStatus === 'expired').length;
  const expiringSoonCount = expiryItems.filter((i) => i.expiryStatus === 'expiring_soon').length;
  const validCount = expiryItems.filter((i) => i.expiryStatus === 'valid').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-modal-backdrop">
      <div className="relative w-full max-w-3xl h-[600px] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-modal-pop">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Document Expiry & Renewal Radar</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Track renewal deadlines for vehicle insurance, PUCs, licenses, property taxes, and policies.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-3 gap-3 p-6 pb-2">
          <button
            onClick={() => setFilter('expired')}
            className={`p-3.5 rounded-2xl border text-left transition ${
              filter === 'expired'
                ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-500/20 ring-2 ring-rose-500/30'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Expired / Renewal Due</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{expiredCount}</div>
            <div className="text-3xs text-zinc-400">Past renewal deadline</div>
          </button>

          <button
            onClick={() => setFilter('expiring_soon')}
            className={`p-3.5 rounded-2xl border text-left transition ${
              filter === 'expiring_soon'
                ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 ring-2 ring-amber-500/30'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Expiring Soon</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{expiringSoonCount}</div>
            <div className="text-3xs text-zinc-400">Within 60 days</div>
          </button>

          <button
            onClick={() => setFilter('valid')}
            className={`p-3.5 rounded-2xl border text-left transition ${
              filter === 'valid'
                ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 ring-2 ring-emerald-500/30'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active & Valid</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{validCount}</div>
            <div className="text-3xs text-zinc-400">Long-term coverage</div>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                filter === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              All Tracked ({expiryItems.length})
            </button>
          </div>
          <span className="text-2xs text-zinc-400">Showing {filtered.length} documents</span>
        </div>

        {/* List of Expiring Items */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {filtered.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center text-zinc-400">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
              <p className="text-sm font-semibold">No documents found in this status</p>
            </div>
          ) : (
            filtered.map((item) => {
              const statusColor =
                item.expiryStatus === 'expired'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : item.expiryStatus === 'expiring_soon'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                  className="group p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-zinc-800 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-200/70 dark:bg-zinc-700/70 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {item.name}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span className="truncate max-w-xs">{item.relativePath || 'Root'}</span>
                        {item.expiryDetails && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-600 dark:text-zinc-300 font-medium">{item.expiryDetails}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                      {item.expiryStatus === 'expired'
                        ? 'Expired'
                        : item.expiryStatus === 'expiring_soon'
                        ? `${item.expiryDaysLeft}d left`
                        : 'Active'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
