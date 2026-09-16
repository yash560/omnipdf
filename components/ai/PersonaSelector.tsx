'use client';

import React from 'react';
import { AIPersonaId, AI_PERSONAS } from '@/lib/ai/ai-types';
import { 
  Sparkles, 
  Table, 
  Eye, 
  ShieldAlert, 
  Code2, 
  FileText,
  ChevronDown 
} from 'lucide-react';

interface PersonaSelectorProps {
  currentPersona: AIPersonaId;
  onSelectPersona: (id: AIPersonaId) => void;
  compact?: boolean;
}

const PERSONA_ICONS: Record<AIPersonaId, React.ElementType> = {
  general: Sparkles,
  analyst: Table,
  vision: Eye,
  legal: ShieldAlert,
  dev: Code2,
  writer: FileText,
};

export function PersonaSelector({ currentPersona, onSelectPersona, compact }: PersonaSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const active = AI_PERSONAS[currentPersona] || AI_PERSONAS.general;
  const ActiveIcon = PERSONA_ICONS[currentPersona] || Sparkles;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer btn-press ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-xs'
        }`}
      >
        <span className="p-1 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <ActiveIcon className="w-3.5 h-3.5" />
        </span>
        <span className="truncate max-w-[130px] font-bold">{active.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 p-1.5 animate-dropdown origin-top-left">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
              Select AI Persona
            </div>
            <div className="space-y-0.5">
              {(Object.keys(AI_PERSONAS) as AIPersonaId[]).map((id) => {
                const item = AI_PERSONAS[id];
                const Icon = PERSONA_ICONS[id];
                const isSelected = id === currentPersona;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onSelectPersona(id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer btn-press ${
                      isSelected
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${isSelected ? 'bg-rose-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{item.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{item.tagline}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
