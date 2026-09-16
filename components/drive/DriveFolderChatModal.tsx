'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, FileText, Layers, Loader2, Copy, Check } from 'lucide-react';
import { DriveItem } from '@/lib/drive/drive-types';

interface DriveFolderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  items: DriveItem[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const DriveFolderChatModal: React.FC<DriveFolderChatModalProps> = ({
  isOpen,
  onClose,
  folderName,
  items,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message summarizing folder scope
      const fileCount = items.filter((i) => i.type === 'file').length;
      const folderCount = items.filter((i) => i.type === 'folder').length;
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `👋 Hello! I have loaded all **${fileCount} files** and **${folderCount} folders** inside **"${folderName}"** with their OCR text and AI summaries.\n\nAsk me anything across these documents! For example:\n- *"Summarize everything in this folder."*\n- *"What are the key policy numbers, dates, or ID details?"*\n- *"Find documents relating to salary or bills."*`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isOpen, folderName, items]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build Folder Document Context
    const docContext = items
      .map((it, idx) => {
        return `[Doc #${idx + 1}] Name: ${it.name} | Category: ${it.aiCategory || it.category} | Tags: ${(it.tags || []).join(', ')} | Summary: ${it.aiSummary || 'N/A'} | OCR Text: ${(it.ocrText || '').substring(0, 300)} | Expiry: ${it.expiryDetails || 'N/A'}`;
      })
      .join('\n\n');

    try {
      const res = await fetch('/api/ai/universal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are the FileCraft Drive Assistant analyzing the user's folder "${folderName}".
Answer the user's question accurately using ONLY the document context below. If specific numbers, dates, or names exist in the documents, cite them clearly in markdown bullet points.

--- FOLDER DOCUMENTS CONTEXT (${items.length} items) ---
${docContext}
------------------------------------------------------

User Query: ${query}`,
          persona: 'Universal Copilot',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get AI response');

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        role: 'assistant',
        content: data.response || 'I analyzed the documents in this folder.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Unable to analyze documents right now.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const promptChips = [
    '📄 Summarize all documents',
    '📅 List upcoming expiries & dates',
    '🆔 Extract all ID & Registration numbers',
    '💰 Calculate financial totals',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-[620px] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Chat with Folder</h3>
                <span className="px-2 py-0.5 rounded-full text-3xs font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  RAG Gemini 2.5
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                Analyzing {items.length} items in <span className="font-semibold text-zinc-700 dark:text-zinc-300">{folderName}</span>
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

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`relative group max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {!isUser && msg.id !== 'welcome' && (
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3 justify-start items-center text-xs text-zinc-400 dark:text-zinc-500">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-500 shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span>Analyzing folder documents...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Chips */}
        <div className="px-6 py-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar bg-zinc-50/30 dark:bg-zinc-900/30">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={loading}
              className="text-xs shrink-0 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-zinc-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-300 border border-zinc-200 dark:border-zinc-700 transition"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Dock */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about ${folderName}...`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border border-transparent dark:border-zinc-700/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition flex items-center gap-1.5 shadow-md shadow-violet-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
