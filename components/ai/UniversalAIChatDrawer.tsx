'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '@/lib/ai/ai-context';
import { PersonaSelector } from './PersonaSelector';
import { TOOL_ACTION_CHIPS, ToolActionChip, AI_PERSONAS } from '@/lib/ai/ai-types';
import { 
  Sparkles, 
  X, 
  Send, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Table, 
  Video, 
  Lock, 
  FolderArchive,
  Bot,
  User,
  Wand2,
  CheckSquare,
  ShieldAlert,
  Mail,
  Tag,
  Palette,
  TrendingUp,
  FunctionSquare,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Subtitles,
  Binary,
  EyeOff,
  FolderTree,
  FileCode2,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

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

export function UniversalAIChatDrawer() {
  const {
    isOpen,
    openDrawer,
    closeDrawer,
    activeFile,
    activeTool,
    persona,
    setPersona,
    messages,
    isLoading,
    sendMessage,
    triggerQuickAction,
    clearChat,
  } = useAI();
  useBodyScrollLock(isOpen);

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const exportContent = [
      `# FileCraft AI Chat Log`,
      `**File**: ${activeFile?.name || 'N/A'}`,
      `**Tool**: ${activeTool?.name || 'Universal Copilot'}`,
      `**Persona**: ${AI_PERSONAS[persona]?.name || persona}`,
      `**Date**: ${new Date().toLocaleString()}`,
      `\n---\n`,
      ...messages.map(
        (m) => `### ${m.role === 'user' ? '👤 User' : '🤖 FileCraft AI'}\n\n${m.content}\n\n`
      ),
    ].join('\n');

    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filecraft_ai_chat_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const suiteChips: ToolActionChip[] =
    (activeTool?.suite && TOOL_ACTION_CHIPS[activeTool.suite]) ||
    TOOL_ACTION_CHIPS.pdf ||
    [];

  return (
    <>
      {/* Floating Trigger Button (Desktop Only — Not sticky on Mobile) */}
      {!isOpen && (
        <div className="hidden md:flex fixed bottom-6 left-6 z-40 items-center group animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Open FileCraft AI Assistant"
            className="relative flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-purple-600/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <Sparkles className="w-4 h-4" />
            <span>AI File Copilot</span>
            {activeFile && (
              <span className="max-w-[100px] truncate px-2 py-0.5 rounded-full bg-black/30 text-[10px] text-rose-200">
                {activeFile.name}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Slide-Over Drawer Panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile & focus containment */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-modal-backdrop"
            onClick={closeDrawer}
          />
          <aside
            className={`fixed bottom-0 right-0 top-0 z-50 flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl animate-drawer-right transition-[width] duration-300 ${
              isExpanded
                ? 'w-full md:w-[700px] lg:w-[850px]'
                : 'w-full sm:w-[460px] md:w-[480px]'
            }`}
          >
          {/* Header */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 truncate">
                    FileCraft AI Copilot
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-bold">
                    2.5 Flash
                  </span>
                </div>
                {activeFile ? (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate max-w-[180px] font-medium">{activeFile.name}</span>
                    {activeFile.size && (
                      <span>({(activeFile.size / 1024).toFixed(0)} KB)</span>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-400">Ready for any file context</div>
                )}
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <PersonaSelector currentPersona={persona} onSelectPersona={setPersona} compact />

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Contract Drawer' : 'Expand Drawer'}
                className="hidden sm:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={closeDrawer}
                title="Close Drawer"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Context Banner if file loaded */}
          {activeFile && (
            <div className="px-4 py-2 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Active Context:
                </span>
                <span className="text-zinc-700 dark:text-zinc-300 truncate font-mono text-[11px]">
                  {activeFile.name}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400">
                {activeFile.imageBase64 ? '📷 Vision Attached' : '📄 Text Streamed'}
              </span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-zinc-500">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-rose-500/10 via-purple-500/10 to-cyan-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">
                    Ask FileCraft AI Anything
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    Upload a file in any tool or pick a quick action below to start an interactive deep analysis.
                  </p>
                </div>

                {/* Quick Starters */}
                <div className="w-full max-w-sm space-y-2 pt-2 text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                    Suggested Actions for {activeTool?.suite || 'Current'} Suite:
                  </div>
                  {suiteChips.map((chip) => {
                    const Icon = CHIP_ICON_MAP[chip.icon] || Sparkles;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => triggerQuickAction(chip)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                          <span>{chip.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-xs ${
                        isUser
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                          : 'bg-gradient-to-tr from-rose-500 to-purple-600 text-white'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-rose-500 text-white font-medium rounded-tr-xs'
                          : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans space-y-2">
                        {msg.content}
                      </div>

                      {!isUser && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-3.5 text-xs text-zinc-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    TheWebVale AI analyzing context...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Pills if in conversation */}
          {messages.length > 0 && suiteChips.length > 0 && (
            <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {suiteChips.slice(0, 3).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => triggerQuickAction(chip)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  + {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input Area */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <form onSubmit={handleSend} className="space-y-2">
              <div className="relative flex items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask AI about ${activeFile ? activeFile.name : 'your files'}... (Shift+Enter for newline)`}
                  rows={2}
                  className="w-full p-3 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <div className="flex items-center gap-3">
                  {messages.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={clearChat}
                        className="inline-flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportChat}
                        className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export .md</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Key Rotation Pool Active</span>
                </div>
              </div>
            </form>
          </div>
        </aside>
      </>
      )}
    </>
  );
}
