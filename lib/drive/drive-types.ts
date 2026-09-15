export type DriveItemType = 'file' | 'folder';

export type DriveCategory = 
  | 'pdf' 
  | 'image' 
  | 'spreadsheet' 
  | 'media' 
  | 'document' 
  | 'archive' 
  | 'code' 
  | 'other';

export type DriveFolderColor = 
  | 'default' 
  | 'red' 
  | 'orange' 
  | 'amber' 
  | 'emerald' 
  | 'cyan' 
  | 'blue' 
  | 'indigo' 
  | 'purple' 
  | 'rose';

export interface DriveFolderColorInfo {
  id: DriveFolderColor;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  hex: string;
}

export const FOLDER_COLORS: Record<DriveFolderColor, DriveFolderColorInfo> = {
  default: { id: 'default', label: 'Classic Zinc', bgClass: 'bg-zinc-500/10 dark:bg-zinc-500/20', textClass: 'text-zinc-600 dark:text-zinc-400', borderClass: 'border-zinc-300 dark:border-zinc-700', hex: '#71717a' },
  red: { id: 'red', label: 'Ruby Red', bgClass: 'bg-red-500/10 dark:bg-red-500/20', textClass: 'text-red-600 dark:text-red-400', borderClass: 'border-red-300 dark:border-red-800', hex: '#ef4444' },
  orange: { id: 'orange', label: 'Sunset Orange', bgClass: 'bg-orange-500/10 dark:bg-orange-500/20', textClass: 'text-orange-600 dark:text-orange-400', borderClass: 'border-orange-300 dark:border-orange-800', hex: '#f97316' },
  amber: { id: 'amber', label: 'Warm Amber', bgClass: 'bg-amber-500/10 dark:bg-amber-500/20', textClass: 'text-amber-600 dark:text-amber-400', borderClass: 'border-amber-300 dark:border-amber-800', hex: '#f59e0b' },
  emerald: { id: 'emerald', label: 'Emerald Green', bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20', textClass: 'text-emerald-600 dark:text-emerald-400', borderClass: 'border-emerald-300 dark:border-emerald-800', hex: '#10b981' },
  cyan: { id: 'cyan', label: 'Aqua Cyan', bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/20', textClass: 'text-cyan-600 dark:text-cyan-400', borderClass: 'border-cyan-300 dark:border-cyan-800', hex: '#06b6d4' },
  blue: { id: 'blue', label: 'Ocean Blue', bgClass: 'bg-blue-500/10 dark:bg-blue-500/20', textClass: 'text-blue-600 dark:text-blue-400', borderClass: 'border-blue-300 dark:border-blue-800', hex: '#3b82f6' },
  indigo: { id: 'indigo', label: 'Deep Indigo', bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/20', textClass: 'text-indigo-600 dark:text-indigo-400', borderClass: 'border-indigo-300 dark:border-indigo-800', hex: '#6366f1' },
  purple: { id: 'purple', label: 'Royal Purple', bgClass: 'bg-purple-500/10 dark:bg-purple-500/20', textClass: 'text-purple-600 dark:text-purple-400', borderClass: 'border-purple-300 dark:border-purple-800', hex: '#a855f7' },
  rose: { id: 'rose', label: 'Vibrant Rose', bgClass: 'bg-rose-500/10 dark:bg-rose-500/20', textClass: 'text-rose-600 dark:text-rose-400', borderClass: 'border-rose-300 dark:border-rose-800', hex: '#f43f5e' },
};

export interface DriveItem {
  id: string;
  name: string;
  parentId: string | null; // null = root ("My Drive")
  type: DriveItemType;
  mimeType: string;
  size: number;
  extension: string;
  category: DriveCategory;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
  isStarred: boolean;
  isTrash: boolean;
  trashedAt?: number;
  color?: DriveFolderColor;
  tags?: string[];
  description?: string;
  aiSummary?: string;
  thumbnailUrl?: string;
  itemCount?: number; // for folders (computed/cached)
}

export interface DriveBlobRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  size: number;
}

export type DriveViewSection = 
  | 'my-drive' 
  | 'starred' 
  | 'recent' 
  | 'trash' 
  | 'category';

export type DriveSortField = 'name' | 'updatedAt' | 'size' | 'category';
export type DriveSortOrder = 'asc' | 'desc';

export interface DriveSortOption {
  field: DriveSortField;
  order: DriveSortOrder;
}

export type DriveViewLayout = 'grid' | 'list';

export interface DriveStats {
  totalBytes: number;
  totalFiles: number;
  totalFolders: number;
  categoryBytes: Record<DriveCategory, number>;
  categoryCount: Record<DriveCategory, number>;
  starredCount: number;
  trashCount: number;
}

export interface DriveBreadcrumb {
  id: string | null;
  name: string;
}

export interface QuickToolAction {
  label: string;
  href: string;
  icon: string;
  description: string;
}
