'use client';

import { 
  MousePointer, 
  Hand, 
  Type, 
  Pen, 
  Highlighter, 
  Square, 
  Circle, 
  ArrowRight, 
  Minus, 
  Image as ImageIcon, 
  PenTool, 
  EyeOff, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { AnnotationType } from '@/types/pdf';

interface ToolbarProps {
  activeTool: AnnotationType | 'select' | 'hand' | 'eraser';
  onToolSelect: (tool: AnnotationType | 'select' | 'hand' | 'eraser') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenSignatureModal: () => void;
  onOpenAiModal?: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function Toolbar({
  activeTool,
  onToolSelect,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onOpenSignatureModal,
  onOpenAiModal,
  onExport,
  isExporting,
}: ToolbarProps) {
  const tools: { id: AnnotationType | 'select' | 'hand' | 'eraser'; label: string; icon: any; action?: () => void }[] = [
    { id: 'select', label: 'Select (V)', icon: MousePointer },
    { id: 'hand', label: 'Hand / Pan (H)', icon: Hand },
    { id: 'text', label: 'Add Text (T)', icon: Type },
    { id: 'draw', label: 'Draw Ink (P)', icon: Pen },
    { id: 'highlight', label: 'Highlighter', icon: Highlighter },
    { id: 'rectangle', label: 'Rectangle (R)', icon: Square },
    { id: 'circle', label: 'Circle (C)', icon: Circle },
    { id: 'arrow', label: 'Arrow (A)', icon: ArrowRight },
    { id: 'line', label: 'Line (L)', icon: Minus },
    { id: 'signature', label: 'e-Signature (S)', icon: PenTool, action: onOpenSignatureModal },
    { id: 'redact', label: 'Redact PII (X)', icon: EyeOff },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm z-30">
      {/* Left: Main Tool Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.action) t.action();
                else onToolSelect(t.id);
              }}
              title={t.label}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 scale-105'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden xl:inline text-[11px]">{t.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Center: Undo / Redo & Zoom Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-xl px-2 py-1 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 gap-1.5">
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={onZoomIn}
            title="Zoom In"
            className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: AI Studio & Export Button */}
      <div className="flex items-center gap-2">
        {onOpenAiModal && (
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            title="AI Page Assistant (Form Auto-Fill, Prompt-to-Edit & PII Redactor)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>AI Studio</span>
          </button>
        )}

        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Baking PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Export PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
