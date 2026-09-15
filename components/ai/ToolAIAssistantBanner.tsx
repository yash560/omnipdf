'use client';

import React, { useState } from 'react';
import { useAI } from '@/lib/ai/ai-context';
import { TOOL_ACTION_CHIPS, ToolActionChip } from '@/lib/ai/ai-types';
import { 
  Sparkles, 
  Send, 
  ArrowRight, 
  Bot, 
  Wand2, 
  CheckSquare, 
  ShieldAlert, 
  Mail, 
  Tag, 
  FileText, 
  Palette, 
  TrendingUp, 
  FunctionSquare, 
  Database, 
  CheckCircle2, 
  FileSpreadsheet, 
  Clock, 
  Subtitles, 
  Lock, 
  Binary, 
  EyeOff, 
  FolderTree, 
  FileCode2 
} from 'lucide-react';

const CHIP_ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Wand2,
  CheckSquare,
  ShieldAlert,
  Mail,
  Tag,
  FileText,
  Palette,
  TrendingUp,
  FunctionSquare,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Subtitles,
  Lock,
  Binary,
  EyeOff,
  FolderTree,
  FileCode2,
};

interface ToolAIAssistantBannerProps {
  suite: string;
  toolSlug: string;
  fileContext?: string;
  imageBase64?: string;
  fileName?: string;
  fileSize?: number;
}

export function ToolAIAssistantBanner({
  suite,
  toolSlug,
  fileContext,
  imageBase64,
  fileName,
  fileSize,
}: ToolAIAssistantBannerProps) {
  const { openDrawer, sendMessage, setActiveFile, setActiveTool, triggerQuickAction, isLoading } = useAI();
  const [quickInput, setQuickInput] = useState('');

  const chips: ToolActionChip[] = TOOL_ACTION_CHIPS[suite] || TOOL_ACTION_CHIPS.pdf || [];

  const handleSyncFile = () => {
    setActiveFile({
      name: fileName || 'Uploaded File',
      size: fileSize,
      textContent: fileContext,
      imageBase64: imageBase64,
    });
    setActiveTool({
      slug: toolSlug,
      name: toolSlug.replace(/-/g, ' ').toUpperCase(),
      suite: suite,
    });
  };

  const handleChipClick = async (chip: ToolActionChip) => {
    handleSyncFile();
    await triggerQuickAction(chip);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || isLoading) return;
    handleSyncFile();
    const text = quickInput;
    setQuickInput('');
    await sendMessage(text);
  };

  const handleOpenCopilot = () => {
    handleSyncFile();
    openDrawer();
  };

  return (
    <div className="w-full rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/5 via-purple-500/5 to-cyan-500/5 dark:from-rose-950/20 dark:via-purple-950/20 dark:to-cyan-950/20 p-4 sm:p-5 shadow-xs relative overflow-hidden my-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: AI Header & Description */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                AI File Intelligence & Chat Copilot
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ask questions, generate summaries, formulas, prompt breakdowns, or code from this file.
            </p>
          </div>
        </div>

        {/* Right: Quick Launch Full Copilot Button */}
        <button
          type="button"
          onClick={handleOpenCopilot}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-extrabold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Bot className="w-4 h-4" />
          <span>Open AI Chat Drawer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action Chips */}
      {chips.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
            Quick Actions:
          </span>
          {chips.map((chip) => {
            const Icon = CHIP_ICON_MAP[chip.icon] || Sparkles;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-rose-500" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Input Bar */}
      <form onSubmit={handleCustomSubmit} className="mt-3 relative flex items-center">
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder={`Ask AI anything about ${fileName || 'this file'}...`}
          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-inner"
        />
        <button
          type="submit"
          disabled={!quickInput.trim() || isLoading}
          className="absolute right-2 p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
