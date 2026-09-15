'use client';

import React, { useState } from 'react';
import { Copy, Check, Code2, WrapText, Search } from 'lucide-react';

export function DriveCodeViewer({ code, language = 'plaintext' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [search, setSearch] = useState('');

  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b] text-zinc-200 font-mono text-xs overflow-hidden">
      {/* Code Header Bar */}
      <div className="p-3 border-b border-zinc-800 bg-[#121214] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-zinc-400 font-extrabold text-[11px] uppercase tracking-wider">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span>{language} • {lines.length} Lines</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-40 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find in code..."
              className="w-full pl-8 pr-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => setWrap(!wrap)}
            className={`p-1.5 rounded-lg border border-zinc-700 transition-colors ${
              wrap ? 'bg-indigo-600/30 text-indigo-400 border-indigo-500/50' : 'bg-zinc-800 text-zinc-400'
            }`}
            title="Toggle Word Wrap"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Scroll Area */}
      <div className="flex-1 overflow-auto p-4 flex gap-4">
        {/* Line Numbers */}
        <div className="select-none text-zinc-600 text-right shrink-0 pr-3 border-r border-zinc-800/80 font-mono text-[11px] space-y-0.5">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <pre className={`flex-1 font-mono text-[11px] leading-relaxed text-zinc-100 ${wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
          <code>
            {lines.map((line, idx) => {
              const isMatch = search && line.toLowerCase().includes(search.toLowerCase());
              return (
                <div key={idx} className={isMatch ? 'bg-amber-500/20 text-amber-200 px-1 rounded-xs' : ''}>
                  {line || ' '}
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
