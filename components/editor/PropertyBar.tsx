'use client';

import { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Trash2, 
  Copy, 
  Palette, 
  Type, 
  Eye, 
  Layers, 
  Square, 
  Sliders, 
  CaseUpper, 
  ChevronDown,
  Sparkles,
  Minus,
  Plus
} from 'lucide-react';
import { Annotation, TextAnnotation } from '@/types/pdf';

interface PropertyBarProps {
  selectedAnnotation: Annotation | null;
  onUpdateAnnotation: (updated: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onDuplicateAnnotation?: (ann: Annotation) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  currentStrokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  currentFontSize: number;
  onFontSizeChange: (size: number) => void;
  activeTool?: string;
}

const colorPresets = [
  '#000000', // Black
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#ffffff', // White
];

const bgHighlightPresets = [
  'transparent',
  '#fef08a', // Light Yellow Highlight
  '#bbf7d0', // Light Green
  '#bae6fd', // Light Sky
  '#fed7aa', // Light Orange
  '#fbcfe8', // Light Pink
  '#e9d5ff', // Light Purple
  '#18181b', // Dark Zinc
  '#ffffff', // Solid White
];

export function PropertyBar({
  selectedAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onDuplicateAnnotation,
  currentColor,
  onColorChange,
  currentStrokeWidth,
  onStrokeWidthChange,
  currentFontSize,
  onFontSizeChange,
  activeTool,
}: PropertyBarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false);

  const isText = selectedAnnotation?.type === 'text' || (!selectedAnnotation && activeTool === 'text');
  const textAnn = selectedAnnotation?.type === 'text' ? (selectedAnnotation as TextAnnotation) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs shadow-xs z-20">
      {/* Left Group: Font Family, Font Size & Typography */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Font Family Selector (For Text) */}
        {isText && (
          <div className="flex items-center">
            <select
              value={textAnn?.fontFamily || 'sans'}
              onChange={(e) => onUpdateAnnotation({ fontFamily: e.target.value } as any)}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer hover:border-zinc-400"
            >
              <option value="sans">Sans-Serif (Modern)</option>
              <option value="serif">Serif (Editorial / Classic)</option>
              <option value="mono">Monospace (Code / Data)</option>
              <option value="cursive">Cursive (Calligraphy)</option>
              <option value="display">Display (Bold Headline)</option>
            </select>
          </div>
        )}

        {/* Font Size or Stroke Width Stepper */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => {
              if (isText && textAnn) {
                const newSize = Math.max(8, (textAnn.fontSize || currentFontSize) - 2);
                onFontSizeChange(newSize);
                onUpdateAnnotation({ fontSize: newSize } as any);
              } else {
                const newWidth = Math.max(1, currentStrokeWidth - 1);
                onStrokeWidthChange(newWidth);
                if (selectedAnnotation) onUpdateAnnotation({ strokeWidth: newWidth } as any);
              }
            }}
            title="Decrease Size"
            className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            type="number"
            min={isText ? 8 : 1}
            max={isText ? 144 : 48}
            value={isText && textAnn ? textAnn.fontSize || currentFontSize : currentStrokeWidth}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 12;
              if (isText) {
                onFontSizeChange(val);
                onUpdateAnnotation({ fontSize: val } as any);
              } else {
                onStrokeWidthChange(val);
                if (selectedAnnotation) onUpdateAnnotation({ strokeWidth: val } as any);
              }
            }}
            className="w-10 text-center font-bold text-xs bg-transparent outline-none text-zinc-900 dark:text-zinc-100"
          />

          <button
            onClick={() => {
              if (isText && textAnn) {
                const newSize = Math.min(144, (textAnn.fontSize || currentFontSize) + 2);
                onFontSizeChange(newSize);
                onUpdateAnnotation({ fontSize: newSize } as any);
              } else {
                const newWidth = Math.min(48, currentStrokeWidth + 1);
                onStrokeWidthChange(newWidth);
                if (selectedAnnotation) onUpdateAnnotation({ strokeWidth: newWidth } as any);
              }
            }}
            title="Increase Size"
            className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Styling Toggles (Bold, Italic, Underline, Strikethrough, Case) */}
        {isText && (
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
            {/* Bold */}
            <button
              onClick={() => onUpdateAnnotation({ bold: !textAnn?.bold } as any)}
              title="Bold"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                textAnn?.bold
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              onClick={() => onUpdateAnnotation({ italic: !textAnn?.italic } as any)}
              title="Italic"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                textAnn?.italic
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700'
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              onClick={() => onUpdateAnnotation({ underline: !textAnn?.underline } as any)}
              title="Underline"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                textAnn?.underline
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700'
              }`}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Strikethrough */}
            <button
              onClick={() => onUpdateAnnotation({ strikethrough: !textAnn?.strikethrough } as any)}
              title="Strikethrough"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                textAnn?.strikethrough
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700'
              }`}
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            {/* Text Transform Case */}
            <button
              onClick={() => {
                const current = textAnn?.textTransform || 'none';
                const next =
                  current === 'none'
                    ? 'uppercase'
                    : current === 'uppercase'
                    ? 'lowercase'
                    : current === 'lowercase'
                    ? 'capitalize'
                    : 'none';
                onUpdateAnnotation({ textTransform: next } as any);
              }}
              title={`Case: ${textAnn?.textTransform || 'none'}`}
              className={`px-1.5 py-1 rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer ${
                textAnn?.textTransform && textAnn.textTransform !== 'none'
                  ? 'bg-rose-500 text-white'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700'
              }`}
            >
              {textAnn?.textTransform === 'uppercase' ? 'AA' : textAnn?.textTransform === 'lowercase' ? 'aa' : textAnn?.textTransform === 'capitalize' ? 'Aa' : 'aA'}
            </button>
          </div>
        )}

        {/* Text Alignment */}
        {isText && (
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => onUpdateAnnotation({ textAlign: 'left' } as any)}
              title="Align Left"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                textAnn?.textAlign === 'left' || !textAnn?.textAlign
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateAnnotation({ textAlign: 'center' } as any)}
              title="Align Center"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                textAnn?.textAlign === 'center'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateAnnotation({ textAlign: 'right' } as any)}
              title="Align Right"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                textAnn?.textAlign === 'right'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Center Group: Text Color, Background Fill & Borders */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Text / Foreground Color Picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-zinc-400">Color:</span>
          <div className="flex items-center gap-1">
            {colorPresets.slice(0, 6).map((c) => (
              <button
                key={c}
                onClick={() => {
                  onColorChange(c);
                  if (selectedAnnotation) {
                    if (isText) onUpdateAnnotation({ color: c });
                    else if ('strokeColor' in selectedAnnotation) onUpdateAnnotation({ strokeColor: c } as any);
                    else if ('color' in selectedAnnotation) onUpdateAnnotation({ color: c } as any);
                  }
                }}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 shadow-xs transition-transform cursor-pointer ${
                  (isText ? textAnn?.color : currentColor) === c ? 'scale-125 ring-2 ring-rose-500' : 'hover:scale-110'
                }`}
              />
            ))}

            {/* Custom Hex Color input */}
            <input
              type="color"
              value={isText && textAnn ? textAnn.color : currentColor}
              onChange={(e) => {
                const c = e.target.value;
                onColorChange(c);
                if (selectedAnnotation) {
                  if (isText) onUpdateAnnotation({ color: c });
                  else if ('strokeColor' in selectedAnnotation) onUpdateAnnotation({ strokeColor: c } as any);
                  else if ('color' in selectedAnnotation) onUpdateAnnotation({ color: c } as any);
                }
              }}
              title="Custom Color"
              className="w-5 h-5 rounded-full border-none cursor-pointer bg-transparent overflow-hidden"
            />
          </div>
        </div>

        {/* Background / Highlight Box Color (For Text) */}
        {isText && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400">Fill:</span>
            <div className="flex items-center gap-1">
              {bgHighlightPresets.slice(0, 5).map((bg) => (
                <button
                  key={bg}
                  onClick={() => onUpdateAnnotation({ backgroundColor: bg } as any)}
                  style={{ backgroundColor: bg === 'transparent' ? '#ffffff' : bg }}
                  title={bg === 'transparent' ? 'Transparent (No Fill)' : bg}
                  className={`w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 shadow-xs transition-transform cursor-pointer relative ${
                    (textAnn?.backgroundColor || 'transparent') === bg ? 'scale-125 ring-2 ring-rose-500' : 'hover:scale-110'
                  }`}
                >
                  {bg === 'transparent' && (
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-500">
                      /
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Border Formatting Options (For Text) */}
        {isText && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400">Border:</span>
            <select
              value={textAnn?.borderStyle || 'none'}
              onChange={(e) => {
                const style = e.target.value as any;
                onUpdateAnnotation({
                  borderStyle: style,
                  borderWidth: style === 'none' ? 0 : textAnn?.borderWidth || 1,
                  borderColor: textAnn?.borderColor || '#e4e4e7',
                } as any);
              }}
              className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
            >
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>

            {textAnn?.borderStyle && textAnn.borderStyle !== 'none' && (
              <select
                value={textAnn?.borderRadius || 0}
                onChange={(e) => onUpdateAnnotation({ borderRadius: parseInt(e.target.value, 10) } as any)}
                className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
              >
                <option value={0}>Sharp (0px)</option>
                <option value={4}>Rounded (4px)</option>
                <option value={8}>Card (8px)</option>
                <option value={9999}>Pill</option>
              </select>
            )}
          </div>
        )}

        {/* Opacity Slider */}
        {selectedAnnotation && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400">Opacity:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={selectedAnnotation.opacity ?? 1.0}
              onChange={(e) => onUpdateAnnotation({ opacity: parseFloat(e.target.value) })}
              className="w-16 accent-rose-500 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-zinc-500 w-7">
              {Math.round((selectedAnnotation.opacity ?? 1.0) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Right Group: Duplicate & Delete */}
      {selectedAnnotation && (
        <div className="flex items-center gap-1.5">
          {onDuplicateAnnotation && (
            <button
              onClick={() => onDuplicateAnnotation(selectedAnnotation)}
              title="Duplicate (Ctrl+D)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors font-bold text-[11px] cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
          )}

          <button
            onClick={() => onDeleteAnnotation(selectedAnnotation.id)}
            title="Delete Annotation"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors font-bold text-[11px] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
