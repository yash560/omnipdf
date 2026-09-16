'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Trash2, CheckCircle2, AlertCircle, X, FileText, Loader2, Sparkles } from 'lucide-react';
import { DuplicateCluster, DriveItem } from '@/lib/drive/drive-types';

interface DriveDedupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshItems: () => void;
}

export const DriveDedupModal: React.FC<DriveDedupModalProps> = ({
  isOpen,
  onClose,
  onRefreshItems,
}) => {
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [wastedBytes, setWastedBytes] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchClusters();
    }
  }, [isOpen]);

  const fetchClusters = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/drive/dedup');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to detect duplicates');

      setClusters(data.clusters || []);
      setWastedBytes(data.totalWastedBytes || 0);

      // By default select all items except the suggestedKeepId
      const toDelete = new Set<string>();
      (data.clusters || []).forEach((c: DuplicateCluster) => {
        c.items.forEach((it) => {
          if (it.id !== c.suggestedKeepId) {
            toDelete.add(it.id);
          }
        });
      });
      setSelectedToDelete(toDelete);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCleanDuplicates = async () => {
    if (selectedToDelete.size === 0) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/drive/dedup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteItemIds: Array.from(selectedToDelete) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete duplicates');

      onRefreshItems();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-[620px] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Duplicate Document Cleaner</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Identify and clean duplicate files across folders to save space.
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

        {/* Stats Summary */}
        <div className="px-6 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Found {clusters.length} duplicate clusters ({selectedToDelete.size} copies selected)</span>
          </div>
          <span className="font-bold">Estimated Savings: {(wastedBytes / (1024 * 1024)).toFixed(1)} MB</span>
        </div>

        {/* Cluster List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="h-48 flex items-center justify-center gap-2 text-sm text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Scanning drive for duplicate files...</span>
            </div>
          ) : clusters.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-zinc-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
              <p className="font-bold text-zinc-800 dark:text-zinc-200 text-base">Zero Duplicates Found!</p>
              <p className="text-xs text-zinc-400 mt-1">Your document vault is 100% clean and optimized.</p>
            </div>
          ) : (
            clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                    {cluster.name}
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-700/60 px-2.5 py-0.5 rounded-full">
                    {(cluster.size / 1024).toFixed(1)} KB each ({cluster.items.length} copies)
                  </span>
                </div>

                <div className="space-y-2">
                  {cluster.items.map((it) => {
                    const isKeep = it.id === cluster.suggestedKeepId;
                    const isSelected = selectedToDelete.has(it.id);

                    return (
                      <div
                        key={it.id}
                        onClick={() => toggleSelect(it.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isKeep
                            ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                            : isSelected
                            ? 'bg-rose-500/5 border-rose-500/30'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(it.id)}
                            className="rounded text-rose-500 focus:ring-rose-500"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200">
                              {it.name}
                            </div>
                            <div className="text-3xs text-zinc-400 truncate">
                              Path: {it.relativePath || 'Root'}
                            </div>
                          </div>
                        </div>

                        {isKeep ? (
                          <span className="text-3xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                            Recommended Keep (Primary)
                          </span>
                        ) : (
                          <span className="text-3xs font-semibold text-rose-500 shrink-0">
                            {isSelected ? 'Marked for Deletion' : 'Keep Copy'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm font-medium transition"
          >
            Cancel
          </button>

          <button
            onClick={handleCleanDuplicates}
            disabled={selectedToDelete.size === 0 || deleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition flex items-center gap-2 shadow-md shadow-rose-500/20"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Clean {selectedToDelete.size} Duplicates</span>
          </button>
        </div>
      </div>
    </div>
  );
};
