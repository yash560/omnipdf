'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  DriveItem,
  DriveViewSection,
  DriveViewLayout,
  DriveSortOption,
  DriveStats,
  DriveBreadcrumb,
  DriveCategory,
  DriveFolderColor,
} from './drive-types';
import {
  fetchCloudItems,
  uploadCloudFiles,
  createCloudFolderApi,
  updateCloudItemApi,
  moveCloudItemsApi,
  trashCloudItemsApi,
  restoreCloudItemsApi,
  deleteCloudItemsPermanentlyApi,
  emptyCloudTrashApi,
  fetchCloudStats,
  exportCloudItemAsZip,
  getCloudFileBlob,
  getCloudFileUrl,
  searchCloudItemsApi,
  batchAutoLabelApi,
  replaceCloudItemContentApi,
} from './cloud-api';
import { useAuth } from '@/lib/auth/auth-context';
import saveAs from 'file-saver';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { chunkedUploader } from './chunked-uploader';

interface DriveContextType {
  // Navigation & View
  currentFolderId: string | null;
  breadcrumbs: DriveBreadcrumb[];
  viewSection: DriveViewSection;
  selectedCategory: DriveCategory | null;
  viewLayout: DriveViewLayout;
  setViewLayout: (layout: DriveViewLayout) => void;
  sortOption: DriveSortOption;
  setSortOption: (option: DriveSortOption) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  selectedAiCategory: string | null;
  setSelectedAiCategory: (cat: string | null) => void;
  activePerson?: string;
  setActivePerson: (person?: string) => void;
  activeVehicle?: string;
  setActiveVehicle: (vehicle?: string) => void;
  availableTags: { tag: string; count: number }[];
  availableAiCategories: { category: string; count: number }[];

  // Data & State
  items: DriveItem[];
  folders: DriveItem[];
  files: DriveItem[];
  loading: boolean;
  isSyncing: boolean;
  stats: DriveStats | null;
  selectedIds: string[];
  previewItem: DriveItem | null;
  detailsItem: DriveItem | null;
  shareModalItem: DriveItem | null;
  isUploading: boolean;
  uploadProgress: number;
  authRequired: boolean;

  // Vault Security
  isVaultUnlocked: boolean;
  unlockVault: (untilMs?: number) => void;
  lockVault: () => void;
  isVaultModalOpen: boolean;
  setIsVaultModalOpen: (open: boolean) => void;
  vaultModalMode: 'unlock' | 'configure';
  setVaultModalMode: (mode: 'unlock' | 'configure') => void;
  openVaultModal: (mode?: 'unlock' | 'configure') => void;

  // Feature Modals
  isFolderChatOpen: boolean;
  setIsFolderChatOpen: (open: boolean) => void;
  isExpiryRadarOpen: boolean;
  setIsExpiryRadarOpen: (open: boolean) => void;
  isDedupModalOpen: boolean;
  setIsDedupModalOpen: (open: boolean) => void;
  isKeyboardShortcutsOpen: boolean;
  setIsKeyboardShortcutsOpen: (open: boolean) => void;

  // In-Place Quick Tools (Crop, Edit, Transform & Convert)
  quickToolsItem: DriveItem | null;
  quickToolsInitialTab?: string;
  openQuickTools: (item: DriveItem, initialTab?: string) => void;
  closeQuickTools: () => void;
  replaceItemContent: (itemId: string, blob: Blob, fileName?: string, mimeType?: string) => Promise<DriveItem>;
  saveAsNewFile: (name: string, blob: Blob, mimeType?: string, parentId?: string | null) => Promise<DriveItem>;

  // Actions & Selection
  navigateToFolder: (folderId: string | null, pushUrl?: boolean) => void;
  selectSection: (section: DriveViewSection, category?: DriveCategory) => void;
  toggleSelect: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectByType: (type: 'all' | 'files' | 'folders' | 'starred' | 'radar' | 'pdf' | 'image' | 'spreadsheet' | 'media' | 'vault') => void;
  invertSelection: () => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  selectedPdfCount: number;
  mergeSelectedPdfs: (customFileName?: string) => Promise<boolean>;
  copySelectedInfoToClipboard: () => Promise<boolean>;
  triggerAutoLabel: (itemIds?: string[]) => Promise<void>;
  triggerBatchAction: (action: 'tag' | 'remove_tag' | 'move' | 'star' | 'unstar' | 'trash' | 'restore' | 'vault' | 'unvault' | 'category' | 'expiry' | 'delete_permanent', payload?: any) => Promise<void>;
  bulkDownloadZip: (customItems?: DriveItem[]) => Promise<void>;
  
  // Cloud CRUD Operations
  createFolder: (name: string, color?: DriveFolderColor) => Promise<DriveItem>;
  uploadFiles: (fileList: File[] | FileList) => Promise<void>;
  uploadDirectory: (items: { path: string; file: File }[]) => Promise<void>;
  renameItem: (id: string, newName: string) => Promise<void>;
  moveItems: (targetFolderId: string | null) => Promise<void>;
  duplicateItem: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  changeFolderColor: (id: string, color: DriveFolderColor) => Promise<void>;
  trashSelected: () => Promise<void>;
  restoreSelected: () => Promise<void>;
  deleteSelectedPermanently: () => Promise<void>;
  emptyTrash: () => Promise<void>;
  downloadItem: (item: DriveItem) => Promise<void>;
  openPreview: (item: DriveItem) => void;
  closePreview: () => void;
  openShareModal: (item: DriveItem) => void;
  closeShareModal: () => void;
  setDetailsItem: (item: DriveItem | null) => void;
  loadItems: (options?: { silent?: boolean }) => Promise<void>;
  refreshDrive: (options?: { silent?: boolean }) => Promise<void>;

  // Real-Time Caching & Cascading Traversal
  folderCache: Record<string, DriveItem[]>;
  prefetchFolder: (folderId: string | null) => Promise<DriveItem[]>;
  fetchFolderChildren: (folderId: string | null) => Promise<DriveItem[]>;
}

const DriveContext = createContext<DriveContextType | null>(null);

export const useDrive = () => {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error('useDrive must be used within a DriveProvider');
  }
  return context;
};

export const DriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Set right before any programmatic setSearchTerm('') that's part of a
  // navigation (folder change, section switch) so the q= URL-sync effect
  // below doesn't fire a stale/racing router.replace against a URL that
  // navigateToFolder/selectSection is already pushing in the same tick.
  const skipNextSearchUrlSync = useRef(false);
  const loadItemsRequestIdRef = useRef(0);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveBreadcrumb[]>([{ id: null, name: 'Cloud Drive' }]);
  const [viewSection, setViewSection] = useState<DriveViewSection>('my-drive');
  const [selectedCategory, setSelectedCategory] = useState<DriveCategory | null>(null);
  const [viewLayout, setViewLayout] = useState<DriveViewLayout>('grid');
  const [sortOption, setSortOption] = useState<DriveSortOption>({ field: 'updatedAt', order: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAiCategory, setSelectedAiCategory] = useState<string | null>(null);
  const [activePerson, setActivePerson] = useState<string | undefined>(undefined);
  const [activeVehicle, setActiveVehicle] = useState<string | undefined>(undefined);
  const [availableTags, setAvailableTags] = useState<{ tag: string; count: number }[]>([]);
  const [availableAiCategories, setAvailableAiCategories] = useState<{ category: string; count: number }[]>([]);

  // Instant clear, 280ms debounce for typing
  useEffect(() => {
    if (!searchTerm) {
      setDebouncedSearchTerm('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reflect the active search term in the URL (?q=) so it survives refresh
  // and is shareable — but skip when a navigation (folder change/section
  // switch) just cleared search itself, since that already pushes its own
  // clean URL and this effect racing it with a stale pathname would revert it.
  useEffect(() => {
    if (skipNextSearchUrlSync.current) {
      skipNextSearchUrlSync.current = false;
      return;
    }
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (debouncedSearchTerm) {
      params.set('q', debouncedSearchTerm);
    } else {
      params.delete('q');
    }
    const qs = params.toString();
    router.replace(pathname + (qs ? `?${qs}` : ''), { scroll: false });
  }, [debouncedSearchTerm, pathname, router]);

  const [items, setItems] = useState<DriveItem[]>([]);
  const [folderCache, setFolderCache] = useState<Record<string, DriveItem[]>>({});
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<DriveItem | null>(null);
  const [shareModalItem, setShareModalItem] = useState<DriveItem | null>(null);

  // Vault Security
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultModalMode, setVaultModalMode] = useState<'unlock' | 'configure'>('unlock');

  const openVaultModal = (mode: 'unlock' | 'configure' = 'unlock') => {
    setVaultModalMode(mode);
    setIsVaultModalOpen(true);
  };

  // Feature Modals
  const [isFolderChatOpen, setIsFolderChatOpen] = useState(false);
  const [isExpiryRadarOpen, setIsExpiryRadarOpen] = useState(false);
  const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [quickToolsItem, setQuickToolsItem] = useState<DriveItem | null>(null);
  const [quickToolsInitialTab, setQuickToolsInitialTab] = useState<string | undefined>(undefined);

  const openQuickTools = (item: DriveItem, initialTab?: string) => {
    setQuickToolsItem(item);
    setQuickToolsInitialTab(initialTab);
  };

  const closeQuickTools = () => {
    setQuickToolsItem(null);
    setQuickToolsInitialTab(undefined);
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const authRequired = !isLoading && !isAuthenticated;

  // Check vault unlock status from session storage
  useEffect(() => {
    const unlockUntil = sessionStorage.getItem('filecraft_vault_unlocked_until');
    if (unlockUntil && parseInt(unlockUntil, 10) > Date.now()) {
      setIsVaultUnlocked(true);
    }
  }, []);

  const unlockVault = (untilMs?: number) => {
    const expiry = untilMs || Date.now() + 15 * 60 * 1000;
    sessionStorage.setItem('filecraft_vault_unlocked_until', expiry.toString());
    setIsVaultUnlocked(true);
  };

  const lockVault = () => {
    sessionStorage.removeItem('filecraft_vault_unlocked_until');
    setIsVaultUnlocked(false);
    if (viewSection === 'vault') {
      setViewSection('my-drive');
    }
  };

  const itemsRef = useRef<DriveItem[]>([]);
  itemsRef.current = items;

  const hasLoadedInitialRef = useRef(false);

  // Load stats with cache/throttle
  const lastStatsFetchRef = useRef<number>(0);
  const loadStats = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastStatsFetchRef.current < 5000) {
      return; // Throttle to at most once per 5 seconds
    }
    lastStatsFetchRef.current = now;
    try {
      const cloudStats = await fetchCloudStats();
      setStats(cloudStats);
    } catch (err) {
      console.warn('Failed to fetch storage stats:', err);
    }
  }, []);

  const loadItems = useCallback(async (options?: { silent?: boolean }) => {
    if (authRequired) {
      setLoading(false);
      setIsSyncing(false);
      return;
    }

    // Guard against out-of-order responses: if currentFolderId/section/etc.
    // change again (e.g. rapid back/forward, quick folder-to-folder clicks)
    // before this request resolves, an older in-flight fetch could otherwise
    // resolve after the newer one and silently overwrite it with stale data.
    const requestId = ++loadItemsRequestIdRef.current;

    const isSilent = options?.silent ?? (hasLoadedInitialRef.current && itemsRef.current.length > 0);
    if (!isSilent) {
      setLoading(true);
    } else {
      setIsSyncing(true);
    }

    try {
      const isSearchActive = Boolean(debouncedSearchTerm || selectedTag || selectedAiCategory || activePerson || activeVehicle);

      if (isSearchActive) {
        const searchResult = await searchCloudItemsApi({
          query: debouncedSearchTerm,
          tag: selectedTag || undefined,
          aiCategory: selectedAiCategory || undefined,
          person: activePerson,
          vehicle: activeVehicle,
          category: selectedCategory || undefined,
          section: viewSection,
          parentId: isSearchActive ? undefined : currentFolderId,
          sort: sortOption.field === 'updatedAt' ? 'date' : (sortOption.field as any),
          isVaultUnlocked,
        });

        if (requestId !== loadItemsRequestIdRef.current) return;
        setItems(searchResult.items || []);
        setAvailableTags(searchResult.availableTags || []);
        setAvailableAiCategories(searchResult.availableAiCategories || []);
      } else {
        const cloudData = await fetchCloudItems({
          parentId: (viewSection === 'my-drive') ? currentFolderId : undefined,
          section: viewSection,
          category: selectedCategory || undefined,
          isVaultUnlocked,
        });
        if (requestId !== loadItemsRequestIdRef.current) return;
        setItems(cloudData.items);
        if (cloudData.breadcrumbs && cloudData.breadcrumbs.length > 0) {
          setBreadcrumbs(cloudData.breadcrumbs);
        }
        if (viewSection === 'my-drive') {
          setFolderCache((prev) => ({
            ...prev,
            [currentFolderId || 'root']: cloudData.items,
          }));
        }
        loadStats();
      }

      hasLoadedInitialRef.current = true;
      setHasLoadedInitial(true);
    } catch (error) {
      console.error('Failed to load drive items from cloud:', error);
    } finally {
      if (requestId === loadItemsRequestIdRef.current) {
        setLoading(false);
        setIsSyncing(false);
      }
    }
  }, [
    authRequired,
    currentFolderId,
    viewSection,
    selectedCategory,
    debouncedSearchTerm,
    selectedTag,
    selectedAiCategory,
    activePerson,
    activeVehicle,
    sortOption,
    isVaultUnlocked,
    loadStats,
  ]);

  // Stable ref for SSE callbacks
  const loadItemsRef = useRef(loadItems);
  useEffect(() => {
    loadItemsRef.current = loadItems;
  }, [loadItems]);

  // Fetch children for a given folder with 0ms in-memory caching
  const fetchFolderChildren = useCallback(
    async (folderId: string | null): Promise<DriveItem[]> => {
      const key = folderId || 'root';
      if (folderCache[key]) {
        return folderCache[key];
      }
      try {
        const data = await fetchCloudItems({
          parentId: folderId,
          section: 'my-drive',
          isVaultUnlocked,
        });
        setFolderCache((prev) => ({
          ...prev,
          [key]: data.items,
        }));
        return data.items;
      } catch (err) {
        console.error(`Failed to fetch children for folder ${folderId}:`, err);
        return [];
      }
    },
    [folderCache, isVaultUnlocked]
  );

  // Pre-fetch folder contents on hover for instantaneous 0ms transitions
  const prefetchFolder = useCallback(
    async (folderId: string | null): Promise<DriveItem[]> => {
      return fetchFolderChildren(folderId);
    },
    [fetchFolderChildren]
  );

  // SSE Real-Time Event Listener for Instant Multi-Device Sync
  useEffect(() => {
    if (authRequired || typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let sseTimeout: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource('/api/drive/live-events');

      eventSource.onmessage = (e) => {
        try {
          if (!e.data) return;
          const parsed = JSON.parse(e.data);
          // Ignore connection handshake ping
          if (parsed.type === 'connected') return;

          // Debounce real mutation events
          if (sseTimeout) clearTimeout(sseTimeout);
          sseTimeout = setTimeout(() => {
            setFolderCache({});
            loadItemsRef.current({ silent: true });
          }, 300);
        } catch {}
      };

      eventSource.onerror = () => {
        // SSE will automatically retry in background
      };
    } catch (err) {
      console.warn('Failed to initialize SSE live events:', err);
    }

    return () => {
      if (sseTimeout) clearTimeout(sseTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [authRequired]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Derived state
  const folders = items.filter((item) => item.type === 'folder');
  const files = items.filter((item) => item.type === 'file');

  // Navigation handlers
  const navigateToFolder = async (folderId: string | null, pushUrl: boolean = true) => {
    setCurrentFolderId(folderId);
    setSelectedIds([]);
    // Only arm the skip if a search was actually active — otherwise
    // setSearchTerm('') is a no-op, the debounce effect never re-fires, and
    // the flag would sit armed and wrongly swallow the *next* real search sync.
    if (searchTerm || debouncedSearchTerm) {
      skipNextSearchUrlSync.current = true;
    }
    setSearchTerm('');
    setSelectedTag(null);
    setSelectedAiCategory(null);

    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'Cloud Drive' }]);
    } else {
      const folderItem = items.find((i) => i.id === folderId);
      if (folderItem) {
        setBreadcrumbs((prev) => {
          const idx = prev.findIndex((b) => b.id === folderId);
          if (idx !== -1) {
            return prev.slice(0, idx + 1);
          }
          return [...prev, { id: folderItem.id, name: folderItem.name }];
        });
      }
    }

    // Reflect the folder in the URL so refresh/back-forward/share-links work.
    // pushUrl=false is used when this call is itself reacting to a URL change
    // (route param sync, browser back/forward) to avoid double-pushing history.
    if (pushUrl) {
      router.push(folderId ? `/drive/folder/${folderId}` : '/drive');
    }
  };

  const selectSection = (section: DriveViewSection, category?: DriveCategory) => {
    if (section === 'vault' && !isVaultUnlocked) {
      setIsVaultModalOpen(true);
      return;
    }
    setViewSection(section);
    setSelectedCategory(category || null);
    setCurrentFolderId(null);
    // Sections aren't URL-routed yet, but leaving a folder must still drop
    // its /drive/folder/<id> URL — otherwise the address bar keeps showing a
    // folder path while the UI has switched to Starred/Trash/Shared/etc.
    router.replace('/drive');
    setBreadcrumbs([{ id: null, name: section === 'shared' ? 'Shared with Me' : section === 'vault' ? 'Secure Vault' : 'Cloud Drive' }]);
    setSelectedIds([]);
    if (searchTerm || debouncedSearchTerm) {
      skipNextSearchUrlSync.current = true;
    }
    setSearchTerm('');
    setSelectedTag(null);
    setSelectedAiCategory(null);
  };

  const toggleSelect = (id: string, multi: boolean = false) => {
    setSelectedIds((prev) => {
      if (multi) {
        return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      }
      return prev.includes(id) && prev.length === 1 ? [] : [id];
    });
  };

  const selectAll = () => {
    setSelectedIds(items.map((i) => i.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const selectByType = (type: 'all' | 'files' | 'folders' | 'starred' | 'radar' | 'pdf' | 'image' | 'spreadsheet' | 'media' | 'vault') => {
    let matching: DriveItem[] = [];
    switch (type) {
      case 'all':
        matching = items;
        break;
      case 'files':
        matching = items.filter((i) => i.type === 'file');
        break;
      case 'folders':
        matching = items.filter((i) => i.type === 'folder');
        break;
      case 'starred':
        matching = items.filter((i) => i.isStarred);
        break;
      case 'radar':
        matching = items.filter((i) => i.expiryStatus === 'expired' || i.expiryStatus === 'expiring_soon');
        break;
      case 'pdf':
        matching = items.filter((i) => i.category === 'pdf' || i.name.toLowerCase().endsWith('.pdf'));
        break;
      case 'image':
        matching = items.filter((i) => i.category === 'image');
        break;
      case 'spreadsheet':
        matching = items.filter((i) => i.category === 'spreadsheet');
        break;
      case 'media':
        matching = items.filter((i) => i.category === 'media');
        break;
      case 'vault':
        matching = items.filter((i) => i.isVault);
        break;
      default:
        matching = items;
    }
    setSelectedIds(matching.map((i) => i.id));
  };

  const invertSelection = () => {
    setSelectedIds((prev) => items.filter((i) => !prev.includes(i.id)).map((i) => i.id));
  };

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < items.length;
  const selectedPdfCount = items.filter(
    (i) => selectedIds.includes(i.id) && i.type === 'file' && (i.category === 'pdf' || i.name.toLowerCase().endsWith('.pdf'))
  ).length;

  const mergeSelectedPdfs = async (customFileName?: string): Promise<boolean> => {
    const selectedPdfItems = items.filter(
      (i) => selectedIds.includes(i.id) && i.type === 'file' && (i.category === 'pdf' || i.name.toLowerCase().endsWith('.pdf'))
    );
    if (selectedPdfItems.length < 2) return false;

    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of selectedPdfItems) {
        const blob = await getCloudFileBlob(item.id);
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
      }
      const mergedPdfBytes = await mergedPdf.save();
      const outputName = customFileName || `Merged_${selectedPdfItems.length}_Documents_${Date.now()}.pdf`;
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      saveAs(blob, outputName);
      return true;
    } catch (err) {
      console.error('Failed to merge PDFs:', err);
      return false;
    }
  };

  const copySelectedInfoToClipboard = async (): Promise<boolean> => {
    const selectedItems = items.filter((i) => selectedIds.includes(i.id));
    if (selectedItems.length === 0) return false;

    const text = selectedItems
      .map((i, idx) => `${idx + 1}. ${i.name} (${i.type === 'folder' ? 'Folder' : `${(i.size / 1024).toFixed(1)} KB`}) [ID: ${i.id}]`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  // Batch multi-select actions (Optimistic)
  const triggerBatchAction = async (
    action: 'tag' | 'remove_tag' | 'move' | 'star' | 'unstar' | 'trash' | 'restore' | 'vault' | 'unvault' | 'category' | 'expiry' | 'delete_permanent',
    payload?: any
  ) => {
    if (selectedIds.length === 0) return;
    const targetIds = [...selectedIds];
    clearSelection();

    // Optimistic UI updates
    if (action === 'trash' && viewSection !== 'trash') {
      setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
    } else if (action === 'delete_permanent') {
      setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
    } else if (action === 'restore' && viewSection === 'trash') {
      setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
    } else if (action === 'move') {
      setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
    } else if (action === 'star' || action === 'unstar') {
      const isStarred = action === 'star';
      if (viewSection === 'starred' && !isStarred) {
        setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
      } else {
        setItems((prev) =>
          prev.map((i) => (targetIds.includes(i.id) ? { ...i, isStarred, updatedAt: Date.now() } : i))
        );
      }
    } else if (action === 'vault') {
      setItems((prev) =>
        prev.map((i) => (targetIds.includes(i.id) ? { ...i, isVault: true, updatedAt: Date.now() } : i))
      );
    } else if (action === 'unvault') {
      if (viewSection === 'vault') {
        setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
      } else {
        setItems((prev) =>
          prev.map((i) => (targetIds.includes(i.id) ? { ...i, isVault: false, updatedAt: Date.now() } : i))
        );
      }
    } else if (action === 'category' && payload?.category) {
      setItems((prev) =>
        prev.map((i) => (targetIds.includes(i.id) ? { ...i, category: payload.category, updatedAt: Date.now() } : i))
      );
    } else if (action === 'tag' && payload?.tags) {
      setItems((prev) =>
        prev.map((i) => {
          if (!targetIds.includes(i.id)) return i;
          const currentTags = i.tags || [];
          const merged = Array.from(new Set([...currentTags, ...payload.tags]));
          return { ...i, tags: merged, updatedAt: Date.now() };
        })
      );
    } else if (action === 'expiry') {
      setItems((prev) =>
        prev.map((i) => {
          if (!targetIds.includes(i.id)) return i;
          return {
            ...i,
            expiryDate: payload?.expiryDate ?? null,
            expiryStatus: payload?.expiryDate ? 'valid' : 'none',
            updatedAt: Date.now(),
          };
        })
      );
    }

    try {
      await fetch('/api/drive/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          itemIds: targetIds,
          targetParentId: payload?.targetParentId,
          tags: payload?.tags,
          category: payload?.category,
          expiryDate: payload?.expiryDate,
          expiryStatus: payload?.expiryStatus,
        }),
      });
      loadItems({ silent: true });
    } catch (err) {
      console.error('Batch action error:', err);
      loadItems({ silent: true });
    }
  };

  const bulkDownloadZip = async (customItems?: DriveItem[]) => {
    const targetItems = customItems || items.filter((i) => selectedIds.includes(i.id));
    if (targetItems.length === 0) return;
    const zip = new JSZip();

    for (const item of targetItems) {
      if (item.type === 'file') {
        const blob = await getCloudFileBlob(item.id);
        if (blob) zip.file(item.name, blob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `FileCraft_Batch_Export_${Date.now()}.zip`);
  };

  const createFolder = async (name: string, color?: DriveFolderColor) => {
    const newFolder = await createCloudFolderApi(name, currentFolderId, color);
    if (newFolder) {
      setItems((prev) => [newFolder, ...prev]);
    }
    loadItems({ silent: true });
    return newFolder;
  };

  const uploadFiles = async (fileList: File[] | FileList) => {
    const list = Array.from(fileList);
    if (list.length === 0) return;

    await chunkedUploader.uploadFiles(
      list.map((f) => ({ file: f, parentId: currentFolderId })),
      currentFolderId,
      () => {
        loadItems({ silent: true });
      }
    );
  };

  const uploadDirectory = async (directoryItems: { path: string; file: File }[]) => {
    if (directoryItems.length === 0) return;

    await chunkedUploader.uploadFiles(
      directoryItems.map((item) => ({
        file: item.file,
        relativePath: item.path,
        parentId: currentFolderId,
      })),
      currentFolderId,
      () => {
        loadItems({ silent: true });
      }
    );
  };

  const renameItem = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const previousItems = items;

    // Optimistic rename
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, name: trimmed, updatedAt: Date.now() } : i))
    );
    if (previewItem?.id === id) {
      setPreviewItem((prev) => (prev ? { ...prev, name: trimmed } : null));
    }
    if (detailsItem?.id === id) {
      setDetailsItem((prev) => (prev ? { ...prev, name: trimmed } : null));
    }

    try {
      await updateCloudItemApi(id, { name: trimmed });
      loadItems({ silent: true });
    } catch (err) {
      console.error('Failed to rename item:', err);
      setItems(previousItems); // Rollback
    }
  };

  const moveItems = async (targetFolderId: string | null) => {
    if (selectedIds.length === 0) return;
    const previousItems = items;
    const targetIds = [...selectedIds];
    clearSelection();

    // Optimistic removal from current folder view
    setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
    if (detailsItem && targetIds.includes(detailsItem.id)) {
      setDetailsItem(null);
    }

    try {
      await moveCloudItemsApi(targetIds, targetFolderId);
      loadItems({ silent: true });
    } catch (err) {
      console.error('Failed to move items:', err);
      setItems(previousItems);
    }
  };

  const duplicateItem = async (id: string) => {
    const original = items.find((i) => i.id === id);
    if (!original || original.type === 'folder') return;
    const blob = await getCloudFileBlob(id);
    if (blob) {
      const copyName = original.name.replace(/(\.[^.]+)$/, ' (Copy)$1');
      await uploadCloudFiles(
        [{ name: copyName.includes('(Copy)') ? copyName : `${original.name} (Copy)`, blob, type: original.mimeType }],
        original.parentId
      );
      loadItems({ silent: true });
    }
  };

  const toggleStar = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const previousItems = items;
    const newStarred = !target.isStarred;

    // Instant 0ms optimistic toggle
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isStarred: newStarred, updatedAt: Date.now() } : i))
    );
    if (previewItem?.id === id) {
      setPreviewItem((prev) => (prev ? { ...prev, isStarred: newStarred } : null));
    }
    if (detailsItem?.id === id) {
      setDetailsItem((prev) => (prev ? { ...prev, isStarred: newStarred } : null));
    }

    try {
      await updateCloudItemApi(id, { isStarred: newStarred });
    } catch (err) {
      console.error('Failed to toggle star:', err);
      setItems(previousItems); // Rollback
    }
  };

  const changeFolderColor = async (id: string, color: DriveFolderColor) => {
    const previousItems = items;
    // Instant optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, color, updatedAt: Date.now() } : i))
    );
    if (detailsItem?.id === id) {
      setDetailsItem((prev) => (prev ? { ...prev, color } : null));
    }

    try {
      await updateCloudItemApi(id, { color });
    } catch (err) {
      console.error('Failed to change folder color:', err);
      setItems(previousItems);
    }
  };

  const trashSelected = async () => {
    if (selectedIds.length === 0) return;
    const previousItems = items;
    const targetIds = [...selectedIds];
    clearSelection();

    // Optimistic removal from current view
    if (viewSection !== 'trash') {
      setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
    } else {
      setItems((prev) => prev.map((i) => (targetIds.includes(i.id) ? { ...i, isTrashed: true } : i)));
    }
    if (detailsItem && targetIds.includes(detailsItem.id)) {
      setDetailsItem(null);
    }

    try {
      await trashCloudItemsApi(targetIds);
      fetchCloudStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to trash items:', err);
      setItems(previousItems);
    }
  };

  const restoreSelected = async () => {
    if (selectedIds.length === 0) return;
    const previousItems = items;
    const targetIds = [...selectedIds];
    clearSelection();

    // Optimistic removal from trash view
    if (viewSection === 'trash') {
      setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
    }
    if (detailsItem && targetIds.includes(detailsItem.id)) {
      setDetailsItem(null);
    }

    try {
      await restoreCloudItemsApi(targetIds);
      fetchCloudStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to restore items:', err);
      setItems(previousItems);
    }
  };

  const deleteSelectedPermanently = async () => {
    if (selectedIds.length === 0) return;
    const previousItems = items;
    const targetIds = [...selectedIds];
    clearSelection();

    setItems((prev) => prev.filter((i) => !targetIds.includes(i.id)));
    if (detailsItem && targetIds.includes(detailsItem.id)) {
      setDetailsItem(null);
    }

    try {
      await deleteCloudItemsPermanentlyApi(targetIds);
      fetchCloudStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to permanently delete items:', err);
      setItems(previousItems);
    }
  };

  const emptyTrash = async () => {
    const previousItems = items;
    clearSelection();
    setItems([]);

    try {
      await emptyCloudTrashApi();
      fetchCloudStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to empty trash:', err);
      setItems(previousItems);
    }
  };

  const downloadItem = async (item: DriveItem) => {
    if (item.type === 'folder') {
      await exportCloudItemAsZip(item);
    } else {
      const blob = await getCloudFileBlob(item.id);
      if (blob) {
        saveAs(blob, item.name);
      } else {
        const url = getCloudFileUrl(item.id) + '?download=1';
        window.open(url, '_blank');
      }
    }
  };

  const openPreview = (item: DriveItem) => {
    setPreviewItem(item);
    updateCloudItemApi(item.id, { lastAccessedAt: Date.now() }).catch(() => {});
  };

  const closePreview = () => {
    setPreviewItem(null);
  };

  const openShareModal = (item: DriveItem) => {
    setShareModalItem(item);
  };

  const closeShareModal = () => {
    setShareModalItem(null);
  };

  const triggerAutoLabel = async (itemIds?: string[]) => {
    setIsSyncing(true);
    try {
      await batchAutoLabelApi({ itemIds, allUnlabeled: !itemIds });
      await loadItems({ silent: true });
    } catch (err) {
      console.error('Auto-label failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const replaceItemContent = async (itemId: string, blob: Blob, fileName?: string, mimeType?: string): Promise<DriveItem> => {
    setIsSyncing(true);
    try {
      const updated = await replaceCloudItemContentApi(itemId, blob, fileName, mimeType);
      setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updated } : it)));
      if (previewItem?.id === itemId) setPreviewItem(updated);
      if (detailsItem?.id === itemId) setDetailsItem(updated);
      fetchCloudStats().then(setStats).catch(() => {});
      return updated;
    } finally {
      setIsSyncing(false);
    }
  };

  const saveAsNewFile = async (name: string, blob: Blob, mimeType?: string, parentId: string | null = currentFolderId): Promise<DriveItem> => {
    setIsSyncing(true);
    try {
      const createdItems = await uploadCloudFiles([{ name, blob, type: mimeType }], parentId);
      if (createdItems.length > 0) {
        setItems((prev) => [createdItems[0], ...prev]);
        fetchCloudStats().then(setStats).catch(() => {});
        return createdItems[0];
      }
      throw new Error('Upload returned empty');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <DriveContext.Provider
      value={{
        currentFolderId,
        breadcrumbs,
        viewSection,
        selectedCategory,
        selectedTag,
        setSelectedTag,
        selectedAiCategory,
        setSelectedAiCategory,
        activePerson,
        setActivePerson,
        activeVehicle,
        setActiveVehicle,
        availableTags,
        availableAiCategories,
        viewLayout,
        setViewLayout,
        sortOption,
        setSortOption,
        searchTerm,
        setSearchTerm,
        items,
        folders,
        files,
        loading,
        isSyncing,
        stats,
        selectedIds,
        previewItem,
        detailsItem,
        shareModalItem,
        isUploading,
        uploadProgress,
        authRequired,

        // Vault
        isVaultUnlocked,
        unlockVault,
        lockVault,
        isVaultModalOpen,
        setIsVaultModalOpen,
        vaultModalMode,
        setVaultModalMode,
        openVaultModal,

        // Modals
        isFolderChatOpen,
        setIsFolderChatOpen,
        isExpiryRadarOpen,
        setIsExpiryRadarOpen,
        isDedupModalOpen,
        setIsDedupModalOpen,
        isKeyboardShortcutsOpen,
        setIsKeyboardShortcutsOpen,

        // In-Place Quick Tools
        quickToolsItem,
        quickToolsInitialTab,
        openQuickTools,
        closeQuickTools,
        replaceItemContent,
        saveAsNewFile,

        // Actions & Selection
        navigateToFolder,
        selectSection,
        toggleSelect,
        selectAll,
        clearSelection,
        selectByType,
        invertSelection,
        isAllSelected,
        isSomeSelected,
        selectedPdfCount,
        mergeSelectedPdfs,
        copySelectedInfoToClipboard,
        triggerAutoLabel,
        triggerBatchAction,
        bulkDownloadZip,

        createFolder,
        uploadFiles,
        uploadDirectory,
        renameItem,
        moveItems,
        duplicateItem,
        toggleStar,
        changeFolderColor,
        trashSelected,
        restoreSelected,
        deleteSelectedPermanently,
        emptyTrash,
        downloadItem,
        openPreview,
        closePreview,
        openShareModal,
        closeShareModal,
        setDetailsItem,
        loadItems,
        refreshDrive: loadItems,

        // Real-Time Caching & Traversal
        folderCache,
        prefetchFolder,
        fetchFolderChildren,
      }}
    >
      {children}
    </DriveContext.Provider>
  );
};
