import React, { useState } from 'react';
import { X, Target, Save, RefreshCw } from 'lucide-react';
import { Language, AggregatedItem, TargetEntry } from '../types';
import { useBodyScrollLock } from '../utils/scrollLock';
import { useBackModal } from '../utils/backNavigation';

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  metric: 'qty' | 'value';
  items: AggregatedItem[];
  savedTargets: Record<string, TargetEntry>;
  overallTargetQty?: number;
  overallTargetValue?: number;
  onSaveTargets: (
    overallQty: number | undefined,
    overallVal: number | undefined,
    targets: Record<string, TargetEntry>
  ) => void;
}

export const TargetModal: React.FC<TargetModalProps> = ({
  isOpen,
  onClose,
  lang,
  metric,
  items,
  savedTargets,
  overallTargetQty,
  overallTargetValue,
  onSaveTargets
}) => {
  const isRtl = lang === 'ar';
  const isValueMetric = metric === 'value';

  const [overallInput, setOverallInput] = useState<string>(
    isValueMetric
      ? overallTargetValue ? String(overallTargetValue) : ''
      : overallTargetQty ? String(overallTargetQty) : ''
  );

  const [localTargets, setLocalTargets] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      const entry = savedTargets[item.id] || savedTargets[item.name];
      if (entry) {
        const val = isValueMetric ? entry.value : entry.qty;
        if (val !== undefined) map[item.id] = val;
      }
    }
    return map;
  });

  useBodyScrollLock(isOpen);
  useBackModal(isOpen, onClose, 'target-config-modal', 25);

  if (!isOpen) return null;

  // Auto-distribute overall target proportionally based on current actuals
  const handleAutoDistribute = () => {
    const totalTarget = parseFloat(overallInput);
    if (isNaN(totalTarget) || totalTarget <= 0) return;

    const totalActual = items.reduce(
      (sum, it) => sum + (isValueMetric ? it.value : it.qty),
      0
    );

    const newMap: Record<string, number> = {};
    if (totalActual > 0) {
      for (const it of items) {
        const share = (isValueMetric ? it.value : it.qty) / totalActual;
        newMap[it.id] = Math.round(totalTarget * share);
      }
    } else {
      const equalShare = Math.round(totalTarget / Math.max(1, items.length));
      for (const it of items) {
        newMap[it.id] = equalShare;
      }
    }
    setLocalTargets(newMap);
  };

  const handleItemTargetChange = (id: string, valStr: string) => {
    const num = parseFloat(valStr);
    setLocalTargets((prev) => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num
    }));
  };

  const handleSave = () => {
    const overallNum = parseFloat(overallInput) || undefined;
    const targetsStore: Record<string, TargetEntry> = { ...savedTargets };

    for (const it of items) {
      const val = localTargets[it.id];
      if (val !== undefined && val > 0) {
        const existing = targetsStore[it.name] || targetsStore[it.id] || {};
        targetsStore[it.name] = isValueMetric
          ? { ...existing, value: val }
          : { ...existing, qty: val };
      }
    }

    const nextOverallQty = !isValueMetric ? overallNum : overallTargetQty;
    const nextOverallVal = isValueMetric ? overallNum : overallTargetValue;

    onSaveTargets(nextOverallQty, nextOverallVal, targetsStore);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-[#D9E1E8] flex flex-col max-h-[85vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#D9E1E8] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#17212B]">
                {isRtl ? 'إعدادات المستهدف (Target)' : 'Target Configuration'}
              </h3>
              <p className="text-xs text-slate-500">
                {isValueMetric
                  ? isRtl ? 'تحديد تارجت القيمة (ج.م)' : 'Configure Value Targets (EGP)'
                  : isRtl ? 'تحديد تارجت الكميات (وحدات)' : 'Configure Unit/Qty Targets'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Overall Target Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <label className="block text-xs font-bold text-amber-900">
              {isRtl ? 'المستهدف الإجمالي العام:' : 'Overall Target Total:'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={overallInput}
                onChange={(e) => setOverallInput(e.target.value)}
                placeholder={isRtl ? 'أدخل الرقم الإجمالي...' : 'Enter overall total...'}
                className="flex-1 px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAutoDistribute}
                disabled={!overallInput}
                className="px-3 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 disabled:opacity-40 transition-all flex items-center gap-1 shrink-0"
                title={isRtl ? 'توزيع تلقائي حسب نسبة المبيعات الفعلية' : 'Distribute proportionally'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isRtl ? 'توزيع نسبي' : 'Distribute'}</span>
              </button>
            </div>
          </div>

          {/* Per-item list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700">
              {isRtl ? 'أو أدخل المستهدف لكل عنصر بالتفصيل:' : 'Or customize targets per item:'}
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              {items.map((it) => (
                <div key={it.id} className="p-2.5 flex items-center justify-between text-xs bg-white hover:bg-slate-50">
                  <div className="min-w-0 me-3">
                    <p className="font-bold text-slate-800 truncate">{it.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {isRtl ? 'الفعلي:' : 'Actual:'}{' '}
                      {(isValueMetric ? it.value : it.qty).toLocaleString()}
                    </p>
                  </div>
                  <input
                    type="number"
                    value={localTargets[it.id] !== undefined ? localTargets[it.id] : ''}
                    onChange={(e) => handleItemTargetChange(it.id, e.target.value)}
                    placeholder="0"
                    className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-end font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#0A3D62]"
                  />
                </div>
              ))}
            </div>
          </div>
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
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#0A3D62] text-white text-xs font-bold hover:bg-[#082d49] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isRtl ? 'حفظ وتطبيق' : 'Save & Apply'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
