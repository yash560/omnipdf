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
  uploadCloudDirectoryStructure,
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

  // Actions
  navigateToFolder: (folderId: string | null) => void;
  selectSection: (section: DriveViewSection, category?: DriveCategory) => void;
  toggleSelect: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  triggerAutoLabel: (itemIds?: string[]) => Promise<void>;
  
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

export function DriveProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveBreadcrumb[]>([{ id: null, name: 'Cloud Drive' }]);
  const [viewSection, setViewSection] = useState<DriveViewSection>('my-drive');
  const [selectedCategory, setSelectedCategory] = useState<DriveCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAiCategory, setSelectedAiCategory] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<{ tag: string; count: number }[]>([]);
  const [availableAiCategories, setAvailableAiCategories] = useState<{ category: string; count: number }[]>([]);

  const [viewLayout, setViewLayout] = useState<DriveViewLayout>('grid');
  const [sortOption, setSortOption] = useState<DriveSortOption>({ field: 'name', order: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<DriveItem | null>(null);
  const [shareModalItem, setShareModalItem] = useState<DriveItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [authRequired, setAuthRequired] = useState(false);

  // Load items from Cloud API with Semantic & Fuzzy Search Integration
  const loadItems = useCallback(async () => {
    if (!isAuthenticated && !user) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }

    setAuthRequired(false);
    setLoading(true);

    try {
      const isSearchActive = Boolean(searchTerm.trim() || selectedTag || selectedAiCategory);

      if (isSearchActive) {
        const searchResult = await searchCloudItemsApi({
          query: searchTerm.trim(),
          tag: selectedTag || undefined,
          aiCategory: selectedAiCategory || undefined,
          category: selectedCategory || undefined,
          section: viewSection,
          parentId: currentFolderId,
        });

        setItems(searchResult.items);
        setAvailableTags(searchResult.availableTags);
        setAvailableAiCategories(searchResult.availableAiCategories);
      } else {
        const { items: fetched, breadcrumbs: crumbs } = await fetchCloudItems({
          section: viewSection,
          parentId: currentFolderId,
          category: selectedCategory || undefined,
          query: undefined,
        });

        // Compute available tags and categories from current folder items
        const tagCounts = new Map<string, number>();
        const categoryCounts = new Map<string, number>();

        fetched.forEach((it) => {
          (it.tags || []).forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1));
          if (it.aiCategory) categoryCounts.set(it.aiCategory, (categoryCounts.get(it.aiCategory) || 0) + 1);
        });

        setAvailableTags(
          Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20)
        );

        setAvailableAiCategories(
          Array.from(categoryCounts.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
        );

        // Apply Client Sort
        fetched.sort((a, b) => {
          if (viewSection === 'my-drive' && a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }

          let comparison = 0;
          if (sortOption.field === 'name') {
            comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
          } else if (sortOption.field === 'updatedAt') {
            comparison = a.updatedAt - b.updatedAt;
          } else if (sortOption.field === 'size') {
            comparison = a.size - b.size;
          } else if (sortOption.field === 'category') {
            comparison = a.category.localeCompare(b.category);
          }

          return sortOption.order === 'asc' ? comparison : -comparison;
        });

        setItems(fetched);
        setBreadcrumbs(crumbs.length > 0 ? crumbs : [{ id: null, name: 'Cloud Drive' }]);
      }

      // Fetch cloud stats
      const s = await fetchCloudStats().catch(() => null);
      if (s) setStats(s);
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        setAuthRequired(true);
      } else {
        console.error('[DriveProvider] Error loading cloud items:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    user,
    currentFolderId,
    viewSection,
    selectedCategory,
    selectedTag,
    selectedAiCategory,
    sortOption,
    searchTerm,
  ]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const folders = items.filter((i) => i.type === 'folder');
  const files = items.filter((i) => i.type === 'file');

  const navigateToFolder = (folderId: string | null) => {
    setViewSection('my-drive');
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedAiCategory(null);
    setCurrentFolderId(folderId);
    setSelectedIds([]);
    setSearchTerm('');
  };

  const selectSection = (section: DriveViewSection, category?: DriveCategory) => {
    setViewSection(section);
    setSelectedCategory(category || null);
    setSelectedTag(null);
    setSelectedAiCategory(null);
    if (section !== 'my-drive') {
      setCurrentFolderId(null);
    }
    setSelectedIds([]);
    setSearchTerm('');
  };

  const toggleSelect = (id: string, multi = false) => {
    if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }

    const clicked = items.find((i) => i.id === id);
    if (clicked) {
      setDetailsItem(clicked);
    }
  };

  const selectAll = () => {
    setSelectedIds(items.map((i) => i.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setDetailsItem(null);
  };

  const createFolder = async (name: string, color: DriveFolderColor = 'default') => {
    const folder = await createCloudFolderApi(name, currentFolderId, color);
    await loadItems();
    return folder;
  };

  // Upload files using 2GB+ Resumable Chunked Multipart Engine
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

  // Upload directory structure preserving nested folders
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
        navigateToFolder,
        selectSection,
        toggleSelect,
        selectAll,
        clearSelection,
        triggerAutoLabel,
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
}

export function useDrive() {
  const ctx = useContext(DriveContext);
  if (!ctx) {
    throw new Error('useDrive must be used within a DriveProvider');
  }
  return ctx;
}
