'use client';

import { useState, useRef, useEffect } from 'react';
import { Pen, Type, Upload, X, Check, RotateCcw } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySignature: (dataUrl: string) => void;
}

export function SignatureModal({
  isOpen,
  onClose,
  onApplySignature,
}: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [typedName, setTypedName] = useState('Yash Jain');
  const [selectedFont, setSelectedFont] = useState(0);

  // Drawing Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const fonts = [
    { name: 'Elegant Cursive', style: 'font-serif italic' },
    { name: 'Executive Script', style: 'font-mono italic' },
    { name: 'Modern Signature', style: 'font-sans italic tracking-wider' },
    { name: 'Formal Calligraphy', style: 'font-serif tracking-widest' },
  ];

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 3;
          ctx.strokeStyle = signatureColor;
        }
      }
    }
  }, [isOpen, activeTab, signatureColor]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleApply = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onApplySignature(canvas.toDataURL('image/png'));
      onClose();
    } else if (activeTab === 'type') {
      // Render typed text to a canvas to generate clean PNG dataUrl
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 150;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = signatureColor;
        ctx.font = 'italic 48px "Brush Script MT", "Caveat", "Segoe Script", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, 200, 75);
        onApplySignature(tempCanvas.toDataURL('image/png'));
        onClose();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onApplySignature(event.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-modal-backdrop">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Pen className="w-4 h-4 text-rose-500" />
            <span>Create Digital Signature</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors btn-press cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl my-4">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer btn-press ${
              activeTab === 'draw'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer btn-press ${
              activeTab === 'type'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer btn-press ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'draw' && (
          <div>
            <div className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl bg-zinc-50 dark:bg-zinc-950 overflow-hidden mb-3">
              <canvas
                ref={canvasRef}
                width={460}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[180px] cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 pointer-events-none">
                  Draw your signature here
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              {/* Color swatches */}
              <div className="flex items-center gap-2">
                {['#000000', '#1d4ed8', '#dc2626'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSignatureColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full border border-white dark:border-zinc-800 shadow-xs transition-transform cursor-pointer btn-press ${
                      signatureColor === color ? 'scale-125 ring-2 ring-rose-500' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-rose-500 transition-colors font-semibold cursor-pointer btn-press"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'type' && (
          <div className="space-y-4">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500 transition-colors"
            />

            {/* Cursive Previews */}
            <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center min-h-[120px]">
              <span
                className="text-4xl italic font-serif select-none"
                style={{
                  color: signatureColor,
                  fontFamily: '"Brush Script MT", "Caveat", "Segoe Script", cursive, sans-serif',
                }}
              >
                {typedName || 'Your Signature'}
              </span>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-bold">Ink:</span>
              {['#000000', '#1d4ed8', '#dc2626'].map((color) => (
                <button
                  key={color}
                  onClick={() => setSignatureColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-5 h-5 rounded-full border border-white dark:border-zinc-800 shadow-xs transition-transform cursor-pointer btn-press ${
                    signatureColor === color ? 'scale-125 ring-2 ring-rose-500' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-zinc-400 mb-2" />
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Upload signature image (PNG, JPG)
            </span>
            <span className="text-[11px] text-zinc-400 mt-1">
              Transparent background recommended
            </span>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-5 mt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors btn-press cursor-pointer"
          >
            Cancel
          </button>
          {activeTab !== 'upload' && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all btn-press cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Use Signature</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
