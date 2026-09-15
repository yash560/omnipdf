'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Image as ImageIcon, 
  Table, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Wand2,
  CheckSquare,
  ShieldAlert,
  Mail,
  TrendingUp,
  Database
} from 'lucide-react';
import { AIPersonaId, AI_PERSONAS, TOOL_ACTION_CHIPS, ToolActionChip } from '@/lib/ai/ai-types';
import { PersonaSelector } from '@/components/ai/PersonaSelector';
import { extractTextFromPdf } from '@/lib/pdf/convert';

interface MessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export default function ChatFilePage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [contextText, setContextText] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [persona, setPersona] = useState<AIPersonaId>('general');
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'model',
      content: '👋 **Welcome to FileCraft AI Studio!**\nDrop any document (PDF, Word, CSV, JSON, Code) or image (PNG, JPG, WebP) and ask questions, generate summaries, reverse-engineer prompts, or extract insights.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      const f = newFiles[0].file;
      try {
        let text = '';
        let imgB64: string | undefined = undefined;

        if (f.type.startsWith('image/')) {
          const reader = new FileReader();
          imgB64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(f);
          });
          setImageBase64(imgB64);
          setContextText(`[Image File]: ${f.name} (${(f.size / 1024).toFixed(1)} KB, type: ${f.type})`);
          setPersona('vision');
          setMessages([
            {
              id: `ingest-${Date.now()}`,
              role: 'model',
              content: `📷 **Image Loaded**: "${f.name}" (${(f.size / 1024).toFixed(1)} KB).\nVision AI is ready! You can ask me to describe the image, reverse-engineer a Midjourney prompt, critique the composition/colors, or extract OCR text.`,
              timestamp: new Date(),
            },
          ]);
        } else if (f.name.endsWith('.pdf') || f.type === 'application/pdf') {
          const buf = await f.arrayBuffer();
          const extracted = await extractTextFromPdf(buf);
          text = extracted.fullText;
          setImageBase64(undefined);
          setContextText(text);
          setPersona('general');
          setMessages([
            {
              id: `ingest-${Date.now()}`,
              role: 'model',
              content: `📄 **PDF Ingested**: "${f.name}" (${text.split(/\s+/).filter(Boolean).length} words).\nWhat would you like to analyze or extract from this document?`,
              timestamp: new Date(),
            },
          ]);
        } else if (f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.json')) {
          text = await f.text();
          setImageBase64(undefined);
          setContextText(text);
          setPersona('analyst');
          setMessages([
            {
              id: `ingest-${Date.now()}`,
              role: 'model',
              content: `📊 **Dataset Ingested**: "${f.name}" (${text.split('\n').length} rows).\nData & Formula Analyst mode active. Ask for formulas, statistics, trend breakdowns, or SQL queries.`,
              timestamp: new Date(),
            },
          ]);
        } else {
          text = await f.text();
          setImageBase64(undefined);
          setContextText(text);
          setPersona('general');
          setMessages([
            {
              id: `ingest-${Date.now()}`,
              role: 'model',
              content: `📑 **File Ingested**: "${f.name}" (${text.split(/\s+/).filter(Boolean).length} words). Ask me anything!`,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err: any) {
        alert(`Failed to extract file context: ${err.message}`);
      }
    } else {
      setContextText('');
      setImageBase64(undefined);
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: '👋 **Welcome to FileCraft AI Studio!**\nDrop any document or image and ask questions, generate summaries, or extract key insights.',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendText = async (textToSend: string, overridePersona?: AIPersonaId) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/universal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          fileContext: contextText,
          imageBase64: imageBase64,
          personaId: overridePersona || persona,
          toolSlug: 'chat-file',
          suite: imageBase64 ? 'image' : contextText.includes(',') ? 'data' : 'pdf',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages([
        ...nextMessages,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          content: data.text || 'No response generated.',
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...nextMessages,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `⚠️ **Error**: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    const exportData = [
      `# FileCraft AI Studio Log`,
      `**File**: ${files[0]?.file.name || 'Universal Chat'}`,
      `**Persona**: ${AI_PERSONAS[persona]?.name || persona}`,
      `**Date**: ${new Date().toLocaleString()}`,
      `\n---\n`,
      ...messages.map((m) => `### ${m.role === 'user' ? '👤 User' : '🤖 AI'}\n\n${m.content}\n\n`),
    ].join('\n');

    const blob = new Blob([exportData], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filecraft_chat_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickChips: ToolActionChip[] = imageBase64
    ? TOOL_ACTION_CHIPS.image
    : contextText.length > 0 && (contextText.includes(',') || contextText.includes('\t'))
    ? TOOL_ACTION_CHIPS.data
    : TOOL_ACTION_CHIPS.pdf;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-extrabold shadow-xs">
          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
          <span>TheWebVale Multimodal AI • Context Grounded Studio</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
          AI Multimodal File Studio
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Drop any PDF, Image, Spreadsheet, Word DOCX, or Code file to chat with deep visual, analytical, and legal intelligence.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dropzone & Context Status */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Attached File Context</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                100% Private
              </span>
            </h3>

            <FileDropzone
              files={files}
              onFilesChange={handleFilesChange}
              accept=".pdf,.docx,.txt,.csv,.json,.md,.js,.ts,.html,.py,.png,.jpg,.jpeg,.webp,.heic,image/*,application/pdf,text/*"
              multiple={false}
            />

            {files.length > 0 && (
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">
                    {files[0].file.name}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {(files[0].file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                {imageBase64 && (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-36 flex items-center justify-center bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageBase64}
                      alt="Uploaded preview"
                      className="object-contain max-h-36 w-full"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Context active and loaded in memory</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Persona Card */}
          <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Active AI Persona
            </h4>
            <PersonaSelector currentPersona={persona} onSelectPersona={setPersona} />
            <p className="text-xs text-zinc-500 leading-relaxed">
              {AI_PERSONAS[persona]?.tagline || 'Customized for deep file analysis'}
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Chat Interface */}
        <div className="lg:col-span-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Multimodal Workspace Feed
                </h3>
                <span className="text-[10px] text-zinc-400">
                  Powered by TheWebVale Multimodal AI Engine
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      role: 'model',
                      content: 'Chat cleared. Ask me anything about your file!',
                      timestamp: new Date(),
                    },
                  ])
                }
                title="Clear Chat"
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportChat}
                title="Export Chat as Markdown"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips Bar */}
          <div className="px-4 py-2 bg-rose-50/40 dark:bg-rose-950/20 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap">
              Quick:
            </span>
            {quickChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  if (chip.persona) setPersona(chip.persona);
                  handleSendText(chip.prompt, chip.persona);
                }}
                disabled={loading}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-rose-500 hover:border-rose-400 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                + {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-xs ${
                      isUser
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        : 'bg-gradient-to-tr from-rose-500 to-purple-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-rose-500 text-white font-medium rounded-tr-xs'
                        : 'bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans space-y-2">
                      {msg.content}
                    </div>

                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Response</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 text-xs text-zinc-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    TheWebVale AI analyzing multimodal file context...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText(input);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about the uploaded file... (e.g. 'Summarize in 3 bullet points')"
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 p-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white disabled:opacity-40 transition-all cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
