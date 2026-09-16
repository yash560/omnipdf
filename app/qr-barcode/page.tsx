'use client';

import { useState } from 'react';
import { generateQrSvg, QrOptions } from '@/lib/security/qr-barcode';
import { QrCode, Download, Copy, CheckCircle2, Sliders, Sparkles, Link as LinkIcon, Wifi, Mail } from 'lucide-react';
import saveAs from 'file-saver';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function QrBarcodePage() {
  const [text, setText] = useState('https://filecraft.thewebvale.com');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [rounded, setRounded] = useState(true);
  const [qrSvg, setQrSvg] = useState(() => generateQrSvg({ text: 'https://filecraft.thewebvale.com', size: 300, fgColor: '#000000', bgColor: '#ffffff', rounded: true, ecc: 'M' }));
  const [copied, setCopied] = useState(false);

  const updateQr = (newText = text, fg = fgColor, bg = bgColor, r = rounded) => {
    const svg = generateQrSvg({
      text: newText,
      size: 300,
      fgColor: fg,
      bgColor: bg,
      rounded: r,
      ecc: 'M',
    });
    setQrSvg(svg);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    saveAs(blob, 'qrcode.svg');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-xs font-bold mb-3">
          <QrCode className="w-3.5 h-3.5" />
          <span>QR Code & Barcode Engine • High-Res Vector SVG</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Generate Customizable Vector QR Codes
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Create QR codes for website URLs, WiFi networks, contact vCards, or texts with custom color styling.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-500" />
            <span>QR Content & Colors</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              QR Code Content (URL, Text, or Wi-Fi)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                updateQr(e.target.value, fgColor, bgColor, rounded);
              }}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none"
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
                  onChange={(e) => {
                    setFgColor(e.target.value);
                    updateQr(text, e.target.value, bgColor, rounded);
                  }}
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
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    updateQr(text, fgColor, e.target.value, rounded);
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                />
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase">{bgColor}</span>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={rounded}
              onChange={(e) => {
                setRounded(e.target.checked);
                updateQr(text, fgColor, bgColor, e.target.checked);
              }}
              className="w-4 h-4 accent-purple-500 rounded"
            />
            <span>Rounded Corner Modules</span>
          </label>

          <button
            onClick={handleDownloadSvg}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Download Vector SVG QR Code</span>
          </button>
        </div>

        {/* QR Visual Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col items-center justify-center">
          <div
            className="p-6 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>
      </div>

      {/* AI Assistant Banner */}
      <ToolAIAssistantBanner
        suite="security"
        toolSlug="qr-barcode"
        fileName="QR Vector Payload"
        fileContext={`QR Code Payload: "${text}", Styling: FG=${fgColor}, BG=${bgColor}, Rounded=${rounded}`}
      />
    </div>
  );
}
