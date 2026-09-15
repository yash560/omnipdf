'use client';

import Link from 'next/link';
import { 
  Layers, 
  Scissors, 
  LayoutGrid, 
  RotateCw, 
  Crop, 
  Minimize2, 
  Wrench, 
  FileEdit, 
  Stamp, 
  Hash, 
  PenTool, 
  Lock, 
  Unlock, 
  EyeOff, 
  FileCheck, 
  Image as ImageIcon, 
  Images, 
  FileText, 
  ScanText, 
  Columns2,
  ArrowUpRight
} from 'lucide-react';
import { PDFTool } from '@/types/pdf';

interface ToolCardProps {
  tool: PDFTool;
}

const iconMap: Record<string, any> = {
  Layers,
  Scissors,
  LayoutGrid,
  RotateCw,
  Crop,
  Minimize2,
  Wrench,
  FileEdit,
  Stamp,
  Hash,
  PenTool,
  Lock,
  Unlock,
  EyeOff,
  FileCheck,
  Image: ImageIcon,
  Images,
  FileText,
  ScanText,
  Columns2,
};

export function ToolCard({ tool }: ToolCardProps) {
  const IconComponent = iconMap[tool.icon] || FileText;

  return (
    <Link
      href={`/${tool.slug}`}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Top ambient color glow on hover */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: tool.color }}
      />

      <div>
        {/* Header: Icon & Badges */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:rotate-2 transition-all duration-300"
            style={{ backgroundColor: tool.color }}
          >
            <IconComponent className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="flex items-center gap-1.5">
            {tool.badge && (
              <span
                className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-xs text-white"
                style={{ backgroundColor: tool.color }}
              >
                {tool.badge}
              </span>
            )}
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors mb-1.5 flex items-center gap-2">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>

      {/* Bottom Category Tag */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
        <span className="capitalize">{tool.category}</span>
        <span className="opacity-0 group-hover:opacity-100 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-opacity flex items-center gap-1 font-bold">
          Open Tool →
        </span>
      </div>
    </Link>
  );
}
