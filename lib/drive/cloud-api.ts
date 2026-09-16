import { DriveItem, DriveCategory, DriveFolderColor, DriveStats, DriveBreadcrumb, DriveViewSection, SearchFilterOptions, SearchResult } from './drive-types';
import JSZip from 'jszip';
import saveAs from 'file-saver';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('omnipdf_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function fetchCloudItems(options: {
  section?: DriveViewSection;
  parentId?: string | null;
  category?: DriveCategory;
  query?: string;
  isVaultUnlocked?: boolean;
} = {}): Promise<{ items: DriveItem[]; breadcrumbs: DriveBreadcrumb[] }> {
  const params = new URLSearchParams();
  if (options.section) params.set('section', options.section);
  if (options.parentId) params.set('parentId', options.parentId);
  if (options.category) params.set('category', options.category);
  if (options.query) params.set('q', options.query);

  const res = await fetch(`/api/drive/items?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('AUTH_REQUIRED');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch items');
  }

  const data = await res.json();
  return { items: data.items || [], breadcrumbs: data.breadcrumbs || [] };
}

export async function uploadCloudFiles(
  files: (File | { name: string; blob: Blob; type?: string })[],
  parentId: string | null = null
): Promise<DriveItem[]> {
  const formData = new FormData();
  if (parentId) formData.append('parentId', parentId);

  for (const f of files) {
    if (f instanceof File) {
      formData.append('files', f, f.name);
    } else {
      const fileObj = new File([f.blob], f.name, { type: f.type || 'application/octet-stream' });
      formData.append('files', fileObj, f.name);
    }
  }

  const res = await fetch('/api/drive/upload', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload files');
  }

  const data = await res.json();
  return data.items || [];
}

export async function uploadCloudDirectoryStructure(
  files: { path: string; file: File }[],
  parentId: string | null = null
): Promise<number> {
  const formData = new FormData();
  if (parentId) formData.append('parentId', parentId);
  formData.append('isDirectory', 'true');

  for (const item of files) {
    formData.append('files', item.file, item.file.name);
    formData.append('paths', item.path);
  }

  const res = await fetch('/api/drive/upload', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload directory');
  }

  const data = await res.json();
  return data.count || files.length;
}

export async function createCloudFolderApi(
  name: string,
  parentId: string | null = null,
  color: DriveFolderColor = 'default'
): Promise<DriveItem> {
  const res = await fetch('/api/drive/folder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, parentId, color }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create folder');
  }

  const data = await res.json();
  return data.folder;
}

export async function updateCloudItemApi(
  id: string,
  updates: Partial<DriveItem>
): Promise<DriveItem> {
  const res = await fetch('/api/drive/item', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ id, updates }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update item');
  }

  const data = await res.json();
  return data.item;
}

export async function moveCloudItemsApi(
  itemIds: string[],
  targetFolderId: string | null
): Promise<void> {
  const res = await fetch('/api/drive/item', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ action: 'move', itemIds, targetFolderId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to move items');
  }
}

export async function trashCloudItemsApi(itemIds: string[]): Promise<void> {
  const res = await fetch('/api/drive/item', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ action: 'trash', itemIds }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to trash items');
  }
}

export async function restoreCloudItemsApi(itemIds: string[]): Promise<void> {
  const res = await fetch('/api/drive/item', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ action: 'restore', itemIds }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to restore items');
  }
}

export async function deleteCloudItemsPermanentlyApi(itemIds: string[]): Promise<void> {
  const res = await fetch('/api/drive/item', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ action: 'permanent', itemIds }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete items permanently');
  }
}

export async function emptyCloudTrashApi(): Promise<void> {
  const res = await fetch('/api/drive/item', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ action: 'empty-trash' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to empty trash');
  }
}

export async function fetchCloudStats(): Promise<DriveStats> {
  const res = await fetch('/api/drive/stats', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch storage stats');
  }

  const data = await res.json();
  return data.stats;
}

export function getCloudFileUrl(id: string): string {
  return `/api/drive/file/${id}`;
}

export async function getCloudFileBlob(id: string): Promise<Blob | null> {
  try {
    const res = await fetch(`/api/drive/file/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export async function addCollaboratorApi(
  itemId: string,
  email: string,
  role: string = 'viewer'
): Promise<DriveItem> {
  const res = await fetch('/api/drive/share/collaborator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ itemId, email, role }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add collaborator');
  }

  const data = await res.json();
  return data.item;
}

export async function removeCollaboratorApi(itemId: string, email: string): Promise<DriveItem> {
  const res = await fetch('/api/drive/share/collaborator', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ itemId, email }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove collaborator');
  }

  const data = await res.json();
  return data.item;
}

export async function updateShareConfigApi(
  itemId: string,
  config: any
): Promise<DriveItem> {
  const res = await fetch('/api/drive/share/link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ itemId, ...config }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update share link');
  }

  const data = await res.json();
  return data.item;
}

export async function fetchDriveCommentsApi(itemId: string): Promise<any[]> {
  const res = await fetch(`/api/drive/comments?itemId=${encodeURIComponent(itemId)}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.comments || [];
}

export async function addDriveCommentApi(itemId: string, content: string): Promise<any> {
  const res = await fetch('/api/drive/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ itemId, content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to post comment');
  }

  const data = await res.json();
  return data.comment;
}

export async function fetchDriveActivitiesApi(itemId?: string): Promise<any[]> {
  const url = itemId ? `/api/drive/activity?itemId=${encodeURIComponent(itemId)}` : '/api/drive/activity';
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.activities || [];
}

export async function createBatchFoldersApi(
  paths: string[],
  baseParentId: string | null = null
): Promise<Record<string, string>> {
  const res = await fetch('/api/drive/folder/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ paths, baseParentId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create folder tree');
  }

  const data = await res.json();
  return data.folderMap || {};
}

/**
 * Export cloud file or folder tree as a downloadable ZIP
 */
export async function exportCloudItemAsZip(item: DriveItem): Promise<void> {
  if (item.type === 'file') {
    const blob = await getCloudFileBlob(item.id);
    if (blob) {
      saveAs(blob, item.name);
    }
    return;
  }

  const zip = new JSZip();

  async function addFolderToZip(folderId: string, zipFolder: JSZip) {
    const { items } = await fetchCloudItems({ parentId: folderId });
    for (const child of items) {
      if (child.type === 'folder') {
        const sub = zipFolder.folder(child.name);
        if (sub) {
          await addFolderToZip(child.id, sub);
        }
      } else {
        const blob = await getCloudFileBlob(child.id);
        if (blob) {
          zipFolder.file(child.name, blob);
        }
      }
    }
  }

  const rootZip = zip.folder(item.name) || zip;
  await addFolderToZip(item.id, rootZip);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${item.name}.zip`);
}

/**
 * Execute semantic and fuzzy search query against Cloud Drive
 */
export async function searchCloudItemsApi(options: SearchFilterOptions): Promise<SearchResult> {
  const params = new URLSearchParams();
  if (options.query) params.set('q', options.query);
  if (options.tag) params.set('tag', options.tag);
  if (options.category) params.set('category', options.category);
  if (options.aiCategory) params.set('aiCategory', options.aiCategory);
  if (options.dateRange) params.set('dateRange', options.dateRange);
  if (options.section) params.set('section', options.section);
  if (options.parentId !== undefined) params.set('parentId', options.parentId === null ? 'null' : options.parentId);
  if (options.sort) params.set('sort', options.sort);

  const res = await fetch(`/api/drive/search?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('AUTH_REQUIRED');
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Search failed');
  }

  return await res.json();
}

/**
 * Batch trigger AI auto-labeling on items
 */
export async function batchAutoLabelApi(params: { itemIds?: string[]; allUnlabeled?: boolean }): Promise<{ count: number; updated: DriveItem[] }> {
  const res = await fetch('/api/drive/items/autolabel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('AUTH_REQUIRED');
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Auto-labeling failed');
  }

  return await res.json();
}

