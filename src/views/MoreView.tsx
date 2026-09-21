import React from 'react';
import {
  MapPin,
  Bookmark,
  Globe,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';
import { Language, LoadedFileMeta, SavedTerritory, SavedAnalysis } from '../types';
import { getTranslation } from '../utils/translations';

interface MoreViewProps {
  lang: Language;
  onToggleLang: () => void;
  fileMeta?: LoadedFileMeta | null;
  savedTerritory: SavedTerritory | null;
  savedAnalyses: SavedAnalysis[];
  onOpenMyTerritory: () => void;
  onClearSavedTerritory: () => void;
  onOpenAnalysis: (a: SavedAnalysis) => void;
  onDeleteAnalysis: (id: string) => void;
  onRemoveCurrentFile: () => void;
  onReplaceFile: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  lang,
  onToggleLang,
  fileMeta,
  savedTerritory,
  savedAnalyses,
  onOpenMyTerritory,
  onClearSavedTerritory,
  onOpenAnalysis,
  onDeleteAnalysis,
  onRemoveCurrentFile,
  onReplaceFile
}) => {
  const isRtl = lang === 'ar';
  const t = getTranslation(lang);
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fadeIn" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* SECTION 1: MY SAVED TERRITORY */}
      <div className="bg-white rounded-3xl p-5 border border-[#D9E1E8] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 text-[#0A3D62]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#17212B]">{t.myTerritory}</h3>
              <p className="text-xs text-slate-500">
                {isRtl ? 'فلاترك الجغرافية المفضلة للوصول السريع' : 'Your preferred territory filters for 1-click access'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMyTerritory}
            className="px-3 py-1.5 rounded-xl bg-[#0A3D62] text-white text-xs font-bold hover:bg-[#082d49] transition-all shadow-2xs"
          >
            {savedTerritory ? (isRtl ? 'تعديل / عرض' : 'Edit / View') : isRtl ? 'حفظ منطقة' : 'Set Territory'}
          </button>
        </div>

        {savedTerritory ? (
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-[#0A3D62]">{savedTerritory.name}</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                {[
                  savedTerritory.regions?.length ? `${savedTerritory.regions.length} مناطق` : null,
                  savedTerritory.branches?.length ? `${savedTerritory.branches.length} فروع` : null,
                  savedTerritory.bricks?.length ? `${savedTerritory.bricks.length} مربعات` : null
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearSavedTerritory}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={t.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            {t.noSavedTerritory}
          </div>
        )}
      </div>

      {/* SECTION 2: SAVED ANALYSIS SNAPSHOTS */}
      <div className="bg-white rounded-3xl p-5 border border-[#D9E1E8] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#17212B]">{t.savedAnalyses}</h3>
              <p className="text-xs text-slate-500">
                {isRtl ? 'لقطات التحليل المحفوظة للرجوع إليها فوراً' : 'Saved analysis views & filter snapshots'}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {savedAnalyses.length}
          </span>
        </div>

        {savedAnalyses.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            {t.noSavedAnalyses}
          </div>
        ) : (
          <div className="grid gap-2">
            {savedAnalyses.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-2xl border border-[#D9E1E8] hover:border-[#0A3D62]/50 flex items-center justify-between gap-3 bg-white transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => onOpenAnalysis(a)}
                  className="flex-1 text-start min-w-0"
                >
                  <h4 className="text-xs font-bold text-[#17212B] truncate">{a.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {a.dimension} • {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenAnalysis(a)}
                    className="p-1.5 rounded-lg text-xs font-bold text-[#0A3D62] hover:bg-sky-50 flex items-center gap-1"
                  >
                    <span>{isRtl ? 'فتح' : 'Open'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAnalysis(a.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: FILE & DATASET ACTIONS */}
      <div className="bg-white rounded-3xl p-5 border border-[#D9E1E8] shadow-2xs space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
          {isRtl ? 'إدارة البيانات والشيت الحالي' : 'Data & Sheet Management'}
        </h3>

        <div className="divide-y divide-slate-100">
          <button
            type="button"
            onClick={onReplaceFile}
            className="w-full py-3 flex items-center justify-between text-xs font-bold text-slate-700 hover:text-[#0A3D62] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>{t.replaceFile}</span>
            </div>
            <ArrowIcon className="w-4 h-4 text-slate-400" />
          </button>

          {fileMeta && (
            <button
              type="button"
              onClick={onRemoveCurrentFile}
              className="w-full py-3 flex items-center justify-between text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>{t.removeFile}</span>
              </div>
              <ArrowIcon className="w-4 h-4 text-rose-400" />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleLang}
            className="w-full py-3 flex items-center justify-between text-xs font-bold text-slate-700 hover:text-[#0A3D62] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>{isRtl ? 'اللغة الحالية: العربية (التحويل للإنجليزية)' : 'Current Language: English (Switch to Arabic)'}</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
              {lang.toUpperCase()}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 4: PRIVACY & OFFLINE BADGE */}
      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <p className="font-bold">{isRtl ? 'خصوصية كاملة وعمل أوفلاين 100%' : 'Full Privacy & 100% Offline'}</p>
          <p className="text-emerald-800/80 mt-0.5">
            {isRtl
              ? 'تتم معالجة جميع ملفات الإكسيل وتشفيرها وتخزينها محلياً داخل متصفحك. لا يتم إرسال أي أرقام أو بيانات لأي سيرفر خارجي.'
              : 'All Excel files are processed, encrypted, and stored locally within your browser. No data or numbers ever leave your device.'}
          </p>
        </div>
      </div>
    </div>
  );
};
