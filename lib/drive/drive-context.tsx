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
  getFolderChildren,
  getStarredItems,
  getRecentItems,
  getTrashItems,
  getItemsByCategory,
  getFolderBreadcrumbs,
  createDriveFolder,
  uploadDriveFile,
  uploadDriveDirectoryStructure,
  updateDriveItem,
  moveDriveItems,
  duplicateDriveFile,
  moveDriveItemsToTrash,
  restoreDriveItemsFromTrash,
  deleteDriveItemsPermanently,
  emptyDriveTrash,
  getDriveStats,
  searchDrive,
  exportDriveItemAsZip,
  getFileBlob,
} from './drive-db';
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

  // Actions
  navigateToFolder: (folderId: string | null) => void;
  selectSection: (section: DriveViewSection, category?: DriveCategory) => void;
  toggleSelect: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // CRUD Operations
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
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveBreadcrumb[]>([{ id: null, name: 'My Drive' }]);
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

  // Load items for current section / folder / search
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      let fetched: DriveItem[] = [];

      if (searchTerm.trim().length > 0) {
        fetched = await searchDrive(searchTerm, selectedCategory || undefined);
      } else if (viewSection === 'my-drive') {
        fetched = await getFolderChildren(currentFolderId, false);
      } else if (viewSection === 'starred') {
        fetched = await getStarredItems();
      } else if (viewSection === 'recent') {
        fetched = await getRecentItems();
      } else if (viewSection === 'trash') {
        fetched = await getTrashItems();
      } else if (viewSection === 'category' && selectedCategory) {
        fetched = await getItemsByCategory(selectedCategory);
      }

      // Apply Sort
      fetched.sort((a, b) => {
        // Folders always first in My Drive view
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

      // Load breadcrumbs
      const crumbs = await getFolderBreadcrumbs(currentFolderId);
      setBreadcrumbs(crumbs);

      // Load aggregated stats
      const s = await getDriveStats();
      setStats(s);
    } catch (err) {
      console.error('Error loading drive items:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, viewSection, selectedCategory, sortOption, searchTerm]);

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
    const folder = await createDriveFolder(name, currentFolderId, color);
    await loadItems();
    return folder;
  };

  const uploadFiles = async (fileList: File[] | FileList) => {
    const list = Array.from(fileList);
    if (list.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      let completed = 0;
      for (const file of list) {
        await uploadDriveFile(file, currentFolderId);
        completed++;
        setUploadProgress(Math.round((completed / list.length) * 100));
      }
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
      await uploadDriveDirectoryStructure(directoryItems, currentFolderId);
      await loadItems();
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const renameItem = async (id: string, newName: string) => {
    await updateDriveItem(id, { name: newName });
    await loadItems();
  };

  const moveItems = async (targetFolderId: string | null) => {
    if (selectedIds.length === 0) return;
    await moveDriveItems(selectedIds, targetFolderId);
    clearSelection();
    await loadItems();
  };

  const duplicateItem = async (id: string) => {
    await duplicateDriveFile(id);
    await loadItems();
  };

  const toggleStar = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      await updateDriveItem(id, { isStarred: !item.isStarred });
      await loadItems();
    }
  };

  const changeFolderColor = async (id: string, color: DriveFolderColor) => {
    await updateDriveItem(id, { color });
    await loadItems();
  };

  const trashSelected = async () => {
    if (selectedIds.length === 0) return;
    await moveDriveItemsToTrash(selectedIds);
    clearSelection();
    await loadItems();
  };

  const restoreSelected = async () => {
    if (selectedIds.length === 0) return;
    await restoreDriveItemsFromTrash(selectedIds);
    clearSelection();
    await loadItems();
  };

  const deleteSelectedPermanently = async () => {
    if (selectedIds.length === 0) return;
    await deleteDriveItemsPermanently(selectedIds);
    clearSelection();
    await loadItems();
  };

  const emptyTrash = async () => {
    await emptyDriveTrash();
    clearSelection();
    await loadItems();
  };

  const downloadItem = async (item: DriveItem) => {
    if (item.type === 'folder') {
      await exportDriveItemAsZip(item.id);
    } else {
      const blob = await getFileBlob(item.id);
      if (blob) {
        saveAs(blob, item.name);
      }
    }
  };

  const openPreview = (item: DriveItem) => {
    setPreviewItem(item);
    updateDriveItem(item.id, { lastAccessedAt: Date.now() });
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
