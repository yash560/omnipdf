import { DriveItem, DuplicateCluster } from './drive-types';

/**
 * Normalize filename for fuzzy duplicate matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '') // remove extension
    .replace(/[._\-()]/g, ' ')
    .replace(/\b(copy|\d+|unlocked|back|front|signed|final)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scan all drive items to identify duplicate file clusters
 */
export function findDuplicateClusters(items: DriveItem[]): DuplicateCluster[] {
  const fileItems = items.filter((it) => it.type === 'file' && !it.isTrash);
  const sizeMap = new Map<number, DriveItem[]>();
  const nameMap = new Map<string, DriveItem[]>();

  // 1. Group by exact size (for identical binaries)
  for (const item of fileItems) {
    if (item.size > 0) {
      const existing = sizeMap.get(item.size) || [];
      existing.push(item);
      sizeMap.set(item.size, existing);
    }

    const normName = normalizeName(item.name);
    if (normName.length > 3) {
      const existingName = nameMap.get(normName) || [];
      existingName.push(item);
      nameMap.set(normName, existingName);
    }
  }

  const clusters: DuplicateCluster[] = [];
  const processedItemIds = new Set<string>();

  // Cluster by exact file size
  for (const [size, group] of sizeMap.entries()) {
    if (group.length > 1) {
      const clusterId = `cluster_size_${size}`;
      const sorted = [...group].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      clusters.push({
        id: clusterId,
        hash: `size_${size}`,
        name: sorted[0].name,
        size,
        items: sorted,
        suggestedKeepId: sorted[0].id,
      });
      group.forEach((it) => processedItemIds.add(it.id));
    }
  }

  // Cluster by fuzzy normalized name for items not already clustered
  for (const [normName, group] of nameMap.entries()) {
    const unclustered = group.filter((it) => !processedItemIds.has(it.id));
    if (unclustered.length > 1) {
      const clusterId = `cluster_name_${normName.replace(/\s+/g, '_')}`;
      const sorted = [...unclustered].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      clusters.push({
        id: clusterId,
        hash: `name_${normName}`,
        name: sorted[0].name,
        size: sorted[0].size,
        items: sorted,
        suggestedKeepId: sorted[0].id,
      });
      unclustered.forEach((it) => processedItemIds.add(it.id));
    }
  }

  return clusters;
}
