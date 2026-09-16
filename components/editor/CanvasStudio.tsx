'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Annotation, 
  AnnotationType, 
  TextAnnotation, 
  DrawAnnotation, 
  ShapeAnnotation, 
  ImageAnnotation, 
  RedactAnnotation,
  PageThumbnail 
} from '@/types/pdf';
import { StudioSession } from '@/types/session';
import { Toolbar } from './Toolbar';
import { PropertyBar } from './PropertyBar';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { SignatureModal } from './SignatureModal';
import { SessionTabs } from './SessionTabs';
import { SessionDrawer } from './SessionDrawer';
import { CloudShareModal } from './CloudShareModal';
import { AiPageAssistantModal } from './AiPageAssistantModal';
import { getPdfJs, renderAllPageThumbnails, downloadBytes, safeCloneBytes, fileToArrayBuffer } from '@/lib/pdf/core';
import { exportAnnotatedPdf } from '@/lib/pdf/canvas-exporter';
import {
  saveSessionToDB,
  getAllSessionsFromDB,
  getSessionFromDB,
  deleteSessionFromDB,
  clearAllSessionsFromDB
} from '@/lib/storage/session-db';

interface CanvasStudioProps {
  initialPdfData?: ArrayBuffer | Uint8Array;
  initialFilename?: string;
  pdfData?: ArrayBuffer | Uint8Array;
  filename?: string;
  defaultTool?: AnnotationType | 'select' | 'hand' | 'eraser';
  initialSessionId?: string;
}

export function CanvasStudio({ 
  initialPdfData, 
  initialFilename, 
  pdfData, 
  filename, 
  defaultTool,
  initialSessionId
}: CanvasStudioProps) {
  const effectivePdfData = initialPdfData || pdfData;
  const effectiveFilename = initialFilename || filename || 'document.pdf';

  // Multi-Session Management State
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>(initialSessionId || 'default-session');
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
  const [cloudShareOpen, setCloudShareOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Auto-Save State
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(Date.now());
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active Session Navigation & Zoom State
  const [currentPage, setCurrentPage] = useState(1); // 1-indexed
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tool & Properties
  const [activeTool, setActiveTool] = useState<AnnotationType | 'select' | 'hand' | 'eraser'>(defaultTool || 'select');
  const [currentColor, setCurrentColor] = useState('#ef4444');
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(3);
  const [currentFontSize, setCurrentFontSize] = useState(16);

  // Annotations & Selection
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Modals & Export
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Viewport sizes for PDF coordinate mapping
  const [pageViewports, setPageViewports] = useState<{ [pageIndex: number]: { width: number; height: number } }>({});
  const [pageRotations, setPageRotations] = useState<{ [pageIndex: number]: number }>({});

  // Canvas & Doc Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const fetchingSessionIdsRef = useRef<Set<string>>(new Set());

  // Drawing & Resizing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingAnnotation, setIsDraggingAnnotation] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeState, setResizeState] = useState<{
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startFontSize: number;
  } | null>(null);

  // Initialize master session and load previous sessions from IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function initSessions() {
      const stored = await getAllSessionsFromDB();
      if (!isMounted) return;

      // Case 1: Specific initialSessionId requested
      if (initialSessionId) {
        const target = stored.find((s) => s.id === initialSessionId);
        if (target) {
          setSessions(stored);
          setActiveSessionId(target.id);
          setAnnotations(target.annotations || []);
          setCurrentPage(target.currentPage || 1);
          setZoom(target.zoom || 1.0);
          setHistory([target.annotations || []]);
          setHistoryIndex(0);
          loadFullSession(target.id);
          return;
        }
      }

      // Case 2: New or passed PDF Data
      if (effectivePdfData) {
        const existingSession = stored.find((s) => s.filename === effectiveFilename);
        if (existingSession && !initialSessionId) {
          setSessions(stored);
          setActiveSessionId(existingSession.id);
          setAnnotations(existingSession.annotations || []);
          setCurrentPage(existingSession.currentPage || 1);
          setZoom(existingSession.zoom || 1.0);
          setHistory([existingSession.annotations || []]);
          setHistoryIndex(0);
          loadFullSession(existingSession.id);
        } else {
          const initialSession: StudioSession = {
            id: initialSessionId || `sess-${Date.now()}`,
            filename: effectiveFilename,
            pdfData: safeCloneBytes(effectivePdfData),
            size: effectivePdfData.byteLength,
            pageCount: 1,
            annotations: [],
            currentPage: 1,
            zoom: 1.0,
            createdAt: Date.now(),
            lastModified: Date.now(),
            isUnsaved: false,
          };

          const combined = [initialSession, ...stored.filter((s) => s.id !== initialSession.id)];
          setSessions(combined);
          setActiveSessionId(initialSession.id);
          setAnnotations([]);
          setCurrentPage(1);
          setZoom(1.0);
          setHistory([[]]);
          setHistoryIndex(0);
          saveSessionToDB(initialSession);
        }
      } else if (stored.length > 0) {
        // Case 3: No PDF data passed, resume the latest saved session from DB
        const targetSession = stored[0];
        setSessions(stored);
        setActiveSessionId(targetSession.id);
        setAnnotations(targetSession.annotations || []);
        setCurrentPage(targetSession.currentPage || 1);
        setZoom(targetSession.zoom || 1.0);
        setHistory([targetSession.annotations || []]);
        setHistoryIndex(0);
        loadFullSession(targetSession.id);
      }
    }

    initSessions();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePdfData, effectiveFilename, initialSessionId]);

  // Current active session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Sessions list from the server only carries metadata (annotations, zoom, etc.)
  // — pdfData is fetched separately, once, the first time a session is actually
  // opened, and merged into `sessions` in place so tab-switching back to it is free.
  const loadFullSession = useCallback(
    async (id: string) => {
      const existing = sessions.find((s) => s.id === id);
      if (existing?.pdfData) return;
      if (fetchingSessionIdsRef.current.has(id)) return;
      fetchingSessionIdsRef.current.add(id);
      try {
        const full = await getSessionFromDB(id);
        if (full) {
          setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...full } : s)));
        }
      } finally {
        fetchingSessionIdsRef.current.delete(id);
      }
    },
    [sessions]
  );

  // Debounced Auto-Save to IndexedDB
  const triggerAutoSave = useCallback(
    (updatedAnnotations: Annotation[], pageNum: number, currentZoom: number) => {
      if (!activeSession) return;

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      setIsSaving(true);
      autoSaveTimerRef.current = setTimeout(async () => {
        const updatedSession: StudioSession = {
          ...activeSession,
          annotations: updatedAnnotations,
          currentPage: pageNum,
          zoom: currentZoom,
          lastModified: Date.now(),
          isUnsaved: false,
        };

        await saveSessionToDB(updatedSession);
        setSessions((prev) =>
          prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
        );
        setIsSaving(false);
        setLastSavedTime(Date.now());
      }, 600);
    },
    [activeSession]
  );

  // Push History & Trigger Auto-Save
  const pushHistory = useCallback(
    (newAnnotations: Annotation[]) => {
      setHistory((prev) => {
        const updated = prev.slice(0, historyIndex + 1);
        return [...updated, newAnnotations];
      });
      setHistoryIndex((prev) => prev + 1);
      setAnnotations(newAnnotations);
      triggerAutoSave(newAnnotations, currentPage, zoom);
    },
    [historyIndex, currentPage, zoom, triggerAutoSave]
  );

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setAnnotations(history[prevIdx]);
      setSelectedId(null);
      triggerAutoSave(history[prevIdx], currentPage, zoom);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setAnnotations(history[nextIdx]);
      setSelectedId(null);
      triggerAutoSave(history[nextIdx], currentPage, zoom);
    }
  };

  // Switch Active Session
  const handleSelectSession = (id: string) => {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;

    pdfDocRef.current = null;
    setActiveSessionId(id);
    setAnnotations(target.annotations || []);
    setCurrentPage(target.currentPage || 1);
    setZoom(target.zoom || 1.0);
    setHistory([target.annotations || []]);
    setHistoryIndex(0);
    setSelectedId(null);
    loadFullSession(id);
  };

  // Close Session Tab
  const handleCloseSession = async (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length > 0) {
      setSessions(remaining);
      if (activeSessionId === id) {
        handleSelectSession(remaining[0].id);
      }
    }
  };

  // Open New Document in New Tab
  const handleNewSessionUpload = async (file: File) => {
    const arrayBuf = await fileToArrayBuffer(file);
    const newSession: StudioSession = {
      id: `sess-${Date.now()}`,
      filename: file.name,
      pdfData: safeCloneBytes(arrayBuf),
      size: file.size,
      pageCount: 1,
      annotations: [],
      currentPage: 1,
      zoom: 1.0,
      createdAt: Date.now(),
      lastModified: Date.now(),
      isUnsaved: false,
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    await saveSessionToDB(newSession);
    handleSelectSession(newSession.id);
  };

  // Delete Draft from DB
  const handleDeleteSession = async (id: string) => {
    await deleteSessionFromDB(id);
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id && updated.length > 0) {
      handleSelectSession(updated[0].id);
    }
  };

  // Clear All Drafts
  const handleClearAllSessions = async () => {
    await clearAllSessionsFromDB();
    if (activeSession) {
      setSessions([activeSession]);
      await saveSessionToDB(activeSession);
    }
  };

  // Keyboard Shortcuts (Undo, Redo, Delete, Select)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        const selected = annotations.find((a) => a.id === selectedId);
        if (selected) handleDuplicateAnnotation(selected);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          const updated = annotations.filter((a) => a.id !== selectedId);
          pushHistory(updated);
          setSelectedId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, annotations, historyIndex, history, pushHistory]);

  // Load PDF & Thumbnails when active session changes
  useEffect(() => {
    let isMounted = true;
    async function loadDoc() {
      if (!activeSession?.pdfData) {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        const pdfjs = await getPdfJs();
        if (!pdfjs) return;

        const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(activeSession.pdfData) }).promise;
        if (!isMounted) return;

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);
        const thumbs = await renderAllPageThumbnails(activeSession.pdfData, 50, 0.35);
        if (!isMounted) return;

        setThumbnails(
          thumbs.map((t) => ({
            pageNumber: t.pageNumber,
            dataUrl: t.dataUrl,
            rotation: 0,
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setLoading(false);
      }
    }

    loadDoc();
    return () => {
      isMounted = false;
    };
  }, [activeSession?.id, activeSession?.pdfData]);

  // Render current page to canvas when currentPage or zoom or pageRotations change
  useEffect(() => {
    let isMounted = true;
    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas || !activeSession?.pdfData) return;

      const pdfjs = await getPdfJs();
      if (!pdfjs) return;

      try {
        let pdfDoc = pdfDocRef.current;
        if (!pdfDoc) {
          pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(activeSession.pdfData) }).promise;
          pdfDocRef.current = pdfDoc;
        }

        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;

        const currentRot = (pageRotations[currentPage - 1] || 0) % 360;

        // Base 1.0 viewport defines canonical PDF points (1/72 inch)
        const baseViewport = page.getViewport({ scale: 1.0, rotation: currentRot });
        const baseWidth = baseViewport.width;
        const baseHeight = baseViewport.height;

        // Store true unscaled PDF dimensions in pageViewports
        setPageViewports((prev) => ({
          ...prev,
          [currentPage - 1]: { width: baseWidth, height: baseHeight },
        }));

        // Render high-DPI crisp canvas for Retina / high-res displays
        const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 2, 2.5) : 2;
        const renderViewport = page.getViewport({ scale: zoom * dpr, rotation: currentRot });
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${baseWidth * zoom}px`;
        canvas.style.height = `${baseHeight * zoom}px`;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport: renderViewport,
          canvas,
        } as any).promise;
      } catch (err) {
        console.error('Render error:', err);
      }
    }

    renderPage();
    return () => {
      isMounted = false;
    };
  }, [activeSession?.pdfData, currentPage, zoom, pageRotations]);

  // Canvas Mouse Coordinates relative to current page container (in canonical unscaled PDF points)
  const getCoordinates = (e: React.MouseEvent<any> | { clientX: number; clientY: number }) => {
    const overlay = overlayRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const rect = overlay.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  // Start Tool Interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select') {
      setSelectedId(null);
      return;
    }
    if (activeTool === 'hand') return;

    const { x, y } = getCoordinates(e);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setIsDrawing(true);
      setCurrentPoints([{ x, y }]);
    } else if (['rectangle', 'circle', 'line', 'arrow', 'redact'].includes(activeTool)) {
      setIsDrawing(true);
      setDragStart({ x, y });
    } else if (activeTool === 'text') {
      const newTextAnn: TextAnnotation = {
        id: `text-${Date.now()}`,
        type: 'text',
        pageIndex: currentPage - 1,
        x,
        y,
        width: 140,
        height: 36,
        text: 'Type text here...',
        fontSize: currentFontSize,
        fontFamily: 'sans',
        color: currentColor,
        backgroundColor: 'transparent',
      };
      const updated = [...annotations, newTextAnn];
      pushHistory(updated);
      setSelectedId(newTextAnn.id);
      setActiveTool('select');
    }
  };

  // Start Resizing Handle Interaction
  const handleStartResize = (
    e: React.MouseEvent,
    ann: Annotation,
    handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setSelectedId(ann.id);
    const coords = getCoordinates(e);
    setResizeState({
      handle,
      startMouseX: coords.x,
      startMouseY: coords.y,
      startX: ann.x,
      startY: ann.y,
      startWidth: ann.width || (ann.type === 'text' ? 140 : 100),
      startHeight: ann.height || (ann.type === 'text' ? 36 : 40),
      startFontSize: (ann as TextAnnotation).fontSize || currentFontSize || 16,
    });
  };

  // Mouse Move Interaction (Drawing, Dragging, and 8-point Resizing)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isResizing && selectedId && resizeState) {
      const coords = getCoordinates(e);
      const dx = coords.x - resizeState.startMouseX;
      const dy = coords.y - resizeState.startMouseY;
      const { handle, startX, startY, startWidth, startHeight, startFontSize } = resizeState;

      let newX = startX;
      let newY = startY;
      let newW = startWidth;
      let newH = startHeight;
      let newFontSize = startFontSize;

      // Handle horizontal sizing
      if (handle.includes('e')) {
        newW = Math.max(20, Math.round(startWidth + dx));
      }
      if (handle.includes('w')) {
        newW = Math.max(20, Math.round(startWidth - dx));
        newX = Math.round(startX + (startWidth - newW));
      }

      // Handle vertical sizing
      if (handle.includes('s')) {
        newH = Math.max(12, Math.round(startHeight + dy));
      }
      if (handle.includes('n')) {
        newH = Math.max(12, Math.round(startHeight - dy));
        newY = Math.round(startY + (startHeight - newH));
      }

      // Proportional font scaling for Text when dragging corner handles
      const currentAnn = annotations.find((a) => a.id === selectedId);
      if (currentAnn?.type === 'text' && ['nw', 'ne', 'se', 'sw'].includes(handle) && startHeight > 0) {
        const ratio = newH / startHeight;
        newFontSize = Math.max(8, Math.min(144, Math.round(startFontSize * ratio)));
      }

      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id === selectedId) {
            const updated = { ...a, x: newX, y: newY, width: newW, height: newH };
            if (a.type === 'text') {
              (updated as TextAnnotation).fontSize = newFontSize;
            }
            return updated;
          }
          return a;
        })
      );
      return;
    }

    if (!isDrawing) {
      if (isDraggingAnnotation && selectedId) {
        const { x, y } = getCoordinates(e);
        const updated = annotations.map((ann) => {
          if (ann.id === selectedId) {
            return {
              ...ann,
              x: Math.round(x - dragOffset.x),
              y: Math.round(y - dragOffset.y),
            };
          }
          return ann;
        });
        setAnnotations(updated);
      }
      return;
    }

    const { x, y } = getCoordinates(e);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setCurrentPoints((prev) => [...prev, { x, y }]);
    }
  };

  // Mouse Up Interaction
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isResizing) {
      setIsResizing(false);
      setResizeState(null);
      pushHistory(annotations);
      return;
    }

    if (isDraggingAnnotation) {
      setIsDraggingAnnotation(false);
      pushHistory(annotations);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    const { x, y } = getCoordinates(e);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      if (currentPoints.length > 1) {
        const newDrawAnn: DrawAnnotation = {
          id: `draw-${Date.now()}`,
          type: activeTool,
          pageIndex: currentPage - 1,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          points: currentPoints,
          color: currentColor,
          strokeWidth: activeTool === 'highlight' ? 14 : currentStrokeWidth,
          opacity: activeTool === 'highlight' ? 0.4 : 1.0,
        };
        const updated = [...annotations, newDrawAnn];
        pushHistory(updated);
      }
      setCurrentPoints([]);
    } else if (['rectangle', 'circle', 'line', 'arrow', 'redact'].includes(activeTool) && dragStart) {
      const isTinyDrag = Math.abs(x - dragStart.x) < 8 && Math.abs(y - dragStart.y) < 8;
      const width = isTinyDrag ? (activeTool === 'circle' ? 60 : 120) : Math.max(24, Math.abs(x - dragStart.x));
      const height = isTinyDrag ? (activeTool === 'circle' ? 60 : 50) : Math.max(16, Math.abs(y - dragStart.y));
      const startX = isTinyDrag ? dragStart.x : Math.min(x, dragStart.x);
      const startY = isTinyDrag ? dragStart.y : Math.min(y, dragStart.y);

      if (activeTool === 'redact') {
        const newRedactAnn: RedactAnnotation = {
          id: `redact-${Date.now()}`,
          type: 'redact',
          pageIndex: currentPage - 1,
          x: startX,
          y: startY,
          width,
          height,
          fillColor: '#000000',
        };
        const updated = [...annotations, newRedactAnn];
        pushHistory(updated);
        setSelectedId(newRedactAnn.id);
      } else {
        const newShapeAnn: ShapeAnnotation = {
          id: `shape-${Date.now()}`,
          type: activeTool as any,
          pageIndex: currentPage - 1,
          x: startX,
          y: startY,
          width,
          height,
          strokeColor: currentColor,
          fillColor: 'transparent',
          strokeWidth: currentStrokeWidth,
          opacity: 1,
        };
        const updated = [...annotations, newShapeAnn];
        pushHistory(updated);
        setSelectedId(newShapeAnn.id);
      }

      setDragStart(null);
      setActiveTool('select');
    }
  };

  // Duplicate Annotation
  const handleDuplicateAnnotation = (ann: Annotation) => {
    const newAnn = {
      ...ann,
      id: `${ann.type}-${Date.now()}`,
      x: ann.x + 20,
      y: ann.y + 20,
    };
    const updated = [...annotations, newAnn];
    pushHistory(updated);
    setSelectedId(newAnn.id);
  };

  // Add signature to current page
  const handleApplySignature = (dataUrl: string) => {
    const newSigAnn: ImageAnnotation = {
      id: `sig-${Date.now()}`,
      type: 'signature',
      pageIndex: currentPage - 1,
      x: 100,
      y: 100,
      width: 180,
      height: 70,
      dataUrl,
    };
    const updated = [...annotations, newSigAnn];
    pushHistory(updated);
    setSelectedId(newSigAnn.id);
    setActiveTool('select');
  };

  // Add AI-generated annotations to current page
  const handleApplyAiAnnotations = (newAnns: Annotation[]) => {
    const updated = [...annotations, ...newAnns];
    pushHistory(updated);
    if (newAnns.length > 0) {
      setSelectedId(newAnns[newAnns.length - 1].id);
    }
    setActiveTool('select');
  };

  // Export baked PDF
  const handleExport = async () => {
    if (!activeSession?.pdfData) return;

    try {
      setIsExporting(true);
      const bakedBytes = await exportAnnotatedPdf(activeSession.pdfData, annotations, pageViewports, pageRotations);
      const outName = activeSession.filename.replace(/\.pdf$/i, '') + '_edited.pdf';
      downloadBytes(bakedBytes, outName);
      setIsExporting(false);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Error exporting PDF. Please check console.');
      setIsExporting(false);
    }
  };

  const selectedAnnotation = annotations.find((a) => a.id === selectedId) || null;
  const currentPageAnnotations = annotations.filter((a) => a.pageIndex === currentPage - 1);

  const fontFamilyMap: Record<string, string> = {
    sans: 'Arial, Helvetica, "Nimbus Sans L", "Liberation Sans", sans-serif',
    serif: '"Times New Roman", Times, Georgia, "Nimbus Roman No9 L", serif',
    mono: '"Courier New", Courier, "Liberation Mono", Menlo, monospace',
    cursive: '"Brush Script MT", "Caveat", "Segoe Script", cursive',
    display: 'Impact, "Arial Black", sans-serif',
  };

  const renderTransformHandles = (ann: Annotation) => {
    const handles: { dir: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'; pos: string; cursor: string }[] = [
      { dir: 'nw', pos: '-top-1.5 -left-1.5', cursor: 'cursor-nwse-resize' },
      { dir: 'n', pos: '-top-1.5 left-1/2 -translate-x-1/2', cursor: 'cursor-ns-resize' },
      { dir: 'ne', pos: '-top-1.5 -right-1.5', cursor: 'cursor-nesw-resize' },
      { dir: 'e', pos: 'top-1/2 -right-1.5 -translate-y-1/2', cursor: 'cursor-ew-resize' },
      { dir: 'se', pos: '-bottom-1.5 -right-1.5', cursor: 'cursor-nwse-resize' },
      { dir: 's', pos: '-bottom-1.5 left-1/2 -translate-x-1/2', cursor: 'cursor-ns-resize' },
      { dir: 'sw', pos: '-bottom-1.5 -left-1.5', cursor: 'cursor-nesw-resize' },
      { dir: 'w', pos: 'top-1/2 -left-1.5 -translate-y-1/2', cursor: 'cursor-ew-resize' },
    ];

    return (
      <div className="absolute inset-0 pointer-events-none">
        {handles.map(({ dir, pos, cursor }) => (
          <div
            key={dir}
            onMouseDown={(e) => handleStartResize(e, ann, dir)}
            className={`pointer-events-auto absolute w-2.5 h-2.5 rounded-[2px] bg-white border-2 border-rose-500 shadow-md ${cursor} z-40 transition-transform hover:scale-125 ${pos}`}
            title={`Resize (${dir.toUpperCase()})`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden select-none">
      {/* Top Document Sessions Tabs Bar */}
      <SessionTabs
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCloseSession={handleCloseSession}
        onNewSessionUpload={handleNewSessionUpload}
        onOpenSessionDrawer={() => setSessionDrawerOpen(true)}
        onOpenShareModal={() => setCloudShareOpen(true)}
        isSaving={isSaving}
        lastSavedTime={lastSavedTime}
      />

      {/* Top Main Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onToolSelect={setActiveTool}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(2.5, z + 0.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.15))}
        onOpenSignatureModal={() => setSignatureModalOpen(true)}
        onOpenAiModal={() => setAiModalOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Property Inspector Bar */}
      <PropertyBar
        selectedAnnotation={selectedAnnotation}
        onUpdateAnnotation={(updated) => {
          if (!selectedId) return;
          const newAnns = annotations.map((a) => (a.id === selectedId ? { ...a, ...updated } : a));
          pushHistory(newAnns as any);
        }}
        onDeleteAnnotation={(id) => {
          const newAnns = annotations.filter((a) => a.id !== id);
          pushHistory(newAnns);
          setSelectedId(null);
        }}
        onDuplicateAnnotation={handleDuplicateAnnotation}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        currentStrokeWidth={currentStrokeWidth}
        onStrokeWidthChange={setCurrentStrokeWidth}
        currentFontSize={currentFontSize}
        onFontSizeChange={setCurrentFontSize}
        activeTool={activeTool}
      />

      {/* Main Workspace Area (Sidebar + Canvas Viewport) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Page Thumbnails Sidebar */}
        <ThumbnailSidebar
          thumbnails={thumbnails}
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          onRotatePage={(p) => {
            setThumbnails((prev) =>
              prev.map((t) => (t.pageNumber === p ? { ...t, rotation: (t.rotation + 90) % 360 } : t))
            );
            setPageRotations((prev) => ({
              ...prev,
              [p - 1]: ((prev[p - 1] || 0) + 90) % 360,
            }));
          }}
          onDeletePage={(p) => {
            if (thumbnails.length > 1) {
              setThumbnails((prev) => prev.filter((t) => t.pageNumber !== p));
              if (currentPage === p) setCurrentPage(1);
            }
          }}
        />

        {/* Center Canvas Viewport */}
        <div className="flex-1 overflow-auto p-6 sm:p-12 flex justify-center items-start bg-zinc-200/80 dark:bg-zinc-950/90 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
              <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold">Rendering Document...</span>
            </div>
          ) : (
            <div
              ref={overlayRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="relative shadow-2xl rounded-sm bg-white overflow-hidden"
              style={{
                width: `${(pageViewports[currentPage - 1]?.width || 612) * zoom}px`,
                height: `${(pageViewports[currentPage - 1]?.height || 792) * zoom}px`,
                cursor:
                  activeTool === 'select'
                    ? 'default'
                    : activeTool === 'hand'
                    ? 'grab'
                    : 'crosshair',
              }}
            >
              {/* PDF.js Render Canvas */}
              <canvas ref={canvasRef} className="block pointer-events-none" />

              {/* Interactive Vector Annotation Layer */}
              <svg
                viewBox={`0 0 ${pageViewports[currentPage - 1]?.width || 612} ${pageViewports[currentPage - 1]?.height || 792}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                {/* Freehand Ink and Highlights */}
                {currentPageAnnotations.map((ann) => {
                  if (ann.type === 'draw' || ann.type === 'highlight') {
                    const pts = ann.points.map((p) => `${p.x},${p.y}`).join(' ');
                    return (
                      <polyline
                        key={ann.id}
                        points={pts}
                        fill="none"
                        stroke={ann.color}
                        strokeWidth={ann.strokeWidth}
                        strokeOpacity={ann.opacity ?? 1}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  }
                  return null;
                })}

                {/* Active drawing stroke */}
                {isDrawing && (activeTool === 'draw' || activeTool === 'highlight') && currentPoints.length > 1 && (
                  <polyline
                    points={currentPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={currentColor}
                    strokeWidth={activeTool === 'highlight' ? 14 : currentStrokeWidth}
                    strokeOpacity={activeTool === 'highlight' ? 0.4 : 1.0}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>

              {/* DOM Annotation Objects (Text, Shapes, Redactions, Signatures) */}
              {currentPageAnnotations.map((ann) => {
                const isSelected = selectedId === ann.id;

                if (ann.type === 'text') {
                  const textAnn = ann as TextAnnotation;
                  const fontFam = fontFamilyMap[textAnn.fontFamily || 'sans'] || fontFamilyMap.sans;
                  const textDec = [textAnn.underline && 'underline', textAnn.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none';
                  const hasCustomBg = textAnn.backgroundColor && textAnn.backgroundColor !== 'transparent';
                  const hasCustomBorder = textAnn.borderStyle && textAnn.borderStyle !== 'none';
                  const customBorder = hasCustomBorder 
                    ? `${(textAnn.borderWidth || 1) * zoom}px ${textAnn.borderStyle} ${textAnn.borderColor || textAnn.color}`
                    : 'none';
                  const currentFontPx = (textAnn.fontSize || 16) * zoom;
                  const padY = (hasCustomBg || hasCustomBorder) ? 2 * zoom : 0;
                  const padX = (hasCustomBg || hasCustomBorder) ? 4 * zoom : 0;
                  const widthPx = ann.width ? ann.width * zoom : undefined;
                  const heightPx = ann.height ? ann.height * zoom : undefined;

                  return (
                    <div
                      key={ann.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(ann.id);
                      }}
                      onMouseDown={(e) => {
                        if (activeTool === 'select') {
                          e.stopPropagation();
                          setSelectedId(ann.id);
                          setIsDraggingAnnotation(true);
                          const coords = getCoordinates(e);
                          setDragOffset({ x: coords.x - ann.x, y: coords.y - ann.y });
                        }
                      }}
                      style={{
                        position: 'absolute',
                        left: `${ann.x * zoom}px`,
                        top: `${ann.y * zoom}px`,
                        width: widthPx ? `${widthPx}px` : undefined,
                        minWidth: `${30 * zoom}px`,
                        height: heightPx ? `${heightPx}px` : undefined,
                        color: textAnn.color,
                        fontFamily: fontFam,
                        fontSize: `${currentFontPx}px`,
                        lineHeight: 1.15,
                        fontWeight: textAnn.bold ? 'bold' : 'normal',
                        fontStyle: textAnn.italic ? 'italic' : 'normal',
                        textDecoration: textDec,
                        textAlign: textAnn.textAlign || 'left',
                        textTransform: textAnn.textTransform || 'none',
                        backgroundColor: hasCustomBg ? textAnn.backgroundColor : 'transparent',
                        border: customBorder,
                        borderRadius: `${(textAnn.borderRadius || 0) * zoom}px`,
                        opacity: textAnn.opacity ?? 1,
                        padding: `${padY}px ${padX}px`,
                        boxSizing: 'border-box',
                      }}
                      className={`cursor-move transition-all group ${
                        isSelected
                          ? 'ring-1 ring-dashed ring-rose-500 ring-offset-1 dark:ring-offset-zinc-950'
                          : 'hover:ring-1 hover:ring-dashed hover:ring-zinc-400/40'
                      }`}
                    >
                      <input
                        type="text"
                        value={textAnn.text}
                        placeholder="Type text..."
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === ann.id ? { ...a, text: val } : a))
                          );
                        }}
                        onBlur={() => pushHistory(annotations)}
                        style={{
                          color: 'inherit',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          fontStyle: 'inherit',
                          textDecoration: 'inherit',
                          textAlign: 'inherit',
                          textTransform: 'inherit',
                          lineHeight: 'inherit',
                          width: widthPx ? '100%' : `${Math.max(40 * zoom, (textAnn.text.length + 1) * (currentFontPx * 0.6))}px`,
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          padding: 0,
                          margin: 0,
                        }}
                        className="p-0 m-0 bg-transparent border-none outline-none"
                      />

                      {isSelected && renderTransformHandles(ann)}
                    </div>
                  );
                }

                if (ann.type === 'rectangle' || ann.type === 'redact') {
                  return (
                    <div
                      key={ann.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(ann.id);
                      }}
                      onMouseDown={(e) => {
                        if (activeTool === 'select') {
                          e.stopPropagation();
                          setSelectedId(ann.id);
                          setIsDraggingAnnotation(true);
                          const coords = getCoordinates(e);
                          setDragOffset({ x: coords.x - ann.x, y: coords.y - ann.y });
                        }
                      }}
                      style={{
                        position: 'absolute',
                        left: `${ann.x * zoom}px`,
                        top: `${ann.y * zoom}px`,
                        width: `${ann.width * zoom}px`,
                        height: `${ann.height * zoom}px`,
                        backgroundColor: ann.type === 'redact' ? '#000000' : (ann as any).fillColor || 'transparent',
                        borderColor: ann.type === 'redact' ? '#000000' : (ann as any).strokeColor,
                        borderWidth: `${((ann as any).strokeWidth || 2) * zoom}px`,
                        boxSizing: 'border-box',
                      }}
                      className={`cursor-move ${
                        isSelected ? 'ring-2 ring-rose-500 shadow-lg' : 'hover:ring-1 hover:ring-zinc-400'
                      }`}
                    >
                      {isSelected && renderTransformHandles(ann)}
                    </div>
                  );
                }

                if (ann.type === 'circle') {
                  return (
                    <div
                      key={ann.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(ann.id);
                      }}
                      onMouseDown={(e) => {
                        if (activeTool === 'select') {
                          e.stopPropagation();
                          setSelectedId(ann.id);
                          setIsDraggingAnnotation(true);
                          const coords = getCoordinates(e);
                          setDragOffset({ x: coords.x - ann.x, y: coords.y - ann.y });
                        }
                      }}
                      style={{
                        position: 'absolute',
                        left: `${ann.x * zoom}px`,
                        top: `${ann.y * zoom}px`,
                        width: `${ann.width * zoom}px`,
                        height: `${ann.height * zoom}px`,
                        borderRadius: '9999px',
                        borderColor: (ann as any).strokeColor,
                        borderWidth: `${((ann as any).strokeWidth || 2) * zoom}px`,
                        backgroundColor: (ann as any).fillColor || 'transparent',
                        boxSizing: 'border-box',
                      }}
                      className={`cursor-move ${
                        isSelected ? 'ring-2 ring-rose-500 shadow-lg' : 'hover:ring-1 hover:ring-zinc-400'
                      }`}
                    >
                      {isSelected && renderTransformHandles(ann)}
                    </div>
                  );
                }

                if (ann.type === 'signature' || ann.type === 'image' || ann.type === 'stamp') {
                  return (
                    <div
                      key={ann.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(ann.id);
                      }}
                      onMouseDown={(e) => {
                        if (activeTool === 'select') {
                          e.stopPropagation();
                          setSelectedId(ann.id);
                          setIsDraggingAnnotation(true);
                          const coords = getCoordinates(e);
                          setDragOffset({ x: coords.x - ann.x, y: coords.y - ann.y });
                        }
                      }}
                      style={{
                        position: 'absolute',
                        left: `${ann.x * zoom}px`,
                        top: `${ann.y * zoom}px`,
                        width: `${ann.width * zoom}px`,
                        height: `${ann.height * zoom}px`,
                        boxSizing: 'border-box',
                      }}
                      className={`cursor-move p-1 ${
                        isSelected ? 'ring-2 ring-rose-500 shadow-xl bg-rose-50/20 rounded' : 'hover:ring-1 hover:ring-zinc-400'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={(ann as any).dataUrl}
                        alt="Annotation asset"
                        className="w-full h-full object-contain pointer-events-none"
                      />

                      {isSelected && renderTransformHandles(ann)}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Signature Creation Modal */}
      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onApplySignature={handleApplySignature}
      />

      {/* Workspace Sessions & Drafts Drawer */}
      <SessionDrawer
        isOpen={sessionDrawerOpen}
        onClose={() => setSessionDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
      />

      {/* Cloud Share & Workspace Modal */}
      <CloudShareModal
        isOpen={cloudShareOpen}
        onClose={() => setCloudShareOpen(false)}
        session={activeSession}
      />

      {/* AI Page Assistant Modal (Auto-Fill & Prompt-to-Edit) */}
      <AiPageAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        pageCanvasRef={canvasRef}
        currentPage={currentPage}
        viewportSize={pageViewports[currentPage - 1] || { width: 612, height: 792 }}
        onApplyAnnotations={handleApplyAiAnnotations}
      />
    </div>
  );
}
