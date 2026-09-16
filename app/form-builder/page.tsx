'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FormInput, ArrowLeft, Download, Plus, Trash2, CheckSquare, AlignLeft, ListFilter, CircleDot, Play, PenTool, Sparkles } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { buildAcroFormPdf, FormFieldDefinition, FormFieldType } from '@/lib/pdf/form-builder';
import { getPdfJs, downloadBytes, safeCloneBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function FormBuilderPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fields, setFields] = useState<FormFieldDefinition[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [activePaletteType, setActivePaletteType] = useState<FormFieldType>('text');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Load PDF
  useEffect(() => {
    let isMounted = true;
    async function loadPdf() {
      if (files.length === 0 || !files[0].arrayBuffer) {
        pdfDocRef.current = null;
        setFields([]);
        return;
      }

      try {
        const pdfjs = await getPdfJs();
        if (!pdfjs) return;

        const pdfDoc = await pdfjs.getDocument({ data: safeCloneBytes(files[0].arrayBuffer) }).promise;
        if (!isMounted) return;

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF for Form Builder:', err);
      }
    }

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [files]);

  // Render Canvas
  useEffect(() => {
    let isMounted = true;
    async function renderPage() {
      const canvas = canvasRef.current;
      const pdfDoc = pdfDocRef.current;
      if (!canvas || !pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: 1.0 });
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
        const scale = Math.min(600, window.innerWidth - 64) / viewport.width;
        const renderViewport = page.getViewport({ scale: scale * dpr });

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(viewport.width * scale)}px`;
        canvas.style.height = `${Math.floor(viewport.height * scale)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

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
  }, [currentPage, files]);

  const handleAddField = (type: FormFieldType) => {
    const newField: FormFieldDefinition = {
      id: `field_${Date.now()}`,
      name: `field_${type}_${fields.length + 1}`,
      type,
      pageIndex: currentPage - 1,
      x: 100,
      y: 100,
      width: type === 'checkbox' || type === 'radio' ? 24 : type === 'multiline' ? 280 : 200,
      height: type === 'checkbox' || type === 'radio' ? 24 : type === 'multiline' ? 80 : 32,
      defaultValue: type === 'checkbox' ? false : '',
      options: type === 'dropdown' || type === 'radio' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    };

    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleUpdateField = (id: string, updates: Partial<FormFieldDefinition>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleDeleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleExportFormPdf = async () => {
    if (files.length === 0 || !files[0].arrayBuffer) return;

    try {
      setIsProcessing(true);
      const bakedBytes = await buildAcroFormPdf(files[0].arrayBuffer, fields);
      const outName = `${files[0].name.replace(/\.pdf$/i, '')}_fillable_form.pdf`;
      downloadBytes(bakedBytes, outName);
    } catch (err: any) {
      console.error('Form export error:', err);
      alert(err.message || 'Failed to export AcroForm PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;
  const currentPageFields = fields.filter((f) => f.pageIndex === currentPage - 1);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <FormInput className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                PDF Form Builder & AcroForm Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Interactive Forms
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Add interactive fillable text inputs, checkboxes, dropdowns, and digital signature boxes to any PDF.
            </p>
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            multiple={false}
            primaryColor="#6366f1"
            title="Select PDF document to add interactive form fields"
            subtitle="or drag and drop your PDF template here"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Visual Editor */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center relative min-h-[500px]">
            {/* Field Toolbar */}
            <div className="flex items-center gap-2 mb-4 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => handleAddField('text')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Text Field</span>
              </button>
              <button
                onClick={() => handleAddField('multiline')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <AlignLeft className="w-3.5 h-3.5 text-indigo-500" />
                <span>Text Area</span>
              </button>
              <button
                onClick={() => handleAddField('checkbox')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>Checkbox</span>
              </button>
              <button
                onClick={() => handleAddField('dropdown')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ListFilter className="w-3.5 h-3.5 text-indigo-500" />
                <span>Dropdown</span>
              </button>
            </div>

            {/* Document Canvas & Overlays */}
            <div ref={overlayRef} className="relative border border-zinc-300 dark:border-zinc-700 shadow-2xl rounded-lg overflow-hidden bg-white">
              <canvas ref={canvasRef} className="block max-h-[520px] object-contain" />

              {/* Render Draggable / Selectable Form Fields */}
              {currentPageFields.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFieldId(f.id)}
                  style={{
                    left: `${f.x}px`,
                    top: `${f.y}px`,
                    width: `${f.width}px`,
                    height: `${f.height}px`,
                  }}
                  className={`absolute rounded border-2 flex items-center px-2 cursor-pointer transition-all ${
                    selectedFieldId === f.id
                      ? 'border-indigo-600 bg-indigo-500/20 shadow-lg ring-2 ring-indigo-400'
                      : 'border-blue-400 bg-blue-50/70 hover:border-blue-500'
                  }`}
                >
                  <span className="text-[10px] font-extrabold text-indigo-900 dark:text-indigo-100 truncate pointer-events-none">
                    {f.type === 'checkbox' ? '☑' : f.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-2xl">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-zinc-700 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  Prev
                </button>
                <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-zinc-700 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right Properties Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                {selectedField ? 'Field Properties' : 'Form Overview'}
              </h3>

              {selectedField ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Field Name / Key
                    </label>
                    <input
                      type="text"
                      value={selectedField.name}
                      onChange={(e) => handleUpdateField(selectedField.id, { name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        X Position (pt)
                      </label>
                      <input
                        type="number"
                        value={selectedField.x}
                        onChange={(e) => handleUpdateField(selectedField.id, { x: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Y Position (pt)
                      </label>
                      <input
                        type="number"
                        value={selectedField.y}
                        onChange={(e) => handleUpdateField(selectedField.id, { y: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Width (pt)
                      </label>
                      <input
                        type="number"
                        value={selectedField.width}
                        onChange={(e) => handleUpdateField(selectedField.id, { width: parseInt(e.target.value, 10) || 20 })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Height (pt)
                      </label>
                      <input
                        type="number"
                        value={selectedField.height}
                        onChange={(e) => handleUpdateField(selectedField.id, { height: parseInt(e.target.value, 10) || 20 })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {selectedField.type === 'dropdown' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Dropdown Options (comma separated)
                      </label>
                      <input
                        type="text"
                        value={(selectedField.options || []).join(', ')}
                        onChange={(e) =>
                          handleUpdateField(selectedField.id, {
                            options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteField(selectedField.id)}
                    className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Field</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 py-6 text-center">
                  Click on any field on the canvas to configure properties or add a new field from the top toolbar.
                </div>
              )}

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleExportFormPdf}
                  disabled={fields.length === 0 || isProcessing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Fillable AcroForm PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <div className="mt-8">
          <ToolAIAssistantBanner
            suite="pdf"
            toolSlug="form-builder"
            fileName={files[0]?.file.name}
            fileSize={files[0]?.file.size}
            fileContext={`PDF Form Builder with ${fields.length} interactive fields configured.`}
          />
        </div>
      )}
    </div>
  );
}
