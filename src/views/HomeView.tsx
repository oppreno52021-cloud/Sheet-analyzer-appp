import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Language, LoadedFileMeta, RecentFileItem } from '../types';
import { getTranslation } from '../utils/translations';

interface HomeViewProps {
  lang: Language;
  fileMeta?: LoadedFileMeta | null;
  recentFiles: RecentFileItem[];
  onUploadFile: (file: File) => void;
  onOpenRecentFile: (id: string) => void;
  onDeleteRecentFile: (id: string) => void;
  onOpenCurrentFile: () => void;
  onRemoveCurrentFile: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onLoadDemoData?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  lang,
  fileMeta,
  recentFiles,
  onUploadFile,
  onOpenRecentFile,
  onDeleteRecentFile,
  onOpenCurrentFile,
  isLoading,
  loadingMessage
}) => {
  const isRtl = lang === 'ar';
  const t = getTranslation(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFile(e.target.files[0]);
    }
  };

  // Format date and time of last opened with clean, legible formatting
  const formatLastOpened = (timestamp?: number) => {
    if (!timestamp) return isRtl ? 'غير محدد' : 'Unknown';
    try {
      const d = new Date(timestamp);
      return d.toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  // Sort files strictly descending by lastOpenedAt (or loadedAt as fallback)
  const sortedFiles = [...recentFiles].sort((a, b) => {
    const timeA = a.lastOpenedAt || a.loadedAt || 0;
    const timeB = b.lastOpenedAt || b.loadedAt || 0;
    return timeB - timeA;
  });

  // Top 3 recent sheets
  const top3Files = sortedFiles.slice(0, 3);
  // Files exceeding 3 for "Open More"
  const moreFiles = sortedFiles.slice(3);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-3.5 sm:space-y-4 animate-fadeIn overflow-x-hidden box-border" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-3 max-w-xs text-center border border-slate-100">
            <Loader2 className="w-8 h-8 text-[#0A3D62] animate-spin" />
            <h3 className="font-bold text-sm text-[#17212B]">{loadingMessage || t.readingFile}</h3>
          </div>
        </div>
      )}

      {/* 1. UPLOAD CARD */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full max-w-full box-border border-2 border-dashed rounded-2xl p-5 sm:p-7 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-[#0A3D62] bg-sky-50/60 scale-[1.01]'
            : 'border-[#D9E1E8] bg-white hover:border-[#0A3D62]/50 hover:bg-slate-50/50 shadow-2xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#0A3D62] flex items-center justify-center mx-auto mb-2.5 border border-sky-100 shadow-2xs">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h2 className="text-base font-black text-[#17212B]">{t.uploadTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.uploadSubtitle}</p>

        <div className="mt-4 flex items-center justify-center">
          <span className="px-5 py-2.5 rounded-xl bg-[#0A3D62] text-white text-xs sm:text-sm font-bold hover:bg-[#082d49] transition-all shadow-2xs">
            {t.browseFiles}
          </span>
        </div>
      </div>

      {/* 2. CURRENTLY OPENED / ACTIVE FILE CARD */}
      {fileMeta && (
        <div className="w-full max-w-full box-border bg-white rounded-2xl p-3 sm:p-3.5 border border-[#D9E1E8] shadow-2xs flex items-center justify-between gap-2.5 sm:gap-3 overflow-hidden">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-[#0A3D62] flex items-center justify-center shrink-0 border border-slate-200">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                {isRtl ? 'الشيت المفتوح حالياً' : 'Current Active Sheet'}
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#17212B] truncate" title={fileMeta.fileName}>
                {fileMeta.fileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCurrentFile}
            className="px-3 sm:px-4 py-2 rounded-xl bg-[#0A3D62] text-white text-xs font-bold hover:bg-[#082d49] transition-all flex items-center gap-1 sm:gap-1.5 shrink-0 shadow-2xs"
          >
            <span>{t.openFile}</span>
            {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* 3. RECENT FILES SECTION (Top 3 Sheets sorted by lastOpenedAt) */}
      <div className="w-full max-w-full box-border space-y-2 pt-0.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-black text-[#17212B] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{t.recentFiles}</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            {sortedFiles.length} {isRtl ? 'شيت' : 'sheets'}
          </span>
        </div>

        {top3Files.length === 0 ? (
          <div className="w-full max-w-full bg-white rounded-2xl p-5 text-center border border-slate-100 text-xs text-slate-400">
            {t.noRecentFiles}
          </div>
        ) : (
          <div className="w-full max-w-full grid gap-2">
            {top3Files.map((rf) => (
              <div
                key={rf.id}
                className="w-full max-w-full box-border bg-white rounded-2xl p-2.5 sm:p-3.5 border border-[#D9E1E8] hover:border-[#0A3D62]/40 transition-all shadow-2xs flex items-center justify-between gap-2 sm:gap-3 group overflow-hidden"
              >
                {/* File Details (Button Clickable) */}
                <button
                  type="button"
                  onClick={() => onOpenRecentFile(rf.id)}
                  className="flex items-center gap-2.5 sm:gap-3 text-start min-w-0 flex-1 overflow-hidden"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 group-hover:bg-sky-50 text-slate-600 group-hover:text-[#0A3D62] flex items-center justify-center shrink-0 border border-slate-100 transition-colors">
                    <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h4 className="text-xs sm:text-sm font-bold text-[#17212B] truncate group-hover:text-[#0A3D62] transition-colors leading-snug">
                      {rf.fileName}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                      <span className="text-slate-400">{t.lastOpened}: </span>
                      <span className="text-slate-700 font-medium">
                        {formatLastOpened(rf.lastOpenedAt || rf.loadedAt)}
                      </span>
                    </p>
                  </div>
                </button>

                {/* Actions (Strict shrink-0 with compact footprint on mobile) */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenRecentFile(rf.id)}
                    className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#082d49] transition-all flex items-center gap-1 shadow-2xs shrink-0"
                    title={t.openFile}
                  >
                    <span>{t.openFile}</span>
                    {isRtl ? <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRecentFile(rf.id)}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title={t.delete}
                    aria-label="Delete recent file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SHOW MORE PREVIOUS SHEETS (EXCEEDING 3) */}
        {moreFiles.length > 0 && (
          <div className="w-full max-w-full pt-1">
            <button
              type="button"
              onClick={() => setIsMoreExpanded(!isMoreExpanded)}
              className="w-full max-w-full py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <span>
                {isMoreExpanded
                  ? t.hideMoreFiles
                  : `${t.showMoreFiles} (${moreFiles.length})`}
              </span>
              {isMoreExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isMoreExpanded && (
              <div className="w-full max-w-full grid gap-2 mt-2 pt-2 border-t border-slate-100 animate-fadeIn">
                {moreFiles.map((rf) => (
                  <div
                    key={rf.id}
                    className="w-full max-w-full box-border bg-slate-50/80 rounded-2xl p-2.5 sm:p-3 border border-slate-200 hover:border-[#0A3D62]/40 transition-all flex items-center justify-between gap-2 sm:gap-3 group overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenRecentFile(rf.id)}
                      className="flex items-center gap-2.5 text-start min-w-0 flex-1 overflow-hidden"
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white text-slate-600 group-hover:text-[#0A3D62] flex items-center justify-center shrink-0 border border-slate-200 transition-colors">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h4 className="text-xs sm:text-sm font-bold text-[#17212B] truncate group-hover:text-[#0A3D62] transition-colors">
                          {rf.fileName}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                          <span className="text-slate-400">{t.lastOpened}: </span>
                          <span className="text-slate-700 font-medium">{formatLastOpened(rf.lastOpenedAt || rf.loadedAt)}</span>
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenRecentFile(rf.id)}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-[#0A3D62] hover:bg-sky-50 bg-white border border-slate-200 transition-all shrink-0"
                      >
                        {t.openFile}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRecentFile(rf.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title={t.delete}
                        aria-label="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
