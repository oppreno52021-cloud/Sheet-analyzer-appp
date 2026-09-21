import React from 'react';
import { BarChart3, Globe, FileSpreadsheet } from 'lucide-react';
import { Language, LoadedFileMeta, NavTab } from '../types';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  fileMeta?: LoadedFileMeta | null;
  currentTab: NavTab;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  fileMeta,
  currentTab
}) => {
  const isRtl = lang === 'ar';

  return (
    <header
      dir="ltr"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D9E1E8] shadow-2xs px-4 sm:px-6 py-2.5 transition-colors text-left"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Side: App Icon + App Name + Opened File Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A3D62] to-[#17212B] text-white flex items-center justify-center shadow-sm shrink-0">
            <BarChart3 className="w-5 h-5 text-sky-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-[#17212B] truncate leading-tight">
              Sheet Analyzer
            </h1>

            {/* Display opened file name directly under app name */}
            {fileMeta ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate mt-0.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#0A3D62] shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md text-slate-700 font-semibold" title={fileMeta.fileName}>
                  {fileMeta.fileName}
                </span>
              </div>
            ) : (
              <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                Universal Sheet & Data Analyzer
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Header Action (Language Toggle) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D9E1E8] text-xs font-bold text-[#17212B] hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
            title={isRtl ? 'Switch to English' : 'التحويل للغة العربية'}
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-[#0A3D62]" />
            <span className="uppercase tracking-wider">{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
