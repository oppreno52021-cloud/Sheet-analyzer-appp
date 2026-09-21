import React, { useState, useMemo, useEffect } from 'react';
import {
  Language,
  MetricType,
  ColumnClassification,
  SavedSheetPreset,
  SheetMode
} from '../types';
import { getTranslation } from '../utils/translations';
import {
  SlidersHorizontal,
  Filter,
  Check,
  BarChart3,
  Layers,
  MapPin,
  Building2,
  User,
  Users,
  Package,
  Tag,
  Store,
  X,
  Coins,
  Scale,
  ShoppingCart,
  Percent,
  FileSpreadsheet,
  Plus,
  Trash2,
  Target
} from 'lucide-react';
import { useBackModal } from '../utils/backNavigation';
import { useBodyScrollLock } from '../utils/scrollLock';

interface DynamicFilterWizardModalProps {
  isOpen: boolean;
  availableColumns: string[];
  dimensions?: ColumnClassification[];
  metrics?: ColumnClassification[];
  recommendedDimensions?: string[];
  detectedQtyCol?: string;
  detectedValueCol?: string;
  detectedTargetCol?: string;
  initialSelectedColumns: string[];
  initialMetric: MetricType;
  initialPrimaryMetricCol?: string;
  initialSecondaryMetricCol?: string;
  initialEnableTarget?: boolean;
  initialSheetType?: SheetMode;
  initialShowPercentage?: boolean;
  matchedPreset?: SavedSheetPreset | null;
  onApply: (
    selectedColumns: string[],
    chosenMetric: MetricType,
    enableTarget: boolean,
    saveAsPreset: boolean,
    presetName?: string,
    primaryMetricCol?: string,
    secondaryMetricCol?: string,
    sheetType?: SheetMode,
    showPercentage?: boolean
  ) => void;
  onCancel: () => void;
  lang: Language;
}

export const DynamicFilterWizardModal: React.FC<DynamicFilterWizardModalProps> = ({
  isOpen,
  availableColumns,
  dimensions = [],
  metrics = [],
  recommendedDimensions = [],
  detectedQtyCol,
  detectedValueCol,
  detectedTargetCol,
  initialSelectedColumns,
  initialMetric,
  initialPrimaryMetricCol,
  initialSecondaryMetricCol,
  initialEnableTarget = false,
  initialSheetType,
  initialShowPercentage,
  matchedPreset,
  onApply,
  onCancel,
  lang
}) => {
  const t = getTranslation(lang);
  const isRtl = lang === 'ar';

  // Active top tab: 'sheetType' or 'filters'
  const [activeTab, setActiveTab] = useState<'sheetType' | 'filters'>('sheetType');

  // Sheet Mode: 'sales' or 'general'
  const [sheetType, setSheetType] = useState<SheetMode>(() => {
    if (initialSheetType) return initialSheetType;
    if (matchedPreset?.sheetType) return matchedPreset.sheetType;
    return 'sales';
  });

  // Sales mode metric nature: 'qty' | 'value' | 'both'
  const [salesMetricMode, setSalesMetricMode] = useState<MetricType>(() => {
    if (initialMetric === 'value') return 'value';
    if (initialMetric === 'both') return 'both';
    if (initialSecondaryMetricCol || detectedValueCol) return 'both';
    return 'qty';
  });

  // Numeric Candidate Columns
  const numericCandidateCols = useMemo(() => {
    const list: string[] = [];
    if (metrics.length > 0) {
      metrics.forEach((m) => {
        if (!list.includes(m.name)) list.push(m.name);
      });
    }
    if (detectedQtyCol && !list.includes(detectedQtyCol)) list.push(detectedQtyCol);
    if (detectedValueCol && !list.includes(detectedValueCol)) list.push(detectedValueCol);
    if (detectedTargetCol && !list.includes(detectedTargetCol)) list.push(detectedTargetCol);

    if (list.length === 0) {
      availableColumns.forEach((c) => {
        if (/qty|val|amount|total|صافي|مبلغ|قيمة|كمية|سعر|مرتب|درجة|رصيد/i.test(c)) {
          if (!list.includes(c)) list.push(c);
        }
      });
    }
    return list;
  }, [metrics, detectedQtyCol, detectedValueCol, detectedTargetCol, availableColumns]);

  // Primary (Qty) & Secondary (Value) Column selectors
  const [primaryMetricCol, setPrimaryMetricCol] = useState<string>(() => {
    return initialPrimaryMetricCol || detectedQtyCol || numericCandidateCols[0] || '';
  });
  const [secondaryMetricCol, setSecondaryMetricCol] = useState<string>(() => {
    return initialSecondaryMetricCol || detectedValueCol || (numericCandidateCols.length > 1 ? numericCandidateCols[1] : '');
  });

  // General sheet single primary column
  const [generalMetricCol, setGeneralMetricCol] = useState<string>(() => {
    return initialPrimaryMetricCol || numericCandidateCols[0] || '';
  });

  // Target card toggle (whether to show the Target vs Actual card in Analyze)
  const [enableTarget, setEnableTarget] = useState<boolean>(() => {
    if (typeof initialEnableTarget === 'boolean') return initialEnableTarget;
    return Boolean(detectedTargetCol);
  });

  // Percentage % toggle
  const [showPercentage, setShowPercentage] = useState<boolean>(() => {
    if (typeof initialShowPercentage === 'boolean') return initialShowPercentage;
    if (typeof matchedPreset?.showPercentage === 'boolean') return matchedPreset.showPercentage;
    return true;
  });

  // Display columns (Column 1, Column 2, and extra columns)
  const [col1, setCol1] = useState<string>('');
  const [col2, setCol2] = useState<string>('');
  const [extraCols, setExtraCols] = useState<string[]>([]);

  // Filter columns list (which columns will be available as active filter pills)
  const [selectedFilterCols, setSelectedFilterCols] = useState<string[]>(initialSelectedColumns);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('sheetType');
      const sType = initialSheetType || matchedPreset?.sheetType || 'sales';
      setSheetType(sType);

      const pCol = initialPrimaryMetricCol || detectedQtyCol || numericCandidateCols[0] || '';
      const sCol =
        initialSecondaryMetricCol ||
        detectedValueCol ||
        (numericCandidateCols.length > 1 && numericCandidateCols[1] !== pCol ? numericCandidateCols[1] : '');
      setPrimaryMetricCol(pCol);
      setSecondaryMetricCol(sCol);
      setGeneralMetricCol(pCol || numericCandidateCols[0] || '');

      const initialCols =
        initialSelectedColumns.length > 0
          ? initialSelectedColumns
          : recommendedDimensions.length > 0
          ? recommendedDimensions
          : availableColumns.slice(0, 4);

      setCol1(initialCols[0] || availableColumns[0] || '');
      setCol2(initialCols[1] || (availableColumns.length > 1 ? availableColumns[1] : ''));
      setExtraCols(initialCols.slice(2));

      setSelectedFilterCols(initialCols);

      if (initialMetric) {
        setSalesMetricMode(initialMetric);
      } else if (sCol) {
        setSalesMetricMode('both');
      } else {
        setSalesMetricMode('qty');
      }

      setEnableTarget(initialEnableTarget || Boolean(detectedTargetCol));

      if (typeof initialShowPercentage === 'boolean') {
        setShowPercentage(initialShowPercentage);
      } else if (typeof matchedPreset?.showPercentage === 'boolean') {
        setShowPercentage(matchedPreset.showPercentage);
      } else {
        setShowPercentage(true);
      }
    }
  }, [
    isOpen,
    initialSelectedColumns,
    recommendedDimensions,
    availableColumns,
    initialMetric,
    initialPrimaryMetricCol,
    initialSecondaryMetricCol,
    initialEnableTarget,
    initialSheetType,
    initialShowPercentage,
    detectedTargetCol,
    detectedQtyCol,
    detectedValueCol,
    matchedPreset,
    numericCandidateCols
  ]);

  useBackModal(isOpen, onCancel, 'filter-wizard-modal', 25);
  useBodyScrollLock(isOpen);

  // Available non-metric columns for Column 1, 2, and extra columns
  const availableDimensionCols = useMemo(() => {
    return availableColumns.filter(
      (c) => c !== primaryMetricCol && c !== secondaryMetricCol && c !== generalMetricCol
    );
  }, [availableColumns, primaryMetricCol, secondaryMetricCol, generalMetricCol]);

  // Dimension items list for filter tab
  const dimensionColList = useMemo(() => {
    const rawList =
      dimensions.length > 0
        ? [...dimensions]
        : availableColumns.map((col) => ({
            name: col,
            type: 'dimension' as const,
            semanticType: 'other' as const,
            sampleValues: [],
            uniqueCount: 0,
            isNumeric: false
          }));

    return rawList.sort((a, b) => a.name.localeCompare(b.name, isRtl ? 'ar' : 'en'));
  }, [dimensions, availableColumns, isRtl]);

  if (!isOpen) return null;

  const handleAddExtraCol = () => {
    const candidate = availableDimensionCols.find(
      (c) => c !== col1 && c !== col2 && !extraCols.includes(c)
    );
    if (candidate) {
      setExtraCols([...extraCols, candidate]);
    } else if (availableColumns.length > 0) {
      const anyCandidate = availableColumns.find(
        (c) => c !== col1 && c !== col2 && !extraCols.includes(c)
      );
      if (anyCandidate) setExtraCols([...extraCols, anyCandidate]);
    }
  };

  const handleRemoveExtraCol = (index: number) => {
    setExtraCols(extraCols.filter((_, i) => i !== index));
  };

  const toggleFilterCol = (col: string) => {
    if (selectedFilterCols.includes(col)) {
      setSelectedFilterCols(selectedFilterCols.filter((c) => c !== col));
    } else {
      setSelectedFilterCols([...selectedFilterCols, col]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Compile active display / dimension columns
    const combinedCols: string[] = [];
    if (col1 && !combinedCols.includes(col1)) combinedCols.push(col1);
    if (col2 && !combinedCols.includes(col2)) combinedCols.push(col2);
    extraCols.forEach((c) => {
      if (c && !combinedCols.includes(c)) combinedCols.push(c);
    });

    // Also ensure any filter column checked in tab 2 is preserved
    selectedFilterCols.forEach((fc) => {
      if (fc && !combinedCols.includes(fc)) combinedCols.push(fc);
    });

    // Fallback if none selected
    if (combinedCols.length === 0) {
      if (availableColumns.length > 0) combinedCols.push(availableColumns[0]);
    }

    let finalPrimary = '';
    let finalSecondary: string | undefined = undefined;
    let finalMetric: MetricType = 'qty';

    if (sheetType === 'sales') {
      if (salesMetricMode === 'both') {
        finalPrimary = primaryMetricCol || numericCandidateCols[0] || '';
        finalSecondary = secondaryMetricCol || (numericCandidateCols.length > 1 ? numericCandidateCols[1] : undefined);
        finalMetric = 'both';
      } else if (salesMetricMode === 'value') {
        finalPrimary = secondaryMetricCol || numericCandidateCols[0] || '';
        finalSecondary = undefined;
        finalMetric = 'value';
      } else {
        finalPrimary = primaryMetricCol || numericCandidateCols[0] || '';
        finalSecondary = undefined;
        finalMetric = 'qty';
      }
    } else {
      finalPrimary = generalMetricCol || numericCandidateCols[0] || '';
      finalSecondary = undefined;
      finalMetric = 'qty';
    }

    onApply(
      combinedCols,
      finalMetric,
      sheetType === 'sales' ? enableTarget : false,
      true,
      matchedPreset?.name || (isRtl ? (sheetType === 'sales' ? 'شيت مبيعات' : 'شيت بيانات عامة') : 'Analysis Preset'),
      finalPrimary,
      finalSecondary,
      sheetType,
      showPercentage
    );
  };

  const getDimensionIcon = (semantic?: string) => {
    const iconClass = 'w-3.5 h-3.5 text-slate-500 shrink-0';
    switch (semantic) {
      case 'region':
        return <MapPin className={iconClass} />;
      case 'branch':
        return <Building2 className={iconClass} />;
      case 'customer':
        return <Store className={iconClass} />;
      case 'rep':
        return <User className={iconClass} />;
      case 'supervisor':
        return <Users className={iconClass} />;
      case 'product':
        return <Package className={iconClass} />;
      case 'item':
      case 'brand':
        return <Tag className={iconClass} />;
      default:
        return <Layers className={iconClass} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn modal-overlay"
      dir={isRtl ? 'rtl' : 'ltr'}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp modal-content-scroll">
        {/* Top Header */}
        <div className="bg-[#0A3D62] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-sky-200" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                {isRtl ? 'إعدادات التحليل' : 'Analysis Setup'}
              </h2>
              <p className="text-[11px] text-sky-200/80">
                {isRtl
                  ? 'حدد نوع الشيت والأعمدة والفلاتر المطلوبة'
                  : 'Configure sheet type, metrics, and filters'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Dual Control Buttons: [ نوع الشيت ] and [ الفلاتر ] */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('sheetType')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
              activeTab === 'sheetType'
                ? 'bg-[#0A3D62] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isRtl ? 'نوع الشيت' : 'Sheet Type'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('filters')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
              activeTab === 'filters'
                ? 'bg-[#0A3D62] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{isRtl ? 'الفلاتر' : 'Filters'}</span>
            {selectedFilterCols.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'filters' ? 'bg-white/20 text-white' : 'bg-[#0A3D62] text-white'
                }`}
              >
                {selectedFilterCols.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: SHEET TYPE & CONFIGURATION */}
          {activeTab === 'sheetType' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Sheet Mode Selection (Sales vs General Data) */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#0A3D62]" />
                  <span>{isRtl ? 'اختر نوع الشيت المرفوع:' : 'Select sheet type:'}</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Sales Sheet Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSheetType('sales');
                      setShowPercentage(true);
                    }}
                    className={`p-3 rounded-xl border-2 text-start transition-all cursor-pointer flex flex-col justify-between ${
                      sheetType === 'sales'
                        ? 'border-[#0A3D62] bg-[#EAF3F8] shadow-2xs ring-1 ring-[#0A3D62]/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          sheetType === 'sales' ? 'bg-[#0A3D62] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      {sheetType === 'sales' && (
                        <div className="w-5 h-5 rounded-full bg-[#0A3D62] text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs block text-slate-900">
                        {isRtl ? 'شيت مبيعات' : 'Sales Sheet'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {isRtl ? 'كميات، مبالغ، تارجت، ونسب' : 'Quantities, values, & targets'}
                      </span>
                    </div>
                  </button>

                  {/* General Data Sheet Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSheetType('general');
                      setShowPercentage(false);
                    }}
                    className={`p-3 rounded-xl border-2 text-start transition-all cursor-pointer flex flex-col justify-between ${
                      sheetType === 'general'
                        ? 'border-[#0A3D62] bg-[#EAF3F8] shadow-2xs ring-1 ring-[#0A3D62]/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          sheetType === 'general' ? 'bg-[#0A3D62] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      {sheetType === 'general' && (
                        <div className="w-5 h-5 rounded-full bg-[#0A3D62] text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs block text-slate-900">
                        {isRtl ? 'شيت بيانات عامة' : 'General Data Sheet'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {isRtl ? 'مخزون، موظفين، حصر بيانات' : 'Inventory, staff, counts'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SALES SHEET SPECIFIC CONTROLS */}
              {sheetType === 'sales' && (
                <div className="space-y-3.5 pt-2 border-t border-slate-200 animate-fadeIn">
                  {/* Metric Nature: Quantity, Value, Both */}
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 space-y-2">
                    <label className="text-xs font-extrabold text-slate-800 block">
                      {isRtl ? 'طبيعة حساب المبيعات المتوفرة بالشيت:' : 'Sales metric types available:'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSalesMetricMode('qty')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          salesMetricMode === 'qty'
                            ? 'bg-[#0A3D62] text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'كمية' : 'Quantity'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSalesMetricMode('value')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          salesMetricMode === 'value'
                            ? 'bg-[#0A3D62] text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'قيمة' : 'Value'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSalesMetricMode('both')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          salesMetricMode === 'both'
                            ? 'bg-[#0A3D62] text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'كلاهما' : 'Both'}</span>
                      </button>
                    </div>

                    {/* Choose Columns matching selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {(salesMetricMode === 'qty' || salesMetricMode === 'both') && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {isRtl ? 'عمود الكمية الفعلي من الشيت:' : 'Quantity column from sheet:'}
                          </label>
                          <select
                            value={primaryMetricCol}
                            onChange={(e) => setPrimaryMetricCol(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3D62] cursor-pointer"
                          >
                            {numericCandidateCols.length > 0 ? (
                              numericCandidateCols.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))
                            ) : (
                              availableColumns.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      )}

                      {(salesMetricMode === 'value' || salesMetricMode === 'both') && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {isRtl ? 'عمود القيمة / المبلغ الفعلي:' : 'Value / Amount column:'}
                          </label>
                          <select
                            value={secondaryMetricCol}
                            onChange={(e) => setSecondaryMetricCol(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3D62] cursor-pointer"
                          >
                            {numericCandidateCols.length > 0 ? (
                              numericCandidateCols.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))
                            ) : (
                              availableColumns.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Target Card & Percentage % Controls */}
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableTarget}
                        onChange={(e) => setEnableTarget(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0A3D62] focus:ring-[#0A3D62] cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-[#0A3D62]" />
                          <span>{isRtl ? 'تفعيل كارت المبيعات مقابل التارجت في التحليل' : 'Show Target vs Actual card'}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {isRtl
                            ? 'يتيح لك كتابة وتعديل تارجت الأصناف مباشرة في صفحة التحليل'
                            : 'Allows setting item targets directly in the analysis screen'}
                        </span>
                      </div>
                    </label>

                    <div className="pt-2 border-t border-slate-200/80">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showPercentage}
                          onChange={(e) => setShowPercentage(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0A3D62] focus:ring-[#0A3D62] cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Percent className="w-3.5 h-3.5 text-sky-700" />
                            <span>{isRtl ? 'حساب وإظهار النسبة المئوية %' : 'Show Percentage (%) Column'}</span>
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Display Columns: Column 1, Column 2, and Add Column */}
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#0A3D62]" />
                        <span>{isRtl ? 'أعمدة العرض في جدول التحليل:' : 'Display Columns in Analysis:'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddExtraCol}
                        className="text-[11px] font-bold text-[#0A3D62] hover:text-[#082f4d] flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100/60 hover:bg-sky-100 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isRtl ? 'إضافة عمود' : 'Add column'}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Column 1 */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 w-16 shrink-0">
                          {isRtl ? 'عمود 1:' : 'Column 1:'}
                        </span>
                        <select
                          value={col1}
                          onChange={(e) => setCol1(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3D62] cursor-pointer"
                        >
                          {availableColumns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Column 2 */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 w-16 shrink-0">
                          {isRtl ? 'عمود 2:' : 'Column 2:'}
                        </span>
                        <select
                          value={col2}
                          onChange={(e) => setCol2(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3D62] cursor-pointer"
                        >
                          {availableColumns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Extra Added Columns */}
                      {extraCols.map((col, idx) => (
                        <div key={idx} className="flex items-center gap-2 animate-fadeIn">
                          <span className="text-[11px] font-bold text-slate-500 w-16 shrink-0">
                            {isRtl ? `عمود ${idx + 3}:` : `Column ${idx + 3}:`}
                          </span>
                          <select
                            value={col}
                            onChange={(e) => {
                              const updated = [...extraCols];
                              updated[idx] = e.target.value;
                              setExtraCols(updated);
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3D62] cursor-pointer"
                          >
                            {availableColumns.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraCol(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title={t.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* GENERAL DATA SHEET SPECIFIC CONTROLS */}
              {sheetType === 'general' && (
                <div className="space-y-3.5 pt-2 border-t border-slate-200 animate-fadeIn">
                  {/* Primary Metric / Numeric Column */}
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      {isRtl ? 'العمود الرقمي أو الإحصائي للبيانات:' : 'Primary metric / numeric column:'}
                    </label>
                    <select
                      value={generalMetricCol}
                      onChange={(e) => setGeneralMetricCol(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3D62] cursor-pointer"
                    >
                      {numericCandidateCols.length > 0 ? (
                        numericCandidateCols.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      ) : (
                        availableColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Display Columns: Column 1, Column 2, and Add Column */}
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#0A3D62]" />
                        <span>{isRtl ? 'أعمدة العرض والتصنيف:' : 'Display Columns:'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddExtraCol}
                        className="text-[11px] font-bold text-[#0A3D62] hover:text-[#082f4d] flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100/60 hover:bg-sky-100 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isRtl ? 'إضافة عمود' : 'Add column'}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Column 1 */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 w-16 shrink-0">
                          {isRtl ? 'عمود 1:' : 'Column 1:'}
                        </span>
                        <select
                          value={col1}
                          onChange={(e) => setCol1(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3D62] cursor-pointer"
                        >
                          {availableColumns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Column 2 */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 w-16 shrink-0">
                          {isRtl ? 'عمود 2:' : 'Column 2:'}
                        </span>
                        <select
                          value={col2}
                          onChange={(e) => setCol2(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3D62] cursor-pointer"
                        >
                          {availableColumns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Extra Added Columns */}
                      {extraCols.map((col, idx) => (
                        <div key={idx} className="flex items-center gap-2 animate-fadeIn">
                          <span className="text-[11px] font-bold text-slate-500 w-16 shrink-0">
                            {isRtl ? `عمود ${idx + 3}:` : `Column ${idx + 3}:`}
                          </span>
                          <select
                            value={col}
                            onChange={(e) => {
                              const updated = [...extraCols];
                              updated[idx] = e.target.value;
                              setExtraCols(updated);
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A3D62] cursor-pointer"
                          >
                            {availableColumns.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraCol(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title={t.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FILTERS SELECTION (فلاتر الشيت المتاحة) */}
          {activeTab === 'filters' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="text-xs sm:text-sm font-extrabold text-[#0A3D62] flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-[#0A3D62]" />
                      <span>{isRtl ? 'الأعمدة المراد الفلترة بناءً عليها:' : 'Columns to filter by:'}</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isRtl
                        ? 'اختر الأعمدة التي ترغب في ظهور أزرار الفلترة الخاصة بها أعلى الشاشة'
                        : 'Select columns to appear as quick filters on top'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedFilterCols(dimensionColList.map((d) => d.name))}
                      className="text-[11px] font-bold text-[#0A3D62] hover:text-[#082f4d] bg-sky-100/60 hover:bg-sky-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      {isRtl ? 'الكل' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFilterCols([])}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 px-1 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      {isRtl ? 'إلغاء' : 'Clear'}
                    </button>
                  </div>
                </div>

                {/* Filter Items Checkbox List */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pe-1">
                  {dimensionColList.map((colObj) => {
                    const isSelected = selectedFilterCols.includes(colObj.name);
                    const hasSamples = colObj.sampleValues && colObj.sampleValues.length > 0;

                    return (
                      <button
                        key={colObj.name}
                        type="button"
                        onClick={() => toggleFilterCol(colObj.name)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#EAF3F8] border-[#0A3D62] text-[#0A3D62] shadow-2xs ring-1 ring-[#0A3D62]/30'
                            : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pe-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#0A3D62]/10 text-[#0A3D62]' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {getDimensionIcon(colObj.semanticType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-xs block truncate ${
                                isSelected ? 'font-bold text-[#0A3D62]' : 'font-semibold text-[#17212B]'
                              }`}
                            >
                              {colObj.name}
                            </span>
                            {hasSamples && (
                              <span className="text-[10px] text-slate-500 block truncate">
                                {colObj.sampleValues.slice(0, 3).join(' • ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#0A3D62] text-white border border-[#0A3D62]'
                              : 'border-2 border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] font-bold text-[#0A3D62] pt-1 border-t border-slate-200/60">
                  {isRtl
                    ? `تم اختيار ${selectedFilterCols.length} عمود كفلاتر`
                    : `${selectedFilterCols.length} filter columns selected`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer bg-[#0A3D62] hover:bg-[#082f4d] text-white active:scale-95"
          >
            <span>{isRtl ? 'حفظ وبدء التحليل' : 'Save & Start Analysis'}</span>
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
