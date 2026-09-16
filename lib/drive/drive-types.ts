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

export type CollaboratorRole = 'viewer' | 'commenter' | 'editor' | 'admin';

export interface Collaborator {
  userId: string;
  email: string;
  name: string;
  role: CollaboratorRole;
  addedAt: number;
}

export interface ShareConfig {
  isPublic: boolean;
  publicId: string;
  hasPassword?: boolean;
  passwordHash?: string;
  expiresAt?: number | null;
  allowDownload: boolean;
  viewCount: number;
  downloadCount: number;
  maxDownloads?: number | null;
}

export type ExpiryStatus = 'valid' | 'expiring_soon' | 'expired' | 'none';
export type ExpiryType = 'insurance' | 'puc' | 'tax' | 'passport' | 'licence' | 'agreement' | 'other';

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
  aiCategory?: string;
  semanticKeywords?: string[];
  relativePath?: string;
  isAutoLabeled?: boolean;
  searchScore?: number;
  matchedTerms?: string[];
  thumbnailUrl?: string;
  itemCount?: number; // for folders (computed/cached)

  // Security Vault
  isVault?: boolean;

  // OCR full text
  ocrText?: string;
  ocrSnippet?: string;

  // Expiry & Renewal
  expiryDate?: number | null; // epoch timestamp
  expiryStatus?: ExpiryStatus;
  expiryDaysLeft?: number;
  expiryType?: ExpiryType;
  expiryDetails?: string;

  // Multi-account & collaboration
  userId?: string;
  ownerEmail?: string;
  ownerName?: string;
  sharedWith?: Collaborator[];
  shareConfig?: ShareConfig;
  isSharedWithMe?: boolean;
  myRole?: CollaboratorRole;
}

export interface SearchFilterOptions {
  query: string;
  category?: DriveCategory;
  aiCategory?: string;
  tag?: string;
  person?: string;
  vehicle?: string;
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  section?: DriveViewSection;
  parentId?: string | null;
  sort?: 'relevance' | 'date' | 'name' | 'size' | 'expiry';
  includeVault?: boolean;
  isVaultUnlocked?: boolean;
  typeFilter?: string;
  limit?: number;
}

export interface SearchResult {
  items: DriveItem[];
  totalMatches: number;
  availableTags: { tag: string; count: number }[];
  availableAiCategories: { category: string; count: number }[];
}

export interface DriveComment {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
  resolved?: boolean;
}

export type DriveActivityAction = 
  | 'uploaded'
  | 'created_folder'
  | 'renamed'
  | 'moved'
  | 'starred'
  | 'unstarred'
  | 'shared'
  | 'unshared'
  | 'downloaded'
  | 'trashed'
  | 'restored'
  | 'commented'
  | 'vault_locked'
  | 'vault_unlocked'
  | 'ocr_indexed'
  | 'edited';

export interface DriveActivity {
  id: string;
  itemId: string;
  itemName: string;
  itemType: DriveItemType;
  userId: string;
  userName: string;
  userEmail: string;
  action: DriveActivityAction;
  details?: string;
  timestamp: number;
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
  | 'shared'
  | 'vault'
  | 'expiry'
  | 'duplicates'
  | 'category';

export type DriveSortField = 'name' | 'updatedAt' | 'size' | 'category' | 'expiry';
export type DriveSortOrder = 'asc' | 'desc';

export interface DriveSortOption {
  field: DriveSortField;
  order: DriveSortOrder;
}

export type DriveViewLayout = 'grid' | 'list' | 'columns';

export type DriveLiveEventType =
  | 'item_created'
  | 'item_updated'
  | 'item_deleted'
  | 'folder_created'
  | 'batch_action'
  | 'sync';

export interface DriveLiveEvent {
  type: DriveLiveEventType;
  userId: string;
  itemId?: string;
  parentId?: string | null;
  timestamp: number;
  data?: any;
}

export interface DriveStats {
  totalBytes: number;
  totalFiles: number;
  totalFolders: number;
  categoryBytes: Record<DriveCategory, number>;
  categoryCount: Record<DriveCategory, number>;
  starredCount: number;
  trashCount: number;
  vaultCount?: number;
  expiringCount?: number;
  expiredCount?: number;
  sharedWithMeCount?: number;
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

export interface ChunkUploadProgress {
  uploadId: string;
  fileName: string;
  fileSize: number;
  relativePath?: string;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  speedBytesPerSec: number;
  status: 'queued' | 'uploading' | 'assembling' | 'completed' | 'paused' | 'error';
  error?: string;
}

export interface DuplicateCluster {
  id: string;
  hash: string;
  name: string;
  size: number;
  items: DriveItem[];
  suggestedKeepId: string;
}

export interface VaultStatus {
  hasPin: boolean;
  isUnlocked: boolean;
  vaultItemsCount: number;
  unlockedUntil: number | null;
}

export type DriveRecommendationStream = 
  | 'for_you' 
  | 'suggested_action' 
  | 'dossier' 
  | 'related';

export type DriveRecommendationRationale = 
  | 'frequent_work_hours' 
  | 'recently_active' 
  | 'expiring_soon' 
  | 'co_occurring' 
  | 'semantic_match' 
  | 'starred' 
  | 'cleanup_candidate' 
  | 'missing_dossier_item' 
  | 'predicted_workflow';

export interface DriveRecommendation {
  id: string;
  itemId: string;
  item: DriveItem;
  score: number;
  stream: DriveRecommendationStream;
  rationale: string;
  rationaleType: DriveRecommendationRationale;
  confidence: number; // 0.0 to 1.0
  actionType?: 'preview' | 'renew' | 'dedup' | 'merge' | 'compress' | 'open_folder' | 'export_zip' | 'chat_folder';
  actionPayload?: Record<string, any>;
  badgeText?: string;
  similarityScore?: number; // percentage match for related items (e.g. 94)
  sharedKeywords?: string[];
}

export interface SmartDossier {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string; // lucide icon identifier
  accentColor: string; // hex or tailwind class
  category: string;
  itemIds: string[];
  items: DriveItem[];
  totalBytes: number;
  completenessScore: number; // 0 to 100
  status: 'complete' | 'attention_needed' | 'in_progress';
  tags: string[];
  keyHighlights: string[];
  suggestedActions: { label: string; action: string; icon: string }[];
}

export interface RecommendationContext {
  activeFolderId?: string | null;
  selectedItemId?: string | null;
  currentHour?: number; // 0-23
  dayOfWeek?: number; // 0=Sun, 1=Mon, ..., 6=Sat
  isVaultUnlocked?: boolean;
  recentActionHistory?: string[];
  dismissedIds?: string[];
  viewMode?: string;
}

export interface RecommendationResponse {
  success: boolean;
  forYou: DriveRecommendation[];
  suggestedActions: DriveRecommendation[];
  dossiers: SmartDossier[];
  related?: DriveRecommendation[];
  stats: {
    generatedAt: number;
    totalItemsEvaluated: number;
    topCategory: string;
    contextMode: string;
    executionTimeMs: number;
  };
}
