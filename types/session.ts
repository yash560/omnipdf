import { Annotation } from './pdf';

export interface SessionVersion {
  id: string;
  timestamp: number;
  label: string;
  annotationsCount: number;
  annotations: Annotation[];
}

export interface StudioSession {
  id: string;
  filename: string;
  // Absent on list/metadata-only fetches (e.g. dashboard, inactive tabs) — the
  // server stores bytes in GridFS separately and only returns them for the
  // session actually being opened, via getSessionFromDB(id).
  pdfData?: ArrayBuffer | Uint8Array;
  size: number;
  pageCount: number;
  thumbnailUrl?: string;
  annotations: Annotation[];
  pageViewports?: { [pageIndex: number]: { width: number; height: number } };
  currentPage: number;
  zoom: number;
  createdAt: number;
  lastModified: number;
  isUnsaved: boolean;
  cloudSynced?: boolean;
  versions?: SessionVersion[];
}

export interface CloudShareInfo {
  shareId: string;
  url: string;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
}
