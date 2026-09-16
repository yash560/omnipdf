'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Type,
  AlignLeft,
  Sparkles,
  Eye,
  Edit3,
  Copy,
  Check,
  WrapText
} from 'lucide-react';

interface TextQuickStudioProps {
  blob: Blob;
  fileName: string;
  onProcessedBlobChange: (blob: Blob, newName: string, mimeType: string) => void;
}

export function TextQuickStudio({ blob, fileName, onProcessedBlobChange }: TextQuickStudioProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [wordWrap, setWordWrap] = useState<boolean>(true);

  // Stats
  const lineCount = content ? content.split('\n').length : 0;
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content.length;

  const isMarkdown = fileName.endsWith('.md') || fileName.endsWith('.markdown');
  const isJson = fileName.endsWith('.json');

  // Load text on mount
  useEffect(() => {
    async function loadText() {
      setLoading(true);
      try {
        const text = await blob.text();
        setContent(text);
      } catch (err) {
        console.error('Failed to load text in Quick Studio:', err);
      } finally {
        setLoading(false);
      }
    }
    loadText();
  }, [blob]);

  // Emit updated blob on content change
  useEffect(() => {
    if (loading) return;
    const ext = fileName.split('.').pop()?.toLowerCase();
    let mime = 'text/plain;charset=utf-8';
    if (ext === 'json') mime = 'application/json';
    else if (ext === 'md') mime = 'text/markdown';
    else if (ext === 'html') mime = 'text/html';
    else if (ext === 'css') mime = 'text/css';
    else if (ext === 'js' || ext === 'ts') mime = 'text/javascript';

    const outBlob = new Blob([content], { type: mime });
    onProcessedBlobChange(outBlob, fileName, mime);
  }, [content, fileName, loading, onProcessedBlobChange]);

  // Formatter functions
  const handlePrettifyJson = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed, null, 2));
    } catch {
      alert('Invalid JSON syntax');
    }
  };

  const handleMinifyJson = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed));
    } catch {
      alert('Invalid JSON syntax');
    }
  };

  const handleCaseChange = (type: 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'kebab') => {
    if (type === 'upper') setContent(content.toUpperCase());
    else if (type === 'lower') setContent(content.toLowerCase());
    else if (type === 'title') {
      setContent(
        content.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
      );
    } else if (type === 'snake') {
      setContent(
        content
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .replace(/\s+/g, '_')
          .toLowerCase()
      );
    } else if (type === 'kebab') {
      setContent(
        content
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .replace(/\s+/g, '-')
          .toLowerCase()
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-5 overflow-hidden select-none">
      {/* Editor Main Stage */}
      <div className="flex-1 bg-zinc-950 rounded-3xl border border-zinc-800 flex flex-col justify-between overflow-hidden relative">
        {/* Editor Top Bar */}
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-zinc-200 font-bold">{fileName}</span>
            <span>{lineCount} lines</span>
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWordWrap(!wordWrap)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                wordWrap ? 'border-rose-500 text-rose-400 bg-rose-500/10' : 'border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Toggle Word Wrap"
            >
              <WrapText className="w-3.5 h-3.5" />
            </button>

            {isMarkdown && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`p-1.5 rounded-xl border transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer ${
                  showPreview ? 'border-rose-500 text-rose-400 bg-rose-500/10' : 'border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Editor or Markdown View */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-200 leading-relaxed bg-zinc-950">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400">Loading Text Content...</div>
          ) : showPreview && isMarkdown ? (
            <div className="prose prose-invert max-w-none text-xs text-zinc-300">
              <div className="whitespace-pre-wrap font-sans leading-relaxed">{content}</div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full h-full bg-transparent text-zinc-100 font-mono text-xs outline-none resize-none ${
                wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
              }`}
              placeholder="Type or edit text content directly in Drive..."
              spellCheck={false}
            />
          )}
        </div>
      </div>

      {/* Control Sidebar */}
      <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shrink-0 overflow-y-auto space-y-5">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
          Quick Formatting Tools
        </div>

        {/* JSON Tools */}
        {isJson && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-rose-500" />
              <span>JSON Formatting</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrettifyJson}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-rose-50/30 transition-all cursor-pointer text-center"
              >
                Prettify JSON
              </button>
              <button
                onClick={handleMinifyJson}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-rose-50/30 transition-all cursor-pointer text-center"
              >
                Minify JSON
              </button>
            </div>
          </div>
        )}

        {/* Text Case Tools */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-indigo-500" />
            <span>Case Transformation</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'upper', label: 'UPPERCASE' },
              { id: 'lower', label: 'lowercase' },
              { id: 'title', label: 'Title Case' },
              { id: 'snake', label: 'snake_case' },
              { id: 'kebab', label: 'kebab-case' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => handleCaseChange(c.id as any)}
                className="py-2 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 text-center transition-colors cursor-pointer"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500 space-y-1">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 block">⚡ In-Place Cloud Sync:</span>
          <span>Edits are prepared in memory. Click "Replace Original" to update this file in Cloud Drive or "Save Copy" to create a new revision.</span>
        </div>
      </div>
    </div>
  );
}
