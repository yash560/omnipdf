'use client';

import React, { useState } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { useAI } from '@/lib/ai/ai-context';
import { FOLDER_COLORS, DriveFolderColor } from '@/lib/drive/drive-types';
import { formatBytes, formatTimeAgo, getFileCraftToolsForItem } from '@/lib/drive/drive-helpers';
import {
  X,
  Sparkles,
  Tag,
  Palette,
  Calendar,
  HardDrive,
  Folder,
  FileText,
  ExternalLink,
  Bot,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export function DriveDetailsDrawer() {
  const { detailsItem, setDetailsItem, changeFolderColor } = useDrive();
  const { openDrawer, setActiveFile, triggerQuickAction } = useAI();
  const [newTag, setNewTag] = useState('');

  if (!detailsItem) return null;

  const isFolder = detailsItem.type === 'folder';
  const tools = getFileCraftToolsForItem(detailsItem);

  const handleAskAI = () => {
    setActiveFile({
      name: detailsItem.name,
      size: detailsItem.size,
    });
    openDrawer();
  };

  return (
    <aside className="w-80 shrink-0 border-l border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-4 space-y-6 overflow-y-auto hidden lg:flex lg:flex-col justify-between">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Details & Inspector
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDetailsItem(null)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-700 dark:text-zinc-300 shadow-sm">
            {isFolder ? <Folder className="w-7 h-7 text-amber-500" /> : <FileText className="w-7 h-7 text-rose-500" />}
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate px-2">
            {detailsItem.name}
          </h4>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono uppercase text-zinc-500 font-bold">
            {detailsItem.category}
          </span>
        </div>

        {/* AI Copilot Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-purple-500/10 to-cyan-500/10 border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              TheWebVale AI File Intelligence
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Instantly ask questions, extract structured metrics, formulas, or audit clauses from this file.
          </p>
          <button
            type="button"
            onClick={handleAskAI}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chat with this File</span>
          </button>
        </div>

        {/* Folder Color Picker (If folder) */}
        {isFolder && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <Palette className="w-3.5 h-3.5 text-purple-500" />
              <span>Folder Color</span>
            </div>
            <div className="grid grid-cols-5 gap-2 pt-1">
              {(Object.keys(FOLDER_COLORS) as DriveFolderColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => changeFolderColor(detailsItem.id, c)}
                  title={FOLDER_COLORS[c].label}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                    detailsItem.color === c ? 'ring-2 ring-rose-500 ring-offset-2' : 'border-white dark:border-zinc-800'
                  }`}
                  style={{ backgroundColor: FOLDER_COLORS[c].hex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Metadata Properties */}
        <div className="space-y-3 pt-2 text-xs">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
            Properties
          </div>

          <div className="space-y-2 font-sans">
            <div className="flex items-center justify-between text-zinc-500">
              <span>Size:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">
                {isFolder ? '—' : formatBytes(detailsItem.size)}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-500">
              <span>Type:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold truncate max-w-[150px]">
                {detailsItem.mimeType}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-500">
              <span>Created:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                {new Date(detailsItem.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-500">
              <span>Modified:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                {formatTimeAgo(detailsItem.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* FileCraft Tool Shortcuts */}
        {tools.length > 0 && (
          <div className="space-y-2 pt-2 text-xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
              Tool Actions
            </div>
            <div className="space-y-1.5">
              {tools.slice(0, 3).map((t, idx) => (
                <Link
                  key={idx}
                  href={t.href}
                  className="w-full flex items-center justify-between p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <span>{t.label}</span>
                  <ExternalLink className="w-3 h-3 text-rose-500" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 text-center">
        ID: <code className="font-mono">{detailsItem.id}</code>
      </div>
    </aside>
  );
}
