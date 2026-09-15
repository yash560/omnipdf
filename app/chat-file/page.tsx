'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { MessageSquareText, Send, Bot, User, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { ChatMessage } from '@/lib/ai/chat-file-engine';
import { extractTextFromPdf } from '@/lib/pdf/convert';

export default function ChatFilePage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [contextText, setContextText] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: 'Hello! Drop any document (PDF, Word, CSV, Code, or Text) and ask me anything about its contents.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      const f = newFiles[0].file;
      try {
        let text = '';
        if (f.name.endsWith('.pdf') || f.type === 'application/pdf') {
          const buf = await f.arrayBuffer();
          const extracted = await extractTextFromPdf(buf);
          text = extracted.fullText;
        } else {
          text = await f.text();
        }
        setContextText(text);
        setMessages([
          {
            role: 'model',
            content: `I have ingested "${f.name}" (${text.split(/\s+/).length} words). What would you like to know or analyze from this document?`,
          },
        ]);
      } catch (err: any) {
        alert(`Failed to extract text: ${err.message}`);
      }
    } else {
      setContextText('');
      setMessages([
        { role: 'model', content: 'Hello! Drop any document and ask me anything about its contents.' },
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          context: contextText,
        }),
      });

      if (!res.ok) throw new Error('Failed to query AI');
      const data = await res.json();
      setMessages([...nextMessages, { role: 'model', content: data.reply }]);
    } catch (err: any) {
      setMessages([...nextMessages, { role: 'model', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 2.5 Flash • Context Grounded File Chat</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Chat with Any Document
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Upload PDF, Word, CSV, JSON, or code files and ask questions, generate summaries, or extract key clauses.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept=".pdf,.docx,.txt,.csv,.json,.md,.js,.ts,.html,.py,text/*,application/pdf"
          multiple={false}
          title="Select or Drop Any Document"
          subtitle="Supports PDF, Word, CSV, Code, Text"
          primaryColor="#7c3aed"
        />
      </div>

      {/* Chat Conversation Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col h-[520px] justify-between">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'model' && (
                <div className="w-7 h-7 rounded-xl bg-violet-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-4 rounded-2xl max-w-[80%] whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-violet-600 text-white font-medium rounded-tr-none'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 text-xs text-zinc-400 items-center">
              <div className="w-7 h-7 rounded-xl bg-violet-500 text-white flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <span>Gemini is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
          <input
            type="text"
            placeholder={contextText ? 'Ask anything about the document...' : 'Upload a document above or ask general questions...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-violet-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
