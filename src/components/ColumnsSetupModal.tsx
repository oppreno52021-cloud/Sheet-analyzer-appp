import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Columns,
  ArrowUpDown,
  Plus,
  Trash2,
  Check,
  Search,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { useBackModal } from '../utils/backNavigation';

interface ColumnsSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableColumns: string[];
  primaryCol: string;
  secondaryCol: string;
  extraCols: string[];
  onApply: (col1: string, col2: string, extras: string[]) => void;
  lang: Language;
}

export const ColumnsSetupModal: React.FC<ColumnsSetupModalProps> = ({
  isOpen,
  onClose,
  availableColumns,
  primaryCol,
  secondaryCol,
  extraCols,
  onApply,
  lang
}) => {
  const isRtl = lang === 'ar';
  const t = getTranslation(lang);

  const [col1, setCol1] = useState(primaryCol);
  const [col2, setCol2] = useState(secondaryCol);
  const [extras, setExtras] = useState<string[]>(extraCols);

  useEffect(() => {
    if (isOpen) {
      setCol1(primaryCol);
      setCol2(secondaryCol);
      setExtras(extraCols);
    }
  }, [isOpen, primaryCol, secondaryCol, extraCols]);

  useBackModal(isOpen, onClose, 'columns-setup-modal', 26);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalScrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = `-${originalScrollY}px`;
    return () => {
      document.body.classList.remove('modal-open');
      const top = document.body.style.top;
      document.body.style.top = '';
      if (top) {
        window.scrollTo(0, -parseInt(top, 10));
      }
    };
  }, [isOpen]);

  const handleSwap = () => {
    const temp = col1;
    setCol1(col2);
    setCol2(temp);
  };

  const handleAddExtra = () => {
    const candidate = availableColumns.find(
      (c) => c !== col1 && c !== col2 && !extras.includes(c)
    );
    if (candidate) {
      setExtras([...extras, candidate]);
    }
  };

  const handleRemoveExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onApply(col1, col2, extras.filter((c) => c && c !== col1 && c !== col2));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#D9E1E8] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#D9E1E8] bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0A3D62] text-white flex items-center justify-center shadow-xs">
              <Columns className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-none">
                {isRtl ? 'أعمدة وتنسيق الجدول' : 'Table Columns'}
              </h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                {isRtl ? 'تحديد العمود 1 والعمود 2 والأعمدة المضافة' : 'Select Column 1, Column 2, and extra columns'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Column 1 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-[#0A3D62] text-white text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <span>{isRtl ? 'العمود الرئيسي (عمود 1)' : 'Primary Column (Col 1)'}</span>
              </span>
              <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded">
                {isRtl ? 'الأساس' : 'Base'}
              </span>
            </label>
            <div className="relative">
              <select
                value={col1}
                onChange={(e) => setCol1(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A3D62] focus:bg-white"
              >
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2">
            <button
              type="button"
              onClick={handleSwap}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs hover:text-[#0A3D62]"
              title={isRtl ? 'تبديل الترتيب بين عمود 1 وعمود 2' : 'Swap Column 1 and Column 2'}
            >
              <ArrowUpDown className="w-3 h-3 text-[#0A3D62]" />
              <span>{isRtl ? 'تبديل الترتيب' : 'Swap Order'}</span>
            </button>
          </div>

          {/* Column 2 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-slate-600 text-white text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <span>{isRtl ? 'العمود التابع (عمود 2)' : 'Secondary Column (Col 2)'}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                {isRtl ? 'الفرعي' : 'Sub'}
              </span>
            </label>
            <div className="relative">
              <select
                value={col2}
                onChange={(e) => setCol2(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A3D62] focus:bg-white"
              >
                <option value="">{isRtl ? '— بدون عمود ثانٍ —' : '— None —'}</option>
                {availableColumns
                  .filter((c) => c !== col1)
                  .map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Extra Columns */}
          {extras.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 block">
                {isRtl ? 'أعمدة إضافية للعرض:' : 'Additional Columns:'}
              </span>
              {extras.map((extra, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-400 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 3}
                  </span>
                  <select
                    value={extra}
                    onChange={(e) => {
                      const updated = [...extras];
                      updated[idx] = e.target.value;
                      setExtras(updated);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A3D62] focus:bg-white"
                  >
                    {availableColumns
                      .filter((c) => c !== col1 && c !== col2)
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveExtra(idx)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                    title={isRtl ? 'حذف هذا العمود' : 'Remove column'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Column Button */}
          <button
            type="button"
            onClick={handleAddExtra}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-[#0A3D62] text-[#0A3D62] hover:bg-sky-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isRtl ? 'إضافة عمود آخر للعرض' : 'Add Another Column'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F8FAFC] border-t border-[#D9E1E8] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#0A3D62] hover:bg-[#082f4d] text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تطبيق وتحديث الجدول' : 'Apply & Update Table'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
