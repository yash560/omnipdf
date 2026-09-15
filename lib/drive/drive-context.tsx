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
} from './cloud-api';
import { useAuth } from '@/lib/auth/auth-context';
import saveAs from 'file-saver';

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

  // Data & State
  items: DriveItem[];
  folders: DriveItem[];
  files: DriveItem[];
  loading: boolean;
  stats: DriveStats | null;
  selectedIds: string[];
  previewItem: DriveItem | null;
  detailsItem: DriveItem | null;
  isUploading: boolean;
  uploadProgress: number;
  authRequired: boolean;

  // Actions
  navigateToFolder: (folderId: string | null) => void;
  selectSection: (section: DriveViewSection, category?: DriveCategory) => void;
  toggleSelect: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
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
  setDetailsItem: (item: DriveItem | null) => void;
  refreshDrive: () => Promise<void>;
}

const DriveContext = createContext<DriveContextType | null>(null);

export function DriveProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveBreadcrumb[]>([{ id: null, name: 'Cloud Drive' }]);
  const [viewSection, setViewSection] = useState<DriveViewSection>('my-drive');
  const [selectedCategory, setSelectedCategory] = useState<DriveCategory | null>(null);
  const [viewLayout, setViewLayout] = useState<DriveViewLayout>('grid');
  const [sortOption, setSortOption] = useState<DriveSortOption>({ field: 'name', order: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<DriveItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [authRequired, setAuthRequired] = useState(false);

  // Load items from Cloud API for current section / folder / search
  const loadItems = useCallback(async () => {
    if (!isAuthenticated && !user) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }

    setAuthRequired(false);
    setLoading(true);

    try {
      const { items: fetched, breadcrumbs: crumbs } = await fetchCloudItems({
        section: viewSection,
        parentId: currentFolderId,
        category: selectedCategory || undefined,
        query: searchTerm.trim() || undefined,
      });

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
  }, [isAuthenticated, user, currentFolderId, viewSection, selectedCategory, sortOption, searchTerm]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Derived folders and files lists
  const folders = items.filter((i) => i.type === 'folder');
  const files = items.filter((i) => i.type === 'file');

  const navigateToFolder = (folderId: string | null) => {
    setViewSection('my-drive');
    setSelectedCategory(null);
    setCurrentFolderId(folderId);
    setSelectedIds([]);
    setSearchTerm('');
  };

  const selectSection = (section: DriveViewSection, category?: DriveCategory) => {
    setViewSection(section);
    setSelectedCategory(category || null);
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

  const uploadFiles = async (fileList: File[] | FileList) => {
    const list = Array.from(fileList);
    if (list.length === 0) return;

    setIsUploading(true);
    setUploadProgress(15);

    try {
      await uploadCloudFiles(list, currentFolderId);
      setUploadProgress(100);
      await loadItems();
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadDirectory = async (directoryItems: { path: string; file: File }[]) => {
    if (directoryItems.length === 0) return;
    setIsUploading(true);
    setUploadProgress(20);
    try {
      await uploadCloudDirectoryStructure(directoryItems, currentFolderId);
      setUploadProgress(100);
      await loadItems();
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
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
        // Direct browser download
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

  return (
    <DriveContext.Provider
      value={{
        currentFolderId,
        breadcrumbs,
        viewSection,
        selectedCategory,
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
        isUploading,
        uploadProgress,
        authRequired,
        navigateToFolder,
        selectSection,
        toggleSelect,
        selectAll,
        clearSelection,
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
        setDetailsItem,
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
