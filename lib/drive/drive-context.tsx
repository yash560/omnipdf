'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
} from './cloud-api';
import { useAuth } from '@/lib/auth/auth-context';
import saveAs from 'file-saver';
import JSZip from 'jszip';
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

  // Actions
  navigateToFolder: (folderId: string | null) => void;
  selectSection: (section: DriveViewSection, category?: DriveCategory) => void;
  toggleSelect: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
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
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveBreadcrumb[]>([{ id: null, name: 'My Drive' }]);
  const [viewSection, setViewSection] = useState<DriveViewSection>('my-drive');
  const [selectedCategory, setSelectedCategory] = useState<DriveCategory | null>(null);
  const [viewLayout, setViewLayout] = useState<DriveViewLayout>('grid');
  const [sortOption, setSortOption] = useState<DriveSortOption>({ field: 'updatedAt', order: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAiCategory, setSelectedAiCategory] = useState<string | null>(null);
  const [activePerson, setActivePerson] = useState<string | undefined>(undefined);
  const [activeVehicle, setActiveVehicle] = useState<string | undefined>(undefined);
  const [availableTags, setAvailableTags] = useState<{ tag: string; count: number }[]>([]);
  const [availableAiCategories, setAvailableAiCategories] = useState<{ category: string; count: number }[]>([]);

  const [items, setItems] = useState<DriveItem[]>([]);
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

  const loadItems = useCallback(async (options?: { silent?: boolean }) => {
    if (authRequired) {
      setLoading(false);
      setIsSyncing(false);
      return;
    }

    const isSilent = options?.silent ?? (hasLoadedInitial && items.length > 0);
    if (!isSilent) {
      setLoading(true);
    } else {
      setIsSyncing(true);
    }

    try {
      if (searchTerm || selectedTag || selectedAiCategory || activePerson || activeVehicle) {
        const searchResult = await searchCloudItemsApi({
          query: searchTerm,
          tag: selectedTag || undefined,
          aiCategory: selectedAiCategory || undefined,
          person: activePerson,
          vehicle: activeVehicle,
          category: selectedCategory || undefined,
          section: viewSection,
          parentId: (searchTerm || selectedTag || selectedAiCategory || activePerson || activeVehicle) ? undefined : currentFolderId,
          sort: sortOption.field === 'updatedAt' ? 'date' : (sortOption.field as any),
          isVaultUnlocked,
        });

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
        setItems(cloudData.items);
        if (cloudData.breadcrumbs && cloudData.breadcrumbs.length > 0) {
          setBreadcrumbs(cloudData.breadcrumbs);
        }
      }

      const cloudStats = await fetchCloudStats();
      setStats(cloudStats);
      setHasLoadedInitial(true);
    } catch (error) {
      console.error('Failed to load drive items from cloud:', error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [
    authRequired,
    hasLoadedInitial,
    items.length,
    currentFolderId,
    viewSection,
    selectedCategory,
    searchTerm,
    selectedTag,
    selectedAiCategory,
    activePerson,
    activeVehicle,
    sortOption,
    isVaultUnlocked,
  ]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Derived state
  const folders = items.filter((item) => item.type === 'folder');
  const files = items.filter((item) => item.type === 'file');

  // Navigation handlers
  const navigateToFolder = async (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedIds([]);
    setSearchTerm('');
    setSelectedTag(null);
    setSelectedAiCategory(null);

    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'My Drive' }]);
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
  };

  const selectSection = (section: DriveViewSection, category?: DriveCategory) => {
    if (section === 'vault' && !isVaultUnlocked) {
      setIsVaultModalOpen(true);
      return;
    }
    setViewSection(section);
    setSelectedCategory(category || null);
    setCurrentFolderId(null);
    setBreadcrumbs([{ id: null, name: section === 'shared' ? 'Shared with Me' : section === 'vault' ? 'Secure Vault' : 'My Drive' }]);
    setSelectedIds([]);
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

        // Actions
        navigateToFolder,
        selectSection,
        toggleSelect,
        selectAll,
        clearSelection,
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
      }}
    >
      {children}
    </DriveContext.Provider>
  );
};
