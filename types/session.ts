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
  pdfData: ArrayBuffer | Uint8Array;
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
