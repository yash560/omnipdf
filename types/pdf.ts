export type ToolCategory = 'all' | 'organize' | 'optimize' | 'edit' | 'security' | 'convert' | 'smart';

export interface PDFTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'organize' | 'optimize' | 'edit' | 'security' | 'convert' | 'smart';
  icon: string;
  color: string;
  badge?: string;
  gradient: string;
  popular?: boolean;
}

export interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  previewUrl?: string;
  thumbnailUrls?: string[];
  arrayBuffer?: ArrayBuffer;
  rotation?: number; // 0, 90, 180, 270
}

export interface PageThumbnail {
  pageNumber: number; // 1-indexed
  dataUrl: string;
  rotation: number;
  selected?: boolean;
  deleted?: boolean;
}

export type AnnotationType = 
  | 'text'
  | 'draw'
  | 'highlight'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'image'
  | 'signature'
  | 'redact'
  | 'stamp';

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  pageIndex: number; // 0-indexed
  x: number; // Normalized percentage (0-100) or pixel coordinates relative to page
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: 'sans' | 'serif' | 'mono' | 'cursive' | 'display' | string;
  color: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  lineHeight?: number;
  letterSpacing?: number;
  padding?: number;
}

export interface DrawAnnotation extends BaseAnnotation {
  type: 'draw' | 'highlight';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'rectangle' | 'circle' | 'arrow' | 'line';
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image' | 'signature' | 'stamp';
  dataUrl: string;
  aspectRatio?: number;
}

export interface RedactAnnotation extends BaseAnnotation {
  type: 'redact';
  fillColor: string; // usually #000000
}

export type Annotation = 
  | TextAnnotation 
  | DrawAnnotation 
  | ShapeAnnotation 
  | ImageAnnotation 
  | RedactAnnotation;

export interface WatermarkConfig {
  type: 'text' | 'image';
  text?: string;
  imageDataUrl?: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  position: 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'mosaic';
  layer: 'over' | 'under';
}

export interface PageNumberConfig {
  format: 'number-only' | 'page-n' | 'page-n-of-total' | 'n-slash-total';
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  fontSize: number;
  fontFamily: string;
  color: string;
  margin: number;
  startPage: number;
  pageRange: 'all' | 'custom';
  customRange?: string;
}

export interface CompressionSettings {
  level: 'extreme' | 'recommended' | 'less';
  imageQuality: number; // 0.1 to 1.0
}
