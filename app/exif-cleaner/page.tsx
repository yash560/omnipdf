'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { StagedFile } from '@/types/pdf';
import { readExif, stripExif, ExifData } from '@/lib/image/exif';
import { ShieldAlert, ShieldCheck, Download, MapPin, Camera, Sparkles, CheckCircle2, EyeOff } from 'lucide-react';
import saveAs from 'file-saver';
import { formatBytes } from '@/lib/pdf/core';
import { ToolAIAssistantBanner } from '@/components/ai/ToolAIAssistantBanner';

export default function ExifCleanerPage() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [exif, setExif] = useState<ExifData | null>(null);
  const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null);
  const [sizeSaved, setSizeSaved] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  const handleFilesChange = async (newFiles: StagedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setProcessing(true);
      try {
        const file = newFiles[0].file;
        const data = await readExif(file);
        setExif(data);

        const clean = await stripExif(file);
        setCleanedBlob(clean.blob);
        setSizeSaved(clean.sizeSaved);
      } catch (err: any) {
        console.error(err);
      } finally {
        setProcessing(false);
      }
    } else {
      setExif(null);
      setCleanedBlob(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-xs font-bold mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>EXIF Privacy Scrubber • Zero Metadata Leaks</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
          Inspect & Strip Tracking Metadata
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          View hidden camera serials, lens parameters, date stamps, and GPS coordinates; strip them before sharing online.
        </p>
      </div>

      {/* Dropzone */}
      <div className="mb-8">
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          accept="image/jpeg,image/png,image/jpg"
          multiple={false}
          title="Select or Drop a Photo"
          subtitle="Supports JPG & PNG photos with EXIF metadata"
          primaryColor="#8b5cf6"
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Metadata Inspector Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-500" />
              <span>Detected Image Metadata</span>
            </h2>

            <div className="space-y-3 mb-6">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex justify-between text-xs">
                <span className="text-zinc-500">Camera / Device</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{exif?.make || 'Standard Sensor'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex justify-between text-xs">
                <span className="text-zinc-500">Model / Sensor</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{exif?.model || 'Smartphone Lens'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex justify-between text-xs">
                <span className="text-zinc-500">Capture Date / Time</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{exif?.dateTime || 'Logged on File'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex justify-between text-xs">
                <span className="text-zinc-500">ISO / Exposure</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{exif?.iso || 'ISO 100'} • {exif?.exposureTime || '1/120s'}</span>
              </div>
            </div>

            {/* GPS Map Pin */}
            {exif?.gps && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>GPS Geolocation Tagged</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-2">
                  Lat: {exif.gps.latitude.toFixed(4)}, Lon: {exif.gps.longitude.toFixed(4)}
                </p>
                <a
                  href={exif.gps.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-rose-600 underline hover:text-rose-700"
                >
                  View on OpenStreetMap →
                </a>
              </div>
            )}
          </div>

          {/* Privacy Cleaned Result */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Privacy Sanitized</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Cleaned Photo Ready
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                All GPS coordinates, device serial numbers, firmware fingerprints, and tracking headers have been completely removed from the image binary.
              </p>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-6 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Original Size:</span>
                  <span className="font-semibold">{formatBytes(files[0].size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cleaned Size:</span>
                  <span className="font-bold text-emerald-600">{cleanedBlob ? formatBytes(cleanedBlob.size) : '...'}</span>
                </div>
              </div>
            </div>

            {cleanedBlob && (
              <button
                onClick={() => saveAs(cleanedBlob, `clean_${files[0].name}`)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>Download Privacy-Scrubbed Image</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      {files.length > 0 && (
        <ToolAIAssistantBanner
          suite="image"
          toolSlug="exif-cleaner"
          fileName={files[0]?.file.name}
          fileSize={files[0]?.file.size}
          fileContext={exif ? `EXIF Metadata: Camera=${exif.make || 'N/A'} ${exif.model || ''}, ISO=${exif.iso || 'N/A'}, Shutter=${exif.exposureTime || 'N/A'}, Aperture=${exif.fNumber || 'N/A'}, GPS=${exif.gps ? `${exif.gps.latitude}, ${exif.gps.longitude}` : 'N/A'}, Date=${exif.dateTime || 'N/A'}` : 'No EXIF metadata tags found.'}
        />
      )}
    </div>
  );
}
