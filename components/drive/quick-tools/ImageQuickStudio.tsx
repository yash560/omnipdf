'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Maximize2,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Check,
  RefreshCw,
  Eye
} from 'lucide-react';

interface ImageQuickStudioProps {
  blob: Blob;
  fileName: string;
  onProcessedBlobChange: (blob: Blob, newName: string, mimeType: string) => void;
}

type AspectRatio = 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '9:16';

export function ImageQuickStudio({ blob, fileName, onProcessedBlobChange }: ImageQuickStudioProps) {
  const [activeTab, setActiveTab] = useState<'crop' | 'adjust' | 'resize' | 'convert'>('crop');
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  
  // Transform states
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Crop states
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  });
  const isDraggingRef = useRef<boolean>(false);
  const dragHandleRef = useRef<'move' | 'nw' | 'ne' | 'se' | 'sw' | null>(null);
  const dragStartPos = useRef<{ x: number; y: number; crop: typeof cropBox }>({ x: 0, y: 0, crop: cropBox });

  // Adjustment states
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blur, setBlur] = useState<number>(0);
  const [preset, setPreset] = useState<'none' | 'grayscale' | 'sepia' | 'invert' | 'warm' | 'cool'>('none');

  // Resize states
  const [targetWidth, setTargetWidth] = useState<number>(800);
  const [targetHeight, setTargetHeight] = useState<number>(600);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  // Convert states
  const [targetFormat, setTargetFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState<number>(90);
  const [stripExif, setStripExif] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load Image Object on mount
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setOriginalUrl(url);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
    };
    img.src = url;

    const currentExt = fileName.split('.').pop()?.toLowerCase();
    if (currentExt === 'jpg' || currentExt === 'jpeg') setTargetFormat('jpeg');
    else if (currentExt === 'webp') setTargetFormat('webp');
    else setTargetFormat('png');

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob, fileName]);

  // Adjust crop box when aspect ratio changes
  useEffect(() => {
    if (!imgElement || aspectRatio === 'free') return;

    let targetRatio = 1;
    if (aspectRatio === '1:1') targetRatio = 1;
    if (aspectRatio === '16:9') targetRatio = 16 / 9;
    if (aspectRatio === '4:3') targetRatio = 4 / 3;
    if (aspectRatio === '3:2') targetRatio = 3 / 2;
    if (aspectRatio === '9:16') targetRatio = 9 / 16;

    const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
    let newW = 0.8;
    let newH = (newW * imgRatio) / targetRatio;

    if (newH > 0.9) {
      newH = 0.8;
      newW = (newH * targetRatio) / imgRatio;
    }

    setCropBox({
      x: (1 - newW) / 2,
      y: (1 - newH) / 2,
      width: Math.min(1, newW),
      height: Math.min(1, newH),
    });
  }, [aspectRatio, imgElement]);

  // Apply transforms and render to hidden canvas & emit blob
  const applyAndRender = React.useCallback(() => {
    if (!imgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const srcW = imgElement.naturalWidth;
    const srcH = imgElement.naturalHeight;

    // 1. Calculate Crop Bounds in source pixels
    const cropX = Math.max(0, Math.min(srcW, cropBox.x * srcW));
    const cropY = Math.max(0, Math.min(srcH, cropBox.y * srcH));
    const cropW = Math.max(1, Math.min(srcW - cropX, cropBox.width * srcW));
    const cropH = Math.max(1, Math.min(srcH - cropY, cropBox.height * srcH));

    // 2. Determine Output Canvas Dimensions
    let outW = cropW;
    let outH = cropH;

    if (activeTab === 'resize' && targetWidth > 0 && targetHeight > 0) {
      outW = targetWidth;
      outH = targetHeight;
    }

    // Handle 90/270 deg rotation swapping dimensions
    const isSideways = rotation === 90 || rotation === 270;
    canvas.width = isSideways ? outH : outW;
    canvas.height = isSideways ? outW : outH;

    ctx.save();

    // 3. Move context to center for rotation & flipping
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // 4. Apply Filters & Presets
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (blur > 0) filterString += ` blur(${blur}px)`;
    if (preset === 'grayscale') filterString += ' grayscale(100%)';
    if (preset === 'sepia') filterString += ' sepia(100%)';
    if (preset === 'invert') filterString += ' invert(100%)';
    if (preset === 'warm') filterString += ' sepia(35%) saturate(140%)';
    if (preset === 'cool') filterString += ' hue-rotate(180deg) saturate(110%)';

    ctx.filter = filterString;

    // 5. Draw Image Crop
    ctx.drawImage(
      imgElement,
      cropX,
      cropY,
      cropW,
      cropH,
      -outW / 2,
      -outH / 2,
      outW,
      outH
    );

    ctx.restore();

    // 6. Export Blob
    const mime = `image/${targetFormat}`;
    canvas.toBlob(
      (outBlob) => {
        if (!outBlob) return;
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        const suffix = activeTab === 'crop' ? '_cropped' : activeTab === 'resize' ? '_resized' : '_edited';
        const newFileName = `${baseName}${suffix}.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
        onProcessedBlobChange(outBlob, newFileName, mime);
      },
      mime,
      quality / 100
    );
  }, [
    imgElement,
    cropBox,
    rotation,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    blur,
    preset,
    targetWidth,
    targetHeight,
    targetFormat,
    quality,
    activeTab,
    fileName,
    onProcessedBlobChange
  ]);

  // Re-render whenever parameters update
  useEffect(() => {
    applyAndRender();
  }, [applyAndRender]);

  // Dragging crop handlers
  const handleMouseDown = (e: React.MouseEvent, handle: 'move' | 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragHandleRef.current = handle;
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      crop: { ...cropBox },
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartPos.current.x) / rect.width;
    const dy = (e.clientY - dragStartPos.current.y) / rect.height;
    const orig = dragStartPos.current.crop;

    if (dragHandleRef.current === 'move') {
      const newX = Math.max(0, Math.min(1 - orig.width, orig.x + dx));
      const newY = Math.max(0, Math.min(1 - orig.height, orig.y + dy));
      setCropBox({ ...orig, x: newX, y: newY });
    } else if (dragHandleRef.current === 'se') {
      const newW = Math.max(0.1, Math.min(1 - orig.x, orig.width + dx));
      const newH = aspectRatio === 'free' ? Math.max(0.1, Math.min(1 - orig.y, orig.height + dy)) : newW;
      setCropBox({ ...orig, width: newW, height: newH });
    } else if (dragHandleRef.current === 'nw') {
      const newX = Math.max(0, Math.min(orig.x + orig.width - 0.1, orig.x + dx));
      const newY = Math.max(0, Math.min(orig.y + orig.height - 0.1, orig.y + dy));
      const newW = orig.width - (newX - orig.x);
      const newH = orig.height - (newY - orig.y);
      setCropBox({ x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    dragHandleRef.current = null;
  };

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropBox({ x: 0, y: 0, width: 1, height: 1 });
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setPreset('none');
    if (imgElement) {
      setTargetWidth(imgElement.naturalWidth);
      setTargetHeight(imgElement.naturalHeight);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-5 overflow-hidden select-none">
      {/* Visual Canvas Stage */}
      <div 
        className="flex-1 bg-zinc-950/90 rounded-3xl border border-zinc-800 p-4 flex flex-col items-center justify-center relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Top Controls Overlay */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-white pointer-events-auto">
            <span className="text-[11px] font-mono text-zinc-300 font-bold">
              {imgElement ? `${imgElement.naturalWidth} × ${imgElement.naturalHeight} px` : 'Loading...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-2xl border border-white/10 pointer-events-auto">
            <button
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              className="p-1.5 hover:bg-white/20 rounded-xl text-white transition-colors"
              title="Rotate Left 90°"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 hover:bg-white/20 rounded-xl text-white transition-colors"
              title="Rotate Right 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFlipH((f) => !f)}
              className={`p-1.5 rounded-xl transition-colors ${flipH ? 'bg-rose-500 text-white' : 'text-white hover:bg-white/20'}`}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFlipV((f) => !f)}
              className={`p-1.5 rounded-xl transition-colors ${flipV ? 'bg-rose-500 text-white' : 'text-white hover:bg-white/20'}`}
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-white/20 rounded-xl text-zinc-400 hover:text-white transition-colors"
              title="Reset All Adjustments"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Canvas Box */}
        {originalUrl && (
          <div
            ref={containerRef}
            className="relative max-h-[55vh] max-w-[90%] flex items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalUrl}
              alt="Source Canvas"
              className="max-h-[55vh] object-contain rounded-xl shadow-2xl pointer-events-none transition-transform duration-100"
              style={{
                transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${blur > 0 ? `blur(${blur}px)` : ''} ${
                  preset === 'grayscale' ? 'grayscale(100%)' :
                  preset === 'sepia' ? 'sepia(100%)' :
                  preset === 'invert' ? 'invert(100%)' :
                  preset === 'warm' ? 'sepia(35%) saturate(140%)' :
                  preset === 'cool' ? 'hue-rotate(180deg) saturate(110%)' : ''
                }`,
              }}
            />

            {/* Interactive Crop Box Overlay */}
            {activeTab === 'crop' && (
              <div
                className="absolute border-2 border-rose-500 bg-rose-500/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] cursor-move transition-none"
                style={{
                  left: `${cropBox.x * 100}%`,
                  top: `${cropBox.y * 100}%`,
                  width: `${cropBox.width * 100}%`,
                  height: `${cropBox.height * 100}%`,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
              >
                {/* 3x3 Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-b border-white/30" />
                  <div className="border-r border-white/30" />
                  <div className="border-r border-white/30" />
                  <div />
                </div>

                {/* Resize Handles */}
                <div
                  className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full cursor-nwse-resize shadow-md"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, 'nw');
                  }}
                />
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full cursor-nwse-resize shadow-md"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, 'se');
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Sidebar Tabs & Sliders */}
      <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shrink-0 overflow-y-auto">
        {/* Sub-Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('crop')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'crop' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Crop
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'adjust' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Filters
          </button>
          <button
            onClick={() => setActiveTab('resize')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'resize' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Resize
          </button>
          <button
            onClick={() => setActiveTab('convert')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'convert' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Format
          </button>
        </div>

        {/* Tab 1: Crop Aspect Ratios */}
        {activeTab === 'crop' && (
          <div className="space-y-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Aspect Ratio Presets
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'free', label: 'Freeform', desc: 'Custom Box' },
                { id: '1:1', label: '1:1 Square', desc: 'Avatar / Profile' },
                { id: '16:9', label: '16:9 Widescreen', desc: 'Hero / Banner' },
                { id: '4:3', label: '4:3 Standard', desc: 'Classic Display' },
                { id: '3:2', label: '3:2 Photo', desc: 'Print Photo' },
                { id: '9:16', label: '9:16 Vertical', desc: 'Story / Reel' },
              ].map((presetItem) => (
                <button
                  key={presetItem.id}
                  onClick={() => setAspectRatio(presetItem.id as AspectRatio)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    aspectRatio === presetItem.id
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="text-xs font-bold">{presetItem.label}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{presetItem.desc}</div>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500 space-y-1">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block">💡 Pro Tip:</span>
              <span>Drag the corner handles on the image to position and resize your crop box with pixel-level precision.</span>
            </div>
          </div>
        )}

        {/* Tab 2: Filters & Color Adjustments */}
        {activeTab === 'adjust' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono text-zinc-500">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono text-zinc-500">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Saturation</span>
                  <span className="font-mono text-zinc-500">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Soft Blur</span>
                  <span className="font-mono text-zinc-500">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                1-Click Presets
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['none', 'grayscale', 'sepia', 'invert', 'warm', 'cool'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      preset === p
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Resize & Rescale */}
        {activeTab === 'resize' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Width (Pixels)
                </label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    setTargetWidth(w);
                    if (maintainAspect && imgElement) {
                      setTargetHeight(Math.round((w * imgElement.naturalHeight) / imgElement.naturalWidth));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Height (Pixels)
                </label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => {
                    const h = Number(e.target.value);
                    setTargetHeight(h);
                    if (maintainAspect && imgElement) {
                      setTargetWidth(Math.round((h * imgElement.naturalWidth) / imgElement.naturalHeight));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={maintainAspect}
                  onChange={(e) => setMaintainAspect(e.target.checked)}
                  className="rounded text-rose-500 accent-rose-500"
                />
                <span>Maintain aspect ratio</span>
              </label>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                Quick Scale Chips
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 75, 200].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => {
                      if (imgElement) {
                        setTargetWidth(Math.round((imgElement.naturalWidth * pct) / 100));
                        setTargetHeight(Math.round((imgElement.naturalHeight * pct) / 100));
                      }
                    }}
                    className="py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Format & Privacy Convert */}
        {activeTab === 'convert' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Export Target Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setTargetFormat(fmt)}
                    className={`py-2 rounded-2xl border text-xs font-extrabold uppercase transition-all cursor-pointer ${
                      targetFormat === fmt
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {targetFormat !== 'png' && (
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Compression Quality</span>
                  <span className="font-mono text-zinc-500">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            )}

            <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Metadata Leakage</span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                Camera serials, GPS geo-tags, and device profiles are automatically stripped on canvas export.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
