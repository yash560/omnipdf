'use client';

import React from 'react';
import {
  FileEdit,
  Minimize2,
  Layers,
  Scissors,
  PenTool,
  FileText,
  ArrowUpDown,
  Crop,
  Lock,
  Unlock,
  Stamp,
  Hash,
  EyeOff,
  GitCompare,
  Wrench,
  Image,
  ImagePlus,
  Sparkles,
  RefreshCw,
  Maximize2 as MaximizeIcon,
  Palette,
  ShieldCheck,
  BarChart3,
  CheckSquare,
  Table,
  TableProperties,
  Receipt,
  Music,
  Bot,
  BookOpen,
  Binary,
  QrCode,
  Flame,
  MessageSquare,
  Presentation,
  FileCode2,
  FolderArchive,
  HardDrive,
  LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  FileEdit,
  Minimize2,
  Layers,
  Scissors,
  PenTool,
  FileText,
  ArrowUpDown,
  Crop,
  Lock,
  Unlock,
  Stamp,
  Hash,
  EyeOff,
  GitCompare,
  Wrench,
  Image,
  ImagePlus,
  Sparkles,
  RefreshCw,
  Maximize2: MaximizeIcon,
  Palette,
  ShieldCheck,
  BarChart3,
  CheckSquare,
  Table,
  TableProperties,
  Receipt,
  Music,
  Bot,
  BookOpen,
  Binary,
  QrCode,
  Flame,
  MessageSquare,
  Presentation,
  FileCode2,
  FolderArchive,
  HardDrive,
};

interface ToolIconProps {
  name: string;
  className?: string;
}

export function ToolIcon({ name, className = 'w-4 h-4' }: ToolIconProps) {
  const IconComponent = ICON_MAP[name] || Wrench;
  return <IconComponent className={className} />;
}
