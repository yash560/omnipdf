'use client';

import React, { useState, useEffect } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import {
  DriveRecommendation,
  SmartDossier,
  RecommendationResponse,
} from '@/lib/drive/drive-types';
import {
  Sparkles,
  Zap,
  Briefcase,
  Car,
  Home,
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  Clock,
  ArrowRight,
  FileText,
  Layers,
  Trash2,
  Lock,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Folder,
  Eye,
  X,
  Compass,
} from 'lucide-react';

interface DriveRecommendationHeroProps {
  onOpenDossiersModal?: (dossier?: SmartDossier) => void;
}

export function DriveRecommendationHero({
  onOpenDossiersModal,
}: DriveRecommendationHeroProps) {
  const {
    items,
    openPreview,
    navigateToFolder,
    isVaultUnlocked,
    setIsVaultModalOpen,
    setIsExpiryRadarOpen,
    setIsDedupModalOpen,
    bulkDownloadZip,
    viewSection,
  } = useDrive();

  const [activeTab, setActiveTab] = useState<'for_you' | 'actions' | 'dossiers' | 'stats'>('for_you');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Fetch recommendations
  const fetchRecommendations = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/drive/recommendations?vaultUnlocked=${isVaultUnlocked}&limit=8`);
      if (res.ok) {
        const data: RecommendationResponse = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.warn('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isSilent = recommendations !== null;
    fetchRecommendations(isSilent);
  }, [items.length, isVaultUnlocked]);

  // If on trash, shared, or vault sections, hide hero to keep focus
  if (viewSection === 'trash' || viewSection === 'shared') {
    return null;
  }

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => new Set([...prev, id]));
    // Send feedback to server
    fetch('/api/drive/recommendations/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendationId: id, action: 'dismiss' }),
    }).catch(() => {});
  };

  const handleActionClick = (rec: DriveRecommendation) => {
    if (rec.actionType === 'renew') {
      setIsExpiryRadarOpen(true);
    } else if (rec.actionType === 'dedup') {
      setIsDedupModalOpen(true);
    } else if (rec.actionType === 'open_folder') {
      if (rec.actionPayload?.section === 'vault') {
        setIsVaultModalOpen(true);
      } else if (rec.item.parentId) {
        navigateToFolder(rec.item.parentId);
      }
    } else {
      openPreview(rec.item);
    }

    // Send feedback
    fetch('/api/drive/recommendations/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recommendationId: rec.id,
        itemId: rec.itemId,
        action: 'click',
        stream: rec.stream,
      }),
    }).catch(() => {});
  };

  const forYouList = (recommendations?.forYou || []).filter((r) => !dismissedIds.has(r.id));
  const actionsList = (recommendations?.suggestedActions || []).filter((r) => !dismissedIds.has(r.id));
  const dossiersList = recommendations?.dossiers || [];

  if (!loading && forYouList.length === 0 && actionsList.length === 0 && dossiersList.length === 0) {
    return null;
  }

  const getDossierIcon = (icon: string) => {
    switch (icon) {
      case 'Briefcase':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'Car':
        return <Car className="w-4 h-4 text-emerald-500" />;
      case 'Home':
        return <Home className="w-4 h-4 text-amber-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-pink-500" />;
      default:
        return <Folder className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <section className="mb-6 rounded-2xl bg-gradient-to-b from-white to-zinc-50/80 dark:from-zinc-900 dark:to-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden transition-all duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Drive Intelligence</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                AI Recommender
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Stream Navigation Tabs */}
          <div className="flex items-center bg-zinc-200/60 dark:bg-zinc-800/60 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('for_you');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'for_you' && !isCollapsed
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-rose-500" />
              <span>Jump Back In</span>
              {forYouList.length > 0 && (
                <span className="text-[10px] px-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold">
                  {forYouList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('actions');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'actions' && !isCollapsed
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggested Actions</span>
              {actionsList.length > 0 && (
                <span className="text-[10px] px-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold">
                  {actionsList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('dossiers');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dossiers' && !isCollapsed
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Smart Dossiers</span>
              <span className="text-[10px] px-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold">
                {dossiersList.length}
              </span>
            </button>
          </div>

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Recommendations' : 'Collapse Recommendations'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content Body */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-zinc-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
              <span className="text-xs font-bold">Predicting relevant documents...</span>
            </div>
          ) : activeTab === 'for_you' ? (
            /* TAB 1: Jump Back In / For You Feed */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {forYouList.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => openPreview(rec.item)}
                  className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs hover:shadow-md hover:border-rose-400/50 dark:hover:border-rose-500/50 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-rose-600 dark:text-rose-400 block truncate">
                          {rec.badgeText || rec.item.category}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {rec.item.name}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDismiss(rec.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
                      title="Dismiss suggestion"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="truncate pr-2 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{rec.rationale}</span>
                    </span>
                    <span className="shrink-0 font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Open</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'actions' ? (
            /* TAB 2: Suggested Actions */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {actionsList.map((action) => (
                <div
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className="group relative flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs hover:shadow-md hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        {action.actionType === 'renew' ? (
                          <Clock className="w-4 h-4" />
                        ) : action.actionType === 'dedup' ? (
                          <Trash2 className="w-4 h-4" />
                        ) : action.actionType === 'merge' ? (
                          <Layers className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                          {action.badgeText || 'ACTION REQUIRED'}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                          {action.rationale}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400 font-medium">1-Click Automated Action</span>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <span>Execute</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TAB 3: Smart Dossiers */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dossiersList.map((dossier) => {
                const sizeMb = (dossier.totalBytes / (1024 * 1024)).toFixed(1);
                return (
                  <div
                    key={dossier.id}
                    onClick={() => onOpenDossiersModal && onOpenDossiersModal(dossier)}
                    className="group relative flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs hover:shadow-md hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${dossier.accentColor}15` }}
                          >
                            {getDossierIcon(dossier.icon)}
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                              {dossier.category}
                            </span>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {dossier.title}
                            </h4>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            dossier.status === 'attention_needed'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {dossier.status === 'attention_needed' ? 'Action Needed' : '100% Ready'}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                        {dossier.description}
                      </p>

                      <div className="space-y-1 mb-3">
                        {dossier.keyHighlights.slice(0, 2).map((hl, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{hl}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-zinc-400">
                        {dossier.items.length} files ({sizeMb} MB)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenDossiersModal) onOpenDossiersModal(dossier);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <span>View Packet</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
