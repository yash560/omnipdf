'use client';

import { useState, useEffect } from 'react';
import { generateQrSvg, generateQrDataUrl, generateBarcodeSvg, QrOptions, BarcodeOptions } from '@/lib/security/qr-barcode';
import { QrCode, Download, Copy, CheckCircle2, Sliders, Sparkles, Link as LinkIcon, Barcode, Image as ImageIcon, Check } from 'lucide-react';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function QrBarcodePage() {
  const [activeTab, setActiveTab] = useState<'qr' | 'barcode'>('qr');

  // QR State
  const [qrText, setQrText] = useState('https://filecraft.thewebvale.com');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [qrPngUrl, setQrPngUrl] = useState<string>('');

  // Barcode State
  const [barcodeText, setBarcodeText] = useState('FILECRAFT-2026');
  const [barcodeFormat, setBarcodeFormat] = useState<'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'ITF14'>('CODE128');
  const [barcodeSvg, setBarcodeSvg] = useState<string>('');
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // Re-generate QR
  useEffect(() => {
    let isMounted = true;
    async function update() {
      try {
        const svg = await generateQrSvg({
          text: qrText,
          size: 280,
          fgColor,
          bgColor,
          ecc,
        });
        const png = await generateQrDataUrl(
          {
            text: qrText,
            size: 512,
            fgColor,
            bgColor,
            ecc,
          },
          logoDataUrl
        );

        if (isMounted) {
          setQrSvg(svg);
          setQrPngUrl(png);
        }
      } catch (err) {
        console.error('QR generation error:', err);
      }
    }
    update();
    return () => {
      isMounted = false;
    };
  }, [qrText, fgColor, bgColor, ecc, logoDataUrl]);

  // Re-generate Barcode
  useEffect(() => {
    try {
      setBarcodeError(null);
      const svg = generateBarcodeSvg({
        text: barcodeText,
        format: barcodeFormat,
        lineColor: fgColor,
        background: bgColor,
        height: 70,
        fontSize: 14,
      });
      setBarcodeSvg(svg);
    } catch (err: any) {
      setBarcodeError(err.message || 'Invalid barcode characters');
    }
  }, [barcodeText, barcodeFormat, fgColor, bgColor]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadQrSvg = () => {
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, 'qrcode.svg');
  };

  const handleDownloadQrPng = () => {
    if (!qrPngUrl) return;
    saveAs(qrPngUrl, 'qrcode.png');
  };

  const handleDownloadBarcodeSvg = () => {
    const blob = new Blob([barcodeSvg], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, `barcode_${barcodeFormat.toLowerCase()}.svg`);
  };

  const copyText = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-xs font-bold mb-3">
          <QrCode className="w-3.5 h-3.5" />
          <span>ISO/IEC 18004 Compliant Engine • Scannable SVG & PNG</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          QR Code & Barcode Studio
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Generate scan-ready vector QR codes and 1D retail/inventory barcodes with custom styling and logo embedding.
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mt-6 border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-6 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>2D QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('barcode')}
            className={`px-6 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'barcode'
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>1D Barcode (Code128 / EAN)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Controls Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-500" />
              <span>{activeTab === 'qr' ? 'QR Code Parameters' : 'Barcode Configuration'}</span>
            </h2>

            {activeTab === 'qr' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Payload Content (URL, Text, WiFi, Contact)
                  </label>
                  <input
                    type="text"
                    value={qrText}
                    onChange={(e) => setQrText(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Pattern Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase">{fgColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase">{bgColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Error Correction Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['L', 'M', 'Q', 'H'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEcc(level)}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          ecc === level
                            ? 'bg-purple-600 text-white border-purple-600 shadow'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {level} ({level === 'L' ? '7%' : level === 'M' ? '15%' : level === 'Q' ? '25%' : '30%'})
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Center Logo Badge (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                      <span>{logoDataUrl ? 'Change Logo' : 'Upload PNG/JPG'}</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {logoDataUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoDataUrl(undefined)}
                        className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDownloadQrSvg}
                    className="py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download SVG</span>
                  </button>
                  <button
                    onClick={handleDownloadQrPng}
                    className="py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PNG</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Barcode Data / Serial Number
                  </label>
                  <input
                    type="text"
                    value={barcodeText}
                    onChange={(e) => setBarcodeText(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none text-zinc-900 dark:text-white"
                  />
                  {barcodeError && (
                    <div className="text-[11px] font-bold text-rose-500 mt-1.5">
                      {barcodeError}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Barcode Symbology Standard
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['CODE128', 'EAN13', 'UPC', 'CODE39', 'ITF14'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setBarcodeFormat(fmt)}
                        className={`py-2 text-[11px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                          barcodeFormat === fmt
                            ? 'bg-purple-600 text-white border-purple-600 shadow'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Bar Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase">{fgColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase">{bgColor}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadBarcodeSvg}
                  disabled={Boolean(barcodeError)}
                  className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Vector Barcode SVG</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Preview Column */}
        <div className="lg:col-span-6 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col items-center justify-center min-h-[380px]">
          {activeTab === 'qr' ? (
            <div className="flex flex-col items-center space-y-4">
              <div
                className="p-6 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 bg-white"
                style={{ backgroundColor: bgColor }}
              >
                {logoDataUrl ? (
                  <img src={qrPngUrl} alt="QR Code" className="w-[260px] h-[260px] object-contain block" />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-[260px] h-[260px] flex items-center justify-center" />
                )}
              </div>
              <div className="text-xs font-mono text-zinc-500 max-w-[280px] truncate text-center">
                {qrText}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 w-full">
              {barcodeError ? (
                <div className="text-xs font-bold text-rose-500 p-4 text-center">
                  {barcodeError}
                </div>
              ) : (
                <div
                  className="p-6 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 bg-white w-full flex items-center justify-center overflow-x-auto"
                  style={{ backgroundColor: bgColor }}
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Banner */}
      <div className="mt-8">
        <ToolAIAssistantBanner
          suite="security"
          toolSlug="qr-barcode"
          fileName={activeTab === 'qr' ? 'QR Vector' : 'Barcode Vector'}
          fileContext={`Code Mode: ${activeTab}, Content: "${activeTab === 'qr' ? qrText : barcodeText}"`}
        />
      </div>
    </div>
  );
}
