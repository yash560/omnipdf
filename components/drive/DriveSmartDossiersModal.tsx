'use client';

import React, { useState } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { SmartDossier, DriveItem } from '@/lib/drive/drive-types';
import {
  X,
  Layers,
  Briefcase,
  Car,
  Home,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Folder,
} from 'lucide-react';

interface DriveSmartDossiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDossier?: SmartDossier | null;
  dossiers: SmartDossier[];
}

export function DriveSmartDossiersModal({
  isOpen,
  onClose,
  initialDossier,
  dossiers,
}: DriveSmartDossiersModalProps) {
  const { openPreview, bulkDownloadZip, setIsFolderChatOpen } = useDrive();
  const [selectedDossier, setSelectedDossier] = useState<SmartDossier | null>(
    initialDossier || (dossiers.length > 0 ? dossiers[0] : null)
  );

  // Sync when initialDossier changes
  React.useEffect(() => {
    if (initialDossier) {
      setSelectedDossier(initialDossier);
    } else if (dossiers.length > 0 && !selectedDossier) {
      setSelectedDossier(dossiers[0]);
    }
  }, [initialDossier, dossiers]);

  if (!isOpen) return null;

  const currentDossier = selectedDossier || dossiers[0];

  const getDossierIcon = (icon: string) => {
    switch (icon) {
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'Car':
        return <Car className="w-5 h-5 text-emerald-500" />;
      case 'Home':
        return <Home className="w-5 h-5 text-amber-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-purple-500" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-pink-500" />;
      default:
        return <Folder className="w-5 h-5 text-rose-500" />;
    }
  };

  const handleDownloadDossierZip = () => {
    if (!currentDossier) return;
    bulkDownloadZip(currentDossier.items);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-modal-backdrop">
      <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans animate-modal-pop">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Smart Dossiers & Curated Bundles</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  AI Auto-Clustered
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Organized document collections with verified completeness scores and 1-click batch actions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Dossier List + Right Dossier Viewer */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Dossier Selector */}
          <div className="w-full md:w-80 border-r border-zinc-100 dark:border-zinc-800 overflow-y-auto p-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 px-2 block mb-2">
              Available Dossiers ({dossiers.length})
            </span>
            {dossiers.map((dos) => {
              const isSelected = currentDossier?.id === dos.id;
              const sizeMb = (dos.totalBytes / (1024 * 1024)).toFixed(1);
              return (
                <div
                  key={dos.id}
                  onClick={() => setSelectedDossier(dos)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-zinc-800/90 border-blue-500/40 shadow-sm'
                      : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${dos.accentColor}15` }}
                      >
                        {getDossierIcon(dos.icon)}
                      </div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {dos.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>
                      {dos.items.length} files ({sizeMb} MB)
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        dos.status === 'attention_needed'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {dos.completenessScore}% Ready
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Dossier Details & Item Explorer */}
          {currentDossier ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-6">
              {/* Dossier Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {currentDossier.category}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        currentDossier.status === 'attention_needed'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {currentDossier.status === 'attention_needed' ? '⚠️ Attention Needed' : '✅ 100% Complete'}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                    {currentDossier.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                    {currentDossier.description}
                  </p>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadDossierZip}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download ZIP</span>
                  </button>
                </div>
              </div>

              {/* Key Highlights & Completeness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dossier Highlights</span>
                  </h5>
                  <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                    {currentDossier.keyHighlights.map((hl, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Dossier Tags & Entities
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {currentDossier.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Included Files Table / Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Included Documents ({currentDossier.items.length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {currentDossier.items.map((file) => {
                    const sizeKb = (file.size / 1024).toFixed(0);
                    return (
                      <div
                        key={file.id}
                        onClick={() => openPreview(file)}
                        className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 border border-zinc-200/60 dark:border-zinc-700/60 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {file.name}
                            </h5>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {file.relativePath || file.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] text-zinc-400 font-medium">
                            {sizeKb} KB
                          </span>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
                            title="Quick Look"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              <span>Select a dossier from the left sidebar.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
