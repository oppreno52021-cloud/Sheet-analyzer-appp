import React, { useState, useMemo } from 'react';
import { X, Search, CheckSquare, Square, Check } from 'lucide-react';
import { Language } from '../types';
import { useBodyScrollLock } from '../utils/scrollLock';
import { useBackModal } from '../utils/backNavigation';

export interface SelectOption {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: Array<string | SelectOption>;
  selectedValues: string[];
  onChange: (vals: string[]) => void;
  lang: Language;
}

export const MultiSelectModal: React.FC<MultiSelectModalProps> = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValues,
  onChange,
  lang
}) => {
  const isRtl = lang === 'ar';
  const [search, setSearch] = useState('');
  const [localSelected, setLocalSelected] = useState<string[]>(selectedValues);

  // Normalize options to SelectOption format
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Sync on open
  React.useEffect(() => {
    setLocalSelected(selectedValues);
    setSearch('');
  }, [isOpen, selectedValues]);

  useBodyScrollLock(isOpen);
  useBackModal(isOpen, onClose, 'multiselect-modal', 25);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const query = search.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
    );
  }, [normalizedOptions, search]);

  if (!isOpen) return null;

  const toggleOption = (val: string) => {
    setLocalSelected((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  };

  const handleSelectAll = () => {
    setLocalSelected(normalizedOptions.map((o) => o.value));
  };

  const handleClearAll = () => {
    setLocalSelected([]);
  };

  const handleApply = () => {
    onChange(localSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[#D9E1E8] flex flex-col max-h-[85vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#D9E1E8] flex items-center justify-between bg-slate-50">
          <div className="min-w-0 me-2">
            <h3 className="text-sm sm:text-base font-black text-[#17212B] truncate">{title}</h3>
            <p className="text-xs text-slate-500">
              {localSelected.length === 0
                ? isRtl
                  ? 'الكل محدد (بدون فلترة)'
                  : 'All selected (no filter)'
                : `${localSelected.length} ${isRtl ? 'محدد من أصل' : 'selected of'} ${normalizedOptions.length}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Quick Actions */}
        <div className="p-3 border-b border-slate-100 space-y-2 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRtl ? 'بحث في الخيارات...' : 'Search options...'}
              className="w-full ps-9 pe-3 py-2 rounded-xl border border-[#D9E1E8] text-xs focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#0A3D62] hover:underline font-bold"
              >
                {isRtl ? 'تحديد الكل' : 'Select All'}
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-500 hover:underline font-semibold"
              >
                {isRtl ? 'إلغاء التحديد (الكل)' : 'Clear (All)'}
              </button>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              {filteredOptions.length} {isRtl ? 'عنصر' : 'items'}
            </span>
          </div>
        </div>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-50">
          {filteredOptions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              {isRtl ? 'لا توجد نتائج مطابقة للبحث' : 'No matching options'}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = localSelected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className={`w-full text-start px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-colors ${
                    isSelected
                      ? 'bg-sky-50 text-[#0A3D62] font-bold'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="truncate me-2">{opt.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {opt.count !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        {opt.count.toLocaleString()}
                      </span>
                    )}
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#0A3D62]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#D9E1E8] bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-[#0A3D62] text-white text-xs font-bold hover:bg-[#082d49] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>{isRtl ? 'تطبيق الفلترة' : 'Apply Filter'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
