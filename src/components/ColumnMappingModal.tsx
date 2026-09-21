import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, X, AlertCircle } from 'lucide-react';
import { ColumnMapping, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { useBackModal } from '../utils/backNavigation';
import { useBodyScrollLock } from '../utils/scrollLock';

interface ColumnMappingModalProps {
  isOpen: boolean;
  columns: string[];
  initialMapping: ColumnMapping;
  onSave: (mapping: ColumnMapping) => void;
  onCancel: () => void;
  lang: Language;
}

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  columns,
  initialMapping,
  onSave,
  onCancel,
  lang
}) => {
  const t = getTranslation(lang);
  const [mapping, setMapping] = useState<ColumnMapping>({ ...initialMapping });

  useBackModal(isOpen, onCancel, 'column-mapping-modal', 30);
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  const mappingFields: {
    key: keyof ColumnMapping;
    label: string;
    required?: boolean;
  }[] = [
    { key: 'qty', label: lang === 'ar' ? 'الكمية (QTY)' : 'Quantity (QTY)', required: true },
    { key: 'value', label: lang === 'ar' ? 'القيمة (Value)' : 'Value (Amount)' },
    { key: 'brand', label: lang === 'ar' ? 'البراند (Brand)' : 'Brand', required: true },
    { key: 'product', label: lang === 'ar' ? 'المنتج (Product)' : 'Product Name' },
    { key: 'item', label: lang === 'ar' ? 'الصنف (Item)' : 'Item Name' },
    { key: 'region', label: lang === 'ar' ? 'المنطقة (Region)' : 'Region', required: true },
    { key: 'branch', label: lang === 'ar' ? 'الفرع (Branch)' : 'Branch' },
    { key: 'address', label: lang === 'ar' ? 'العنوان (Address)' : 'Address' },
    { key: 'brick', label: lang === 'ar' ? 'المربع (Brick)' : 'Brick' },
    { key: 'target', label: lang === 'ar' ? 'المستهدف (Target)' : 'Target Column' }
  ];

  const isValid = !!(mapping.qty && mapping.brand && mapping.region);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave(mapping);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] modal-overlay"
      onClick={onCancel}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 modal-content-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-[#D9E1E8] bg-[#F7F9FB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 -ms-2 text-[#0A3D62] hover:bg-slate-200/60 rounded-xl transition-colors flex items-center gap-1 font-semibold text-xs cursor-pointer"
              title={lang === 'ar' ? 'رجوع' : 'Back'}
            >
              <BackIcon className="w-5 h-5" />
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </span>
            </button>
            <div>
              <h3 className="text-base font-bold text-[#17212B]">
                {t.columnMappingTitle}
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                {t.columnMappingSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 -me-2 text-[#667085] hover:text-[#17212B] hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {mappingFields.map(({ key, label, required }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold text-[#17212B] flex items-center justify-between">
                <span>{label}</span>
                {required && (
                  <span className="text-rose-600 text-[11px]">
                    * {lang === 'ar' ? 'مطلوب' : 'Required'}
                  </span>
                )}
              </label>
              <select
                value={mapping[key] || ''}
                onChange={(e) =>
                  setMapping({ ...mapping, [key]: e.target.value })
                }
                className="w-full bg-white border border-[#D9E1E8] rounded-xl px-3 py-2.5 text-sm text-[#17212B] focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="">
                  -- {lang === 'ar' ? 'اختر العمود' : 'Select Column'} --
                </option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {!isValid && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'يرجى تحديد أعمدة الكمية والبراند والمنطقة على الأقل'
                  : 'Please map at least Quantity, Brand, and Region'}
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-[#D9E1E8] text-sm text-[#667085] hover:bg-slate-50 font-medium cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-5 py-2.5 rounded-xl bg-[#0A3D62] hover:bg-[#1F6F9F] disabled:opacity-50 text-white text-sm font-bold shadow-sm cursor-pointer"
            >
              {t.confirmMapping}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
