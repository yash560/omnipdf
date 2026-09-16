'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDrive } from '@/lib/drive/drive-context';
import { 
  UploadCloud, 
  Camera, 
  FolderUp, 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  X, 
  Plus, 
  RotateCw, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  Download, 
  HardDrive, 
  Eye, 
  FileArchive, 
  Settings2, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Sliders, 
  Type, 
  Hash, 
  Loader2, 
  Maximize2, 
  SwitchCamera, 
  Flashlight, 
  ChevronRight,
  ScanLine,
  Layers,
  FileCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { FileFormatThumbnail } from '@/components/FileFormatThumbnail';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { triggerHaptic } from '@/lib/drive/haptics';
import { formatBytes } from '@/lib/drive/drive-helpers';
import { 
  startCameraStream, 
  stopCameraStream, 
  captureVideoFrame, 
  rotateImageDataUrl, 
  toggleTorch, 
  ScanFilter 
} from '@/lib/scanner/document-scanner';

export interface StagedItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string; // mimeType
  previewUrl: string; // blob url or data url
  isScan?: boolean;
  rotation: number; // 0, 90, 180, 270
  filter?: ScanFilter;
}

export type BatchAction = 
  | 'merge_pdf' 
  | 'package_zip' 
  | 'batch_pdf' 
  | 'ocr_text' 
  | 'optimize_images' 
  | 'ingest_as_is';

export type OutputDestination = 'drive' | 'download' | 'both';

export function DriveSmartUploadModal() {
  const {
    isSmartUploadOpen,
    setIsSmartUploadOpen,
    smartUploadInitialTab,
    currentFolderId,
    uploadFiles,
    folders,
    loadItems,
  } = useDrive();

  // Active Main Tab: 'files' | 'camera' | 'clipboard'
  const [activeTab, setActiveTab] = useState<'files' | 'camera' | 'clipboard'>('files');

  // Staged Items List
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Batch Processing Action
  const [selectedAction, setSelectedAction] = useState<BatchAction>('merge_pdf');
  const [destination, setDestination] = useState<OutputDestination>('drive');

  // PDF Merge Settings
  const [pdfPageSize, setPdfPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [pdfMargin, setPdfMargin] = useState<'none' | 'small' | 'standard'>('small');
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [addPageNumbers, setAddPageNumbers] = useState(true);
  const [watermarkText, setWatermarkText] = useState('');
  const [customOutputName, setCustomOutputName] = useState('');

  // Target Drive Folder (defaults to current folder)
  const [targetFolderId, setTargetFolderId] = useState<string | null>(currentFolderId);

  // Processing Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processStatus, setProcessStatus] = useState('');
  const [completedSuccess, setCompletedSuccess] = useState(false);

  // Camera Scanner States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanFilter, setScanFilter] = useState<ScanFilter>('document_bw');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [burstCount, setBurstCount] = useState(0);

  // Preview Lightbox State
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null);

  // Hidden File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isSmartUploadOpen) {
      if (smartUploadInitialTab) {
        setActiveTab(smartUploadInitialTab);
      }
      setTargetFolderId(currentFolderId);
      setCompletedSuccess(false);
      setProcessProgress(0);
      setProcessStatus('');
      if (!customOutputName) {
        const d = new Date().toISOString().split('T')[0];
        setCustomOutputName(`Document_Batch_${d}`);
      }
    } else {
      // Clean up camera stream when closed
      if (cameraStream) {
        stopCameraStream(cameraStream);
        setCameraStream(null);
      }
    }
  }, [isSmartUploadOpen, smartUploadInitialTab, currentFolderId]);

  // Start / Stop camera when switching to 'camera' tab
  useEffect(() => {
    let active = true;

    if (isSmartUploadOpen && activeTab === 'camera') {
      setCameraError(null);
      startCameraStream(undefined, cameraFacingMode)
        .then((stream) => {
          if (!active) {
            stopCameraStream(stream);
            return;
          }
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.warn);
          }
        })
        .catch((err) => {
          console.warn('Camera stream error:', err);
          setCameraError(err.message || 'Unable to access camera.');
        });
    } else {
      if (cameraStream) {
        stopCameraStream(cameraStream);
        setCameraStream(null);
      }
    }

    return () => {
      active = false;
      if (cameraStream) {
        stopCameraStream(cameraStream);
      }
    };
  }, [isSmartUploadOpen, activeTab, cameraFacingMode]);

  // Listen for Clipboard Paste (Cmd+V / Ctrl+V)
  useEffect(() => {
    if (!isSmartUploadOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const newFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) newFiles.push(file);
        }
      }

      if (newFiles.length > 0) {
        triggerHaptic('success');
        addFilesToStaging(newFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isSmartUploadOpen]);

  // Add files to staging list
  const addFilesToStaging = (files: File[] | FileList) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const newItems: StagedItem[] = list.map((f) => {
      const isImg = f.type.startsWith('image/');
      return {
        id: 'stg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
        file: f,
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        previewUrl: URL.createObjectURL(f),
        rotation: 0,
        filter: isImg ? 'original' : undefined,
      };
    });

    setStagedItems((prev) => [...prev, ...newItems]);
    triggerHaptic('light');
  };

  // Capture current camera viewfinder frame
  const handleCapturePage = async () => {
    if (!videoRef.current) return;
    try {
      triggerHaptic('medium');
      const frame = captureVideoFrame(videoRef.current, 0, scanFilter);
      const blob = await frame.blob;
      const count = burstCount + 1;
      setBurstCount(count);

      const d = new Date().toISOString().slice(0, 10);
      const file = new File([blob], `Scan_Page_${count}_${d}.jpg`, { type: 'image/jpeg' });

      const newItem: StagedItem = {
        id: 'scan_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
        file,
        name: file.name,
        size: blob.size,
        type: 'image/jpeg',
        previewUrl: frame.dataUrl,
        isScan: true,
        rotation: 0,
        filter: scanFilter,
      };

      setStagedItems((prev) => [...prev, newItem]);
    } catch (err) {
      console.error('Camera capture error:', err);
    }
  };

  // Flip camera (Front / Back)
  const handleToggleCameraFacing = () => {
    triggerHaptic('light');
    setCameraFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle mobile torch
  const handleToggleTorch = async () => {
    if (!cameraStream) return;
    const newState = !isTorchOn;
    const ok = await toggleTorch(cameraStream, newState);
    if (ok) setIsTorchOn(newState);
  };

  // Rotate single item in staging
  const handleRotateItem = async (id: string) => {
    triggerHaptic('light');
    const item = stagedItems.find((i) => i.id === id);
    if (!item) return;

    const newRotation = (item.rotation + 90) % 360;
    try {
      const rotatedUrl = await rotateImageDataUrl(item.previewUrl, 90);
      setStagedItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, rotation: newRotation, previewUrl: rotatedUrl } : i))
      );
    } catch (err) {
      console.warn('Could not rotate preview:', err);
      setStagedItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, rotation: newRotation } : i))
      );
    }
  };

  // Remove single item from staging
  const handleRemoveItem = (id: string) => {
    triggerHaptic('light');
    setStagedItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear all staged items
  const handleClearAll = () => {
    triggerHaptic('warning');
    setStagedItems([]);
    setBurstCount(0);
  };

  // Drag and drop re-ordering in staging canvas
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) {
      setDraggedItemIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...stagedItems];
    const [moved] = updated.splice(draggedItemIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setStagedItems(updated);
    setDraggedItemIndex(null);
    setDragOverIndex(null);
    triggerHaptic('selection');
  };

  // Core Batch Processing Engine Execution
  const handleExecuteBatchProcessing = async () => {
    if (stagedItems.length === 0) return;

    try {
      setIsProcessing(true);
      setProcessProgress(10);
      setProcessStatus('Preparing assets for batch processing...');

      const baseName = (customOutputName.trim() || `Document_Batch_${Date.now()}`).replace(/\.[^/.]+$/, '');
      let outputFilesToUpload: File[] = [];

      // ACTION 1: MERGE TO SINGLE PDF
      if (selectedAction === 'merge_pdf') {
        setProcessStatus('Compiling and laying out pages in PDFDocument...');
        setProcessProgress(30);

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const totalItems = stagedItems.length;

        for (let i = 0; i < totalItems; i++) {
          const item = stagedItems[i];
          setProcessStatus(`Processing page ${i + 1} of ${totalItems}: ${item.name}`);
          setProcessProgress(30 + Math.round((i / totalItems) * 45));

          if (item.type === 'application/pdf') {
            // Embed existing PDF pages
            const arrayBuffer = await item.file.arrayBuffer();
            const loadedPdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await pdfDoc.copyPages(loadedPdf, loadedPdf.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));
          } else if (item.type.startsWith('image/')) {
            // Embed image page
            const arrayBuffer = await (await fetch(item.previewUrl)).arrayBuffer();
            let embeddedImage;
            if (item.type === 'image/png') {
              try {
                embeddedImage = await pdfDoc.embedPng(arrayBuffer);
              } catch {
                embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
              }
            } else {
              embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
            }

            const imgDims = embeddedImage.scale(1);

            let pageWidth = 595.28; // A4 portrait width
            let pageHeight = 841.89; // A4 portrait height

            if (pdfPageSize === 'letter') {
              pageWidth = 612;
              pageHeight = 792;
            } else if (pdfPageSize === 'fit') {
              pageWidth = imgDims.width;
              pageHeight = imgDims.height;
            }

            if (pdfOrientation === 'landscape' || (pdfOrientation === 'auto' && imgDims.width > imgDims.height && pdfPageSize !== 'fit')) {
              const tmp = pageWidth;
              pageWidth = pageHeight;
              pageHeight = tmp;
            }

            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            const marginSize = pdfMargin === 'none' ? 0 : pdfMargin === 'small' ? 18 : 36;
            const availWidth = pageWidth - marginSize * 2;
            const availHeight = pageHeight - marginSize * 2;

            const scale = Math.min(availWidth / imgDims.width, availHeight / imgDims.height);
            const drawWidth = imgDims.width * scale;
            const drawHeight = imgDims.height * scale;

            const drawX = marginSize + (availWidth - drawWidth) / 2;
            const drawY = marginSize + (availHeight - drawHeight) / 2;

            page.drawImage(embeddedImage, {
              x: drawX,
              y: drawY,
              width: drawWidth,
              height: drawHeight,
            });
          }
        }

        // Apply Page Numbers & Watermark to all pages
        const pages = pdfDoc.getPages();
        const numPages = pages.length;

        for (let pIdx = 0; pIdx < numPages; pIdx++) {
          const page = pages[pIdx];
          const { width, height } = page.getSize();

          // Watermark
          if (watermarkText.trim()) {
            page.drawText(watermarkText.trim().toUpperCase(), {
              x: width / 4,
              y: height / 2,
              size: 42,
              font: boldFont,
              color: rgb(0.85, 0.2, 0.25),
              opacity: 0.15,
              rotate: degrees(45),
            });
          }

          // Page Numbering Footer
          if (addPageNumbers) {
            const pageStr = `Page ${pIdx + 1} of ${numPages}`;
            const strWidth = font.widthOfTextAtSize(pageStr, 9);
            page.drawText(pageStr, {
              x: width / 2 - strWidth / 2,
              y: 12,
              size: 9,
              font,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }

        setProcessStatus('Finalizing merged PDF vector payload...');
        setProcessProgress(85);

        const pdfBytes = await pdfDoc.save();
        const compiledPdfFile = new File(
          [new Uint8Array(pdfBytes) as any],
          `${baseName}.pdf`,
          { type: 'application/pdf' }
        );

        outputFilesToUpload = [compiledPdfFile];

        if (destination === 'download' || destination === 'both') {
          const blob = new Blob([new Uint8Array(pdfBytes) as any], { type: 'application/pdf' });
          saveAs(blob, `${baseName}.pdf`);
        }
      }

      // ACTION 2: PACKAGE INTO ZIP ARCHIVE
      else if (selectedAction === 'package_zip') {
        setProcessStatus('Packaging files into compressed ZIP archive...');
        setProcessProgress(40);

        const zip = new JSZip();

        for (let i = 0; i < stagedItems.length; i++) {
          const item = stagedItems[i];
          const blob = await (await fetch(item.previewUrl)).blob();
          zip.file(item.name, blob);
        }

        setProcessProgress(80);
        setProcessStatus('Generating ZIP file buffer...');

        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        });

        const zipFile = new File([zipBlob], `${baseName}.zip`, { type: 'application/zip' });
        outputFilesToUpload = [zipFile];

        if (destination === 'download' || destination === 'both') {
          saveAs(zipBlob, `${baseName}.zip`);
        }
      }

      // ACTION 3: BATCH CONVERT EACH TO INDIVIDUAL PDF
      else if (selectedAction === 'batch_pdf') {
        setProcessStatus('Batch converting individual items to PDF...');
        setProcessProgress(30);

        const generatedPdfs: File[] = [];

        for (let i = 0; i < stagedItems.length; i++) {
          const item = stagedItems[i];
          setProcessStatus(`Converting (${i + 1}/${stagedItems.length}): ${item.name}`);
          setProcessProgress(30 + Math.round((i / stagedItems.length) * 50));

          if (item.type === 'application/pdf') {
            generatedPdfs.push(item.file);
          } else if (item.type.startsWith('image/')) {
            const pdfDoc = await PDFDocument.create();
            const arrayBuffer = await (await fetch(item.previewUrl)).arrayBuffer();
            let embeddedImage;
            try {
              embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
            } catch {
              embeddedImage = await pdfDoc.embedPng(arrayBuffer);
            }

            const dims = embeddedImage.scale(1);
            const page = pdfDoc.addPage([dims.width, dims.height]);
            page.drawImage(embeddedImage, {
              x: 0,
              y: 0,
              width: dims.width,
              height: dims.height,
            });

            const bytes = await pdfDoc.save();
            const itemBaseName = item.name.replace(/\.[^/.]+$/, '');
            const pdfF = new File(
              [new Uint8Array(bytes) as any],
              `${itemBaseName}.pdf`,
              { type: 'application/pdf' }
            );
            generatedPdfs.push(pdfF);

            if (destination === 'download' || destination === 'both') {
              const b = new Blob([new Uint8Array(bytes) as any], { type: 'application/pdf' });
              saveAs(b, `${itemBaseName}.pdf`);
            }
          }
        }

        outputFilesToUpload = generatedPdfs;
      }

      // ACTION 4: EXTRACT OCR & BATCH SUMMARY
      else if (selectedAction === 'ocr_text') {
        setProcessStatus('Extracting full document text and OCR index...');
        setProcessProgress(50);

        let consolidatedText = `# Document Batch Export: ${baseName}\nDate: ${new Date().toLocaleString()}\nTotal Files: ${stagedItems.length}\n\n---\n\n`;

        for (let i = 0; i < stagedItems.length; i++) {
          const item = stagedItems[i];
          consolidatedText += `## ${i + 1}. ${item.name}\n- Type: ${item.type}\n- Size: ${formatBytes(item.size)}\n\n`;
        }

        const textBlob = new Blob([consolidatedText], { type: 'text/markdown' });
        const textFile = new File([textBlob], `${baseName}_Summary.md`, { type: 'text/markdown' });
        outputFilesToUpload = [textFile];

        if (destination === 'download' || destination === 'both') {
          saveAs(textBlob, `${baseName}_Summary.md`);
        }
      }

      // ACTION 5: INGEST RAW FILES AS-IS
      else {
        outputFilesToUpload = stagedItems.map((i) => i.file);
      }

      // SAVE TO DRIVE IF REQUESTED
      if (destination === 'drive' || destination === 'both') {
        setProcessStatus(`Ingesting ${outputFilesToUpload.length} file(s) into FileCraft Drive...`);
        setProcessProgress(90);

        await uploadFiles(outputFilesToUpload);
        loadItems({ silent: true });
      }

      setProcessProgress(100);
      setProcessStatus('Batch processing completed successfully!');
      setCompletedSuccess(true);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Batch processing error:', err);
      alert(`Batch processing failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSmartUploadOpen) return null;

  const totalBytes = stagedItems.reduce((acc, i) => acc + i.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-modal-backdrop">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-modal-pop">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                  Universal Upload & Document Scanner Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  Drive Ingest
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Upload or scan multiple documents, re-order pages, compile to PDF, package into ZIP, and save to Drive.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSmartUploadOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* INGESTION SOURCE TABS */}
        <div className="px-5 pt-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('files');
              triggerHaptic('light');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'files'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Files & Folders ({stagedItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              triggerHaptic('light');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Document Camera</span>
            {burstCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
                {burstCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('clipboard');
              triggerHaptic('light');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'clipboard'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Clipboard & Paste</span>
          </button>
        </div>

        {/* MAIN BODY WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: FILES & FOLDERS */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFilesToStaging(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory="true"
                directory="true"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFilesToStaging(e.target.files);
                  e.target.value = '';
                }}
              />

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) addFilesToStaging(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-rose-500/5 transition-all duration-200 group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-zinc-800 dark:text-zinc-100">
                  Drag & Drop multiple files or folders here
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">
                  Supports PDFs, high-res images, Word docs, spreadsheets, scanned receipts, code, and ZIPs (up to 2GB per file).
                </p>
                <div className="flex items-center gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Select Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FolderUp className="w-4 h-4 text-purple-500" />
                    <span>Upload Folder</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <h4 className="text-sm font-extrabold text-rose-600 dark:text-rose-400">Camera Access Error</h4>
                  <p className="text-xs text-zinc-400">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraFacingMode('environment');
                      setActiveTab('camera');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-video sm:aspect-[16/9] max-h-[380px] flex items-center justify-center border border-zinc-800 shadow-2xl">
                  {/* Video Viewfinder */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Document Alignment Border Guide */}
                  <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-rose-500/50 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="text-[10px] sm:text-xs font-mono font-bold text-white/70 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                      Align document edges within guide
                    </div>
                  </div>

                  {/* Top Floating Controls */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                    {/* Filter Selector */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white">
                      {(['document_bw', 'enhanced', 'grayscale', 'original'] as ScanFilter[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setScanFilter(f);
                            triggerHaptic('light');
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                            scanFilter === f ? 'bg-rose-500 text-white shadow-xs' : 'text-zinc-300 hover:text-white'
                          }`}
                        >
                          {f === 'document_bw' ? 'Scan B&W' : f}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle Torch */}
                      <button
                        type="button"
                        onClick={handleToggleTorch}
                        className={`p-2 rounded-xl backdrop-blur-md border border-white/10 transition-colors ${
                          isTorchOn ? 'bg-amber-500 text-white' : 'bg-black/60 text-white hover:bg-black/80'
                        }`}
                        title="Toggle Flash / Torch"
                      >
                        <Flashlight className="w-4 h-4" />
                      </button>

                      {/* Flip Camera */}
                      <button
                        type="button"
                        onClick={handleToggleCameraFacing}
                        className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-colors"
                        title="Switch Camera (Front / Back)"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Floating Shutter Bar */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleCapturePage}
                      className="w-16 h-16 rounded-full bg-white border-4 border-rose-500 flex items-center justify-center text-rose-500 shadow-2xl active:scale-90 hover:scale-105 transition-all duration-150 cursor-pointer"
                      title="Capture Document Page"
                    >
                      <ScanLine className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLIPBOARD & URL */}
          {activeTab === 'clipboard' && (
            <div className="p-8 rounded-3xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Instant Clipboard Paste Active
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Press <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-zinc-700 dark:text-zinc-300">Cmd+V</kbd> or <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-zinc-700 dark:text-zinc-300">Ctrl+V</kbd> anywhere in this window to stage copied screenshots and files.
              </p>
            </div>
          )}

          {/* STAGING CANVAS: Visual List & Drag-to-Reorder */}
          {stagedItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    Staged Documents & Pages ({stagedItems.length})
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    • Total: {formatBytes(totalBytes)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Grid of Staged Items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stagedItems.map((item, idx) => {
                  const isDragTarget = dragOverIndex === idx;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      className={`group relative rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden flex flex-col transition-all cursor-move select-none ${
                        isDragTarget
                          ? 'border-rose-500 ring-4 ring-rose-500/20 scale-105 shadow-xl'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
                      }`}
                    >
                      {/* Page Index Badge */}
                      <div className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded-md bg-black/70 text-white font-mono text-[9px] font-bold">
                        #{idx + 1}
                      </div>

                      {/* Top Action Overlay (Rotate, Delete) */}
                      <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRotateItem(item.id);
                          }}
                          className="p-1 rounded-md bg-black/70 text-white hover:bg-rose-500 transition-colors cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="p-1 rounded-md bg-black/70 text-white hover:bg-rose-500 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Thumbnail Preview */}
                      <div
                        onClick={() => setPreviewLightboxUrl(item.previewUrl)}
                        className="w-full aspect-[3/4] bg-zinc-100 dark:bg-zinc-950/80 flex items-center justify-center overflow-hidden cursor-pointer"
                      >
                        <FileFormatThumbnail
                          name={item.name}
                          mimeType={item.type}
                          previewUrl={item.type.startsWith('image/') ? item.previewUrl : undefined}
                          rotation={item.rotation}
                        />
                      </div>

                      {/* Caption / Meta */}
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800">
                        <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[9px] font-mono text-zinc-400">
                          {formatBytes(item.size)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BATCH PROCESSING PIPELINE CONFIG */}
          {stagedItems.length > 0 && (
            <div className="p-5 rounded-3xl bg-zinc-50/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-rose-500" />
                  <span>Choose Batch Action & Conversion</span>
                </h4>
              </div>

              {/* Action Selection Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'merge_pdf', label: 'Merge to Single PDF', desc: 'Combine all pages into 1 PDF', icon: FileText, color: 'text-rose-500' },
                  { id: 'package_zip', label: 'Package into ZIP', desc: 'Compress all into a .zip archive', icon: FileArchive, color: 'text-cyan-500' },
                  { id: 'batch_pdf', label: 'Convert Each to PDF', desc: 'Convert each file to individual PDF', icon: Layers, color: 'text-purple-500' },
                  { id: 'ocr_text', label: 'Extract Text / OCR', desc: 'Extract full text to Markdown', icon: Type, color: 'text-emerald-500' },
                  { id: 'ingest_as_is', label: 'Ingest As-Is to Drive', desc: 'Upload individual files to Drive', icon: HardDrive, color: 'text-blue-500' },
                ].map((act) => {
                  const isSelected = selectedAction === act.id;
                  const Icon = act.icon;

                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setSelectedAction(act.id as BatchAction);
                        triggerHaptic('selection');
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-5 h-5 ${act.color}`} />
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{act.label}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{act.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action-Specific Settings */}
              {selectedAction === 'merge_pdf' && (
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Page Size
                    </label>
                    <select
                      value={pdfPageSize}
                      onChange={(e) => setPdfPageSize(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="a4">A4 (Standard Document)</option>
                      <option value="letter">US Letter</option>
                      <option value="fit">Fit to Image Size</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Orientation
                    </label>
                    <select
                      value={pdfOrientation}
                      onChange={(e) => setPdfOrientation(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="auto">Auto-detect per page</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Page Numbers & Footers
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addPageNumbers}
                        onChange={(e) => setAddPageNumbers(e.target.checked)}
                        className="w-4 h-4 rounded accent-rose-500"
                      />
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Add 'Page X of Y' Footer
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Output File Name & Destination Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Output File Name
                  </label>
                  <input
                    type="text"
                    value={customOutputName}
                    onChange={(e) => setCustomOutputName(e.target.value)}
                    placeholder="e.g. Bills_Invoices_2026"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:border-rose-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Output Destination
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'drive', label: 'Save to Drive', icon: HardDrive },
                      { id: 'download', label: 'Download', icon: Download },
                      { id: 'both', label: 'Both', icon: Zap },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDestination(d.id as OutputDestination);
                          triggerHaptic('selection');
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          destination === d.id
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <d.icon className="w-3.5 h-3.5" />
                        <span>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing Progress Line */}
          {isProcessing && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-rose-500">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {processStatus}
                </span>
                <span>{processProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-rose-200 dark:bg-rose-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-200"
                  style={{ width: `${processProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {completedSuccess && !isProcessing && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>Batch processing finished successfully! Files saved to Drive.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSmartUploadOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 flex items-center justify-between">
          <div className="text-xs text-zinc-500 font-mono">
            {stagedItems.length > 0
              ? `${stagedItems.length} items staged (${formatBytes(totalBytes)})`
              : 'No documents staged yet'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSmartUploadOpen(false)}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={stagedItems.length === 0 || isProcessing}
              onClick={handleExecuteBatchProcessing}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all duration-200 cursor-pointer ${
                stagedItems.length > 0 && !isProcessing
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/25 active:scale-[0.98]'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    {selectedAction === 'merge_pdf'
                      ? 'Compile to PDF'
                      : selectedAction === 'package_zip'
                      ? 'Package to ZIP'
                      : selectedAction === 'batch_pdf'
                      ? 'Convert to PDFs'
                      : selectedAction === 'ocr_text'
                      ? 'Extract Text & OCR'
                      : 'Upload to Drive'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* LIGHTBOX PREVIEW MODAL */}
        {previewLightboxUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setPreviewLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewLightboxUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewLightboxUrl}
              alt="High Res Document Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

      </div>
    </div>
  );
}
