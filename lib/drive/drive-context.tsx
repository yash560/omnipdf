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
  triggerBatchAction: (action: 'tag' | 'move' | 'star' | 'unstar' | 'trash' | 'restore' | 'vault' | 'unvault', payload?: any) => Promise<void>;
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
  loadItems: () => Promise<void>;
  refreshDrive: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<DriveItem | null>(null);
  const [shareModalItem, setShareModalItem] = useState<DriveItem | null>(null);

  // Vault Security
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

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

  const loadItems = useCallback(async () => {
    if (authRequired) {
      setLoading(false);
      return;
    }

    setLoading(true);
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
    } catch (error) {
      console.error('Failed to load drive items from cloud:', error);
    } finally {
      setLoading(false);
    }
  }, [
    authRequired,
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

  // Batch multi-select actions
  const triggerBatchAction = async (
    action: 'tag' | 'move' | 'star' | 'unstar' | 'trash' | 'restore' | 'vault' | 'unvault',
    payload?: any
  ) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await fetch('/api/drive/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          itemIds: selectedIds,
          targetParentId: payload?.targetParentId,
          tags: payload?.tags,
          category: payload?.category,
        }),
      });
      clearSelection();
      await loadItems();
    } catch (err) {
      console.error('Batch action error:', err);
    } finally {
      setLoading(false);
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
    await loadItems();
    return newFolder;
  };

  const uploadFiles = async (fileList: File[] | FileList) => {
    const list = Array.from(fileList);
    if (list.length === 0) return;

    await chunkedUploader.uploadFiles(
      list.map((f) => ({ file: f, parentId: currentFolderId })),
      currentFolderId,
      () => {
        loadItems();
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
        loadItems();
      }
    );
  };

  const renameItem = async (id: string, newName: string) => {
    await updateCloudItemApi(id, { name: newName });
    await loadItems();
  };

  const moveItems = async (targetFolderId: string | null) => {
    if (selectedIds.length === 0) return;
    await moveCloudItemsApi(selectedIds, targetFolderId);
    clearSelection();
    await loadItems();
  };

  const duplicateItem = async (id: string) => {
    const original = items.find((i) => i.id === id);
    if (!original || original.type === 'folder') return;
    const blob = await getCloudFileBlob(id);
    if (blob) {
      const copyName = original.name.replace(/(\.[^.]+)$/, ' (Copy)$1');
      await uploadCloudFiles([{ name: copyName.includes('(Copy)') ? copyName : `${original.name} (Copy)`, blob, type: original.mimeType }], original.parentId);
      await loadItems();
    }
  };

  const toggleStar = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      await updateCloudItemApi(id, { isStarred: !item.isStarred });
      await loadItems();
    }
  };

  const changeFolderColor = async (id: string, color: DriveFolderColor) => {
    await updateCloudItemApi(id, { color });
    await loadItems();
  };

  const trashSelected = async () => {
    if (selectedIds.length === 0) return;
    await trashCloudItemsApi(selectedIds);
    clearSelection();
    await loadItems();
  };

  const restoreSelected = async () => {
    if (selectedIds.length === 0) return;
    await restoreCloudItemsApi(selectedIds);
    clearSelection();
    await loadItems();
  };

  const deleteSelectedPermanently = async () => {
    if (selectedIds.length === 0) return;
    await deleteCloudItemsPermanentlyApi(selectedIds);
    clearSelection();
    await loadItems();
  };

  const emptyTrash = async () => {
    await emptyCloudTrashApi();
    clearSelection();
    await loadItems();
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
    setLoading(true);
    try {
      await batchAutoLabelApi({ itemIds, allUnlabeled: !itemIds });
      await loadItems();
    } catch (err) {
      console.error('Auto-label failed:', err);
    } finally {
      setLoading(false);
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
