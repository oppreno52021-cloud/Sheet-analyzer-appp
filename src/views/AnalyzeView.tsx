import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  ChevronDown,
  Layers,
  Search,
  ArrowUpDown,
  Download,
  RotateCcw,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  Building2,
  Navigation as NavigationIcon,
  HelpCircle,
  Target,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Coins,
  Scale,
  Sparkles,
  Store,
  User,
  Users,
  Package,
  Tag,
  X,
  Calculator,
  Percent,
  Columns,
  Plus
} from 'lucide-react';
import {
  Language,
  SalesRow,
  TerritoryFilter,
  ProductDimension,
  MetricType,
  AggregatedItem,
  SavedTerritory,
  TargetConfigStore,
  TargetComparisonItem,
  TargetEntry,
  SheetAnalysisResult,
  LoadedFileMeta,
  SheetMode
} from '../types';
import { getTranslation } from '../utils/translations';
import { MultiSelectModal } from '../components/MultiSelectModal';
import { TargetModal } from '../components/TargetModal';
import { ColumnsSetupModal } from '../components/ColumnsSetupModal';
import { getSavedTargets, saveTargetsConfig } from '../utils/storage';
import {
  exportResultsToExcel,
  exportResultsToCsv,
  exportTargetResultsToExcel,
  exportTargetResultsToCsv
} from '../utils/excelParser';
import { useBackModal } from '../utils/backNavigation';

interface AnalyzeViewProps {
  lang: Language;
  rows: SalesRow[];
  fileMeta?: LoadedFileMeta | null;
  activeDimensionColumns: string[];
  dynamicFilters: Record<string, string[]>;
  setDynamicFilters: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  selectedAnalyzeColumn: string;
  setSelectedAnalyzeColumn: (col: string) => void;
  metric: MetricType;
  setMetric: (metric: MetricType) => void;
  primaryMetricCol?: string;
  secondaryMetricCol?: string;
  targetComparisonEnabled: boolean;
  setTargetComparisonEnabled: (enabled: boolean) => void;
  sheetAnalysis?: SheetAnalysisResult | null;
  sheetType?: SheetMode;
  showPercentage?: boolean;
  onTogglePercentage?: () => void;
  onOpenWizard: () => void;
  savedTerritory: SavedTerritory | null;
  onSaveTerritory: () => void;
  onApplySavedTerritory: () => void;
  onSaveAnalysis: (name: string) => void;
  onReset: () => void;
  onOpenAdmin?: () => void;
  presetAppliedBanner?: boolean;
  onDismissPresetBanner?: () => void;
  onAddDimensionColumn?: (col: string) => void;
}

export const AnalyzeView: React.FC<AnalyzeViewProps> = ({
  lang,
  rows,
  fileMeta,
  activeDimensionColumns,
  dynamicFilters,
  setDynamicFilters,
  selectedAnalyzeColumn,
  setSelectedAnalyzeColumn,
  metric,
  setMetric,
  primaryMetricCol,
  secondaryMetricCol,
  targetComparisonEnabled,
  setTargetComparisonEnabled,
  sheetAnalysis,
  sheetType = 'sales',
  showPercentage = true,
  onTogglePercentage,
  onOpenWizard,
  savedTerritory,
  onSaveTerritory,
  onApplySavedTerritory,
  onSaveAnalysis,
  onReset,
  onOpenAdmin,
  presetAppliedBanner = false,
  onDismissPresetBanner,
  onAddDimensionColumn
}) => {
  const t = getTranslation(lang);
  const isRtl = lang === 'ar';

  // Active column being edited in MultiSelectModal
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [isSaveAnalysisOpen, setIsSaveAnalysisOpen] = useState(false);
  const [analysisNameInput, setAnalysisNameInput] = useState('');

  // Lock body scroll whenever save analysis modal is open
  React.useEffect(() => {
    if (!isSaveAnalysisOpen) return;
    const originalScrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = `-${originalScrollY}px`;
    return () => {
      document.body.classList.remove('modal-open');
      const top = document.body.style.top;
      document.body.style.top = '';
      if (top) window.scrollTo(0, -parseInt(top, 10));
    };
  }, [isSaveAnalysisOpen]);

  // Table search & sort
  const [tableSearch, setTableSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const handleTableSearchChange = (val?: string) => {
    setTableSearch(val || '');
  };

  // View mode: 'sales' (Sales Analysis) vs 'target' (Target vs Actual Comparison)
  const [viewMode, setViewMode] = useState<'sales' | 'target'>('sales');

  // If target comparison is disabled or sheet is general, ensure viewMode resets to sales
  React.useEffect(() => {
    if (!targetComparisonEnabled || sheetType !== 'sales') {
      setViewMode('sales');
    }
  }, [targetComparisonEnabled, sheetType]);

  // Target Settings Modal state & persistence (💡 Suggestion 3)
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetConfig, setTargetConfig] = useState<TargetConfigStore>(() => getSavedTargets());
  const [targetFilter, setTargetFilter] = useState<'all' | 'achieved' | 'deficit'>('all');

  // Export menu toggle
  const [showExportMenu, setShowExportMenu] = useState(false);

  // User-pinned/added columns for the dimension bar (persist across switches)
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([]);

  // Interactive row selection & drill-down states
  interface SelectedTableRowAction {
    column: string;
    name: string;
    qty: number;
    value: number;
    share: number;
  }
  interface DrillDownStep {
    parentColumn: string;
    parentItem: string;
    previousSelectedColumn: string;
  }
  interface IsolatedFilterStep {
    column: string;
    item: string;
  }
  const [activeRowAction, setActiveRowAction] = useState<SelectedTableRowAction | null>(null);
  const [showDrillDownOptions, setShowDrillDownOptions] = useState(false);
  const [drillDownHistory, setDrillDownHistory] = useState<DrillDownStep | null>(null);
  const [isolatedFilterHistory, setIsolatedFilterHistory] = useState<IsolatedFilterStep | null>(null);

  // Fallback active columns if not initialized - dynamic to uploaded sheet headers
  const displayFilterColumns = useMemo(() => {
    if (activeDimensionColumns && activeDimensionColumns.length > 0) {
      return activeDimensionColumns;
    }
    if (sheetAnalysis?.recommendedDimensions && sheetAnalysis.recommendedDimensions.length > 0) {
      return sheetAnalysis.recommendedDimensions;
    }
    if (fileMeta?.columns && fileMeta.columns.length > 0) {
      return fileMeta.columns.slice(0, 4);
    }
    return [];
  }, [activeDimensionColumns, sheetAnalysis, fileMeta]);

  // Auto-Adaptive Metric Names & Dynamic Dual-Metric Detection
  const effectivePrimaryCol = useMemo(() => {
    if (primaryMetricCol && primaryMetricCol.trim()) return primaryMetricCol.trim();
    if (sheetType === 'sales' && sheetAnalysis?.detectedQtyCol) return sheetAnalysis.detectedQtyCol;
    if (sheetAnalysis?.metrics && sheetAnalysis.metrics.length > 0) return sheetAnalysis.metrics[0].name;
    return isRtl ? (sheetType === 'sales' ? 'الكمية' : 'القيمة') : (sheetType === 'sales' ? 'Units' : 'Value');
  }, [primaryMetricCol, sheetAnalysis, sheetType, isRtl]);

  const effectiveSecondaryCol = useMemo(() => {
    // If sheetType is 'general', there is no secondary metric by definition
    if (sheetType === 'general') return '';

    if (secondaryMetricCol && secondaryMetricCol.trim() && secondaryMetricCol.trim() !== effectivePrimaryCol) {
      return secondaryMetricCol.trim();
    }
    // Only fall back to auto-detected value column if secondaryMetricCol was not explicitly set to empty string
    if (secondaryMetricCol === undefined && sheetAnalysis?.detectedValueCol && sheetAnalysis.detectedValueCol !== effectivePrimaryCol) {
      return sheetAnalysis.detectedValueCol;
    }
    return '';
  }, [sheetType, secondaryMetricCol, effectivePrimaryCol, sheetAnalysis]);

  const hasDualMetrics = useMemo(() => {
    if (sheetType === 'general') return false;
    return Boolean(
      effectiveSecondaryCol &&
      effectiveSecondaryCol.trim().length > 0 &&
      effectiveSecondaryCol.trim() !== effectivePrimaryCol.trim()
    );
  }, [sheetType, effectiveSecondaryCol, effectivePrimaryCol]);

  const isSecondaryCurrency = useMemo(() => {
    return /val|قيمة|مبلغ|صافي|net|egp|سعر|price|cost|تكلفة|مرتب|راتب/i.test(effectiveSecondaryCol);
  }, [effectiveSecondaryCol]);

  // All columns shown in the Analyze By bar: default dimensions + user-added columns pinned permanently
  const allAnalyzeDimensionColumns = useMemo(() => {
    const combined = [...displayFilterColumns];
    pinnedColumns.forEach((col) => {
      if (!combined.includes(col)) {
        combined.push(col);
      }
    });
    return combined;
  }, [displayFilterColumns, pinnedColumns]);

  // All non-metric columns available in the uploaded sheet for "Analyze By"
  const allCandidateColumns = useMemo(() => {
    if (fileMeta?.columns && fileMeta.columns.length > 0) {
      return fileMeta.columns;
    }
    return allAnalyzeDimensionColumns;
  }, [fileMeta, allAnalyzeDimensionColumns]);

  // Other columns available in the sheet not yet added to the bar
  const otherSheetColumns = useMemo(() => {
    return allCandidateColumns.filter((col: string) => !allAnalyzeDimensionColumns.includes(col));
  }, [allCandidateColumns, allAnalyzeDimensionColumns]);

  // Horizontal scroll container ref and indicator state for "Analyze By"
  const chipsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const el = chipsScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // In RTL or LTR, determine if there is overflow
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 2) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    // Check absolute scroll range
    const absScroll = Math.abs(scrollLeft);
    if (isRtl) {
      setCanScrollLeft(absScroll < maxScroll - 5);
      setCanScrollRight(absScroll > 5);
    } else {
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < maxScroll - 5);
    }
  };

  useEffect(() => {
    checkScrollability();
    const el = chipsScrollRef.current;
    if (!el) return;
    const handleScroll = () => checkScrollability();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [allAnalyzeDimensionColumns, otherSheetColumns, isRtl]);

  const handleScrollChips = (direction: 'forward' | 'backward') => {
    const el = chipsScrollRef.current;
    if (!el) return;
    const scrollAmount = 140;
    // For RTL, forward is left (negative scrollLeft), backward is right (positive)
    if (isRtl) {
      const delta = direction === 'forward' ? -scrollAmount : scrollAmount;
      el.scrollBy({ left: delta, behavior: 'smooth' });
    } else {
      const delta = direction === 'forward' ? scrollAmount : -scrollAmount;
      el.scrollBy({ left: delta, behavior: 'smooth' });
    }
    setTimeout(checkScrollability, 200);
  };

  // Effective analyze grouping column
  const effectiveAnalyzeColumn = useMemo(() => {
    if (selectedAnalyzeColumn && allCandidateColumns.includes(selectedAnalyzeColumn)) {
      return selectedAnalyzeColumn;
    }
    return allAnalyzeDimensionColumns[0] || allCandidateColumns[0] || '';
  }, [selectedAnalyzeColumn, allCandidateColumns, allAnalyzeDimensionColumns]);

  // Handle changing analyze grouping column with instant reactivity
  const handleSelectAnalyzeColumn = (colName: string) => {
    setSelectedAnalyzeColumn(colName);
  };

  // Add column permanently to the dimension bar and select it immediately
  const handleAddDimensionColumn = (colName: string) => {
    if (!colName) return;
    setPinnedColumns((prev) => (prev.includes(colName) ? prev : [...prev, colName]));
    if (onAddDimensionColumn) {
      onAddDimensionColumn(colName);
    }
    handleSelectAnalyzeColumn(colName);
  };

  // 1. Filter entire screen by the selected row item
  const handleFilterByItem = (action: SelectedTableRowAction) => {
    setIsolatedFilterHistory({
      column: action.column,
      item: action.name
    });
    setDynamicFilters((prev) => {
      const existing = prev[action.column] || [];
      if (existing.includes(action.name)) return prev;
      return {
        ...prev,
        [action.column]: [...existing, action.name]
      };
    });
    setActiveRowAction(null);
    setShowDrillDownOptions(false);
  };

  // Undo filter isolation
  const handleResetIsolatedFilter = () => {
    if (!isolatedFilterHistory) return;
    const { column, item } = isolatedFilterHistory;
    setDynamicFilters((prev) => {
      const existing = prev[column] || [];
      const updated = existing.filter((val) => val !== item);
      const res = { ...prev };
      if (updated.length > 0) {
        res[column] = updated;
      } else {
        delete res[column];
      }
      return res;
    });
    setIsolatedFilterHistory(null);
  };

  // 2. Drill-down into the selected item broken down by targetColumn
  const handleDrillDownTo = (action: SelectedTableRowAction, targetColumn: string) => {
    setDrillDownHistory({
      parentColumn: action.column,
      parentItem: action.name,
      previousSelectedColumn: effectiveAnalyzeColumn
    });
    // Filter rows by the parent item on the parent dimension
    setDynamicFilters((prev) => ({
      ...prev,
      [action.column]: [action.name]
    }));
    // Switch analyze column to targetColumn
    handleSelectAnalyzeColumn(targetColumn);
    if (onAddDimensionColumn && !activeDimensionColumns.includes(targetColumn)) {
      onAddDimensionColumn(targetColumn);
    }
    setActiveRowAction(null);
    setShowDrillDownOptions(false);
  };

  // Reset drill-down level back to previous level
  const handleResetDrillDown = () => {
    if (!drillDownHistory) return;
    handleSelectAnalyzeColumn(drillDownHistory.previousSelectedColumn);
    setDynamicFilters((prev) => {
      const updated = { ...prev };
      delete updated[drillDownHistory.parentColumn];
      return updated;
    });
    setDrillDownHistory(null);
  };

  // Extract distinct options with counts for a given column
  const getOptionsForColumn = (colName: string) => {
    const counts = new Map<string, number>();

    // Calculate cascading frequency: respect other active filters!
    const activeFiltersList: { col: string; set: Set<string> }[] = [];
    Object.keys(dynamicFilters).forEach((k) => {
      if (k !== colName && dynamicFilters[k]?.length > 0) {
        activeFiltersList.push({ col: k, set: new Set(dynamicFilters[k]) });
      }
    });

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      let matchesOtherFilters = true;

      for (let k = 0; k < activeFiltersList.length; k++) {
        const filterItem = activeFiltersList[k];
        const rawVal =
          r.raw?.[filterItem.col] !== undefined
            ? String(r.raw[filterItem.col]).trim()
            : String((r as any)[filterItem.col.toLowerCase()] || '').trim();
        if (!filterItem.set.has(rawVal)) {
          matchesOtherFilters = false;
          break;
        }
      }

      if (matchesOtherFilters) {
        const val =
          r.raw?.[colName] !== undefined
            ? String(r.raw[colName]).trim()
            : String((r as any)[colName.toLowerCase()] || '').trim();
        if (val) {
          counts.set(val, (counts.get(val) || 0) + 1);
        }
      }
    }

    return Array.from(counts.keys())
      .sort()
      .map((val) => ({ value: val, label: val, count: counts.get(val) }));
  };

  // Current active modal options
  const activeModalOptions = useMemo(() => {
    if (!activeFilterCol) return [];
    return getOptionsForColumn(activeFilterCol);
  }, [activeFilterCol, rows, dynamicFilters]);

  // Main Filter Engine: Filter rows by all active dynamic filters
  const filteredRows = useMemo(() => {
    const activeFiltersList: { col: string; set: Set<string> }[] = [];
    Object.keys(dynamicFilters).forEach((colName) => {
      const selectedVals = dynamicFilters[colName];
      if (selectedVals && selectedVals.length > 0) {
        activeFiltersList.push({ col: colName, set: new Set(selectedVals) });
      }
    });

    if (activeFiltersList.length === 0) {
      return rows;
    }

    return rows.filter((r) => {
      for (let k = 0; k < activeFiltersList.length; k++) {
        const filterItem = activeFiltersList[k];
        const rawVal =
          r.raw?.[filterItem.col] !== undefined
            ? String(r.raw[filterItem.col]).trim()
            : String((r as any)[filterItem.col.toLowerCase()] || '').trim();
        if (!filterItem.set.has(rawVal)) {
          return false;
        }
      }
      return true;
    });
  }, [rows, dynamicFilters]);

  // Total count of active filter items across all dimensions
  const totalActiveFiltersCount = useMemo(() => {
    let count = 0;
    Object.values(dynamicFilters).forEach((vals) => {
      if (Array.isArray(vals)) count += vals.length;
    });
    return count;
  }, [dynamicFilters]);

  // Aggregate by effective dimension
  const { aggregatedItems, totalQty, totalValue, totalTargetSum } = useMemo(() => {
    const map = new Map<string, { qty: number; value: number; target: number; count: number }>();
    let sumQ = 0;
    let sumV = 0;
    let sumT = 0;

    for (let i = 0; i < filteredRows.length; i++) {
      const row = filteredRows[i];
      let key = '';

      if (row.raw && row.raw[effectiveAnalyzeColumn] !== undefined) {
        key = String(row.raw[effectiveAnalyzeColumn]).trim();
      } else {
        key = String((row as any)[effectiveAnalyzeColumn.toLowerCase()] || 'Unassigned').trim();
      }
      if (!key) key = 'Unassigned';

      const prev = map.get(key) || { qty: 0, value: 0, target: 0, count: 0 };
      const qInt = Math.round(row.qty || 0);
      const vInt = Math.round(row.value || 0);
      const tInt = Math.round(row.target || 0);
      prev.qty += qInt;
      prev.value += vInt;
      prev.target += tInt;
      prev.count += 1;
      map.set(key, prev);

      sumQ += qInt;
      sumV += vInt;
      sumT += tInt;
    }

    const items: AggregatedItem[] = [];
    map.forEach((data, name) => {
      const shareQty = sumQ !== 0 ? (data.qty / sumQ) * 100 : 0;
      const shareValue = sumV !== 0 ? (data.value / sumV) * 100 : 0;

      items.push({
        id: name,
        name,
        qty: data.qty,
        value: data.value,
        shareQty: Math.max(0, shareQty),
        shareValue: Math.max(0, shareValue),
        rowCount: data.count
      });
    });

    return {
      aggregatedItems: items,
      totalQty: sumQ,
      totalValue: sumV,
      totalTargetSum: sumT
    };
  }, [filteredRows, effectiveAnalyzeColumn]);

  // Filter & Sort table items for display
  const displayItems = useMemo(() => {
    let list = aggregatedItems;

    if (tableSearch && tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      list = list.filter((it) => (it.name || '').toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      const valA = hasDualMetrics && metric === 'value' ? a.value : a.qty;
      const valB = hasDualMetrics && metric === 'value' ? b.value : b.qty;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [aggregatedItems, tableSearch, sortOrder, metric, hasDualMetrics]);

  // Target comparison calculation (💡 Suggestion 3)
  const targetItems: TargetComparisonItem[] = useMemo(() => {
    const isVal = hasDualMetrics && metric === 'value';
    const totalActual = isVal ? totalValue : totalQty;
    const overallTarget =
      isVal ? targetConfig.overallTargetValue : targetConfig.overallTargetQty;

    return aggregatedItems.map((item) => {
      const actual = isVal ? item.value : item.qty;

      let targetVal: number;
      // 1. If row had a target column detected from Excel file
      if (totalTargetSum > 0) {
        // Calculate item target from filtered rows matching this item
        let rowTarget = 0;
        for (let i = 0; i < filteredRows.length; i++) {
          const r = filteredRows[i];
          const k =
            r.raw && r.raw[effectiveAnalyzeColumn] !== undefined
              ? String(r.raw[effectiveAnalyzeColumn]).trim()
              : String((r as any)[effectiveAnalyzeColumn.toLowerCase()] || '').trim();
          if (k === item.name && r.target) {
            rowTarget += r.target;
          }
        }
        targetVal = rowTarget > 0 ? rowTarget : Math.round(actual * 1.1);
      } else {
        // 2. Custom manual target or overall target
        const customTarget =
          isVal
            ? targetConfig.targets[item.name]?.value
            : targetConfig.targets[item.name]?.qty;

        if (customTarget !== undefined && customTarget !== null && customTarget >= 0) {
          targetVal = customTarget;
        } else if (overallTarget !== undefined && overallTarget > 0 && totalActual > 0) {
          targetVal = Math.round(overallTarget * (actual / totalActual));
        } else {
          targetVal = Math.round(actual * 1.1);
        }
      }

      const achievementPct =
        targetVal > 0 ? (actual / targetVal) * 100 : actual > 0 ? 100 : 0;
      const gap = actual - targetVal;
      const isAchieved = actual >= targetVal;

      return {
        ...item,
        target: targetVal,
        actual,
        achievementPct,
        gap,
        isAchieved
      };
    });
  }, [
    aggregatedItems,
    metric,
    totalQty,
    totalValue,
    targetConfig,
    totalTargetSum,
    filteredRows,
    effectiveAnalyzeColumn,
    hasDualMetrics
  ]);

  // Filtered & sorted target items for display
  const displayTargetItems = useMemo(() => {
    let list = targetItems;

    if (targetFilter === 'achieved') {
      list = list.filter((it) => it.isAchieved);
    } else if (targetFilter === 'deficit') {
      list = list.filter((it) => !it.isAchieved);
    }

    if (tableSearch && tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      list = list.filter((it) => (it.name || '').toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      return sortOrder === 'desc'
        ? b.achievementPct - a.achievementPct
        : a.achievementPct - b.achievementPct;
    });
  }, [targetItems, targetFilter, tableSearch, sortOrder]);

  // Overall Target KPI stats
  const targetSummaryStats = useMemo(() => {
    const totalActual = hasDualMetrics && metric === 'value' ? totalValue : totalQty;
    const totalTarget = targetItems.reduce((sum, it) => sum + it.target, 0);
    const overallPct = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const overallGap = totalActual - totalTarget;
    const achievedCount = targetItems.filter((it) => it.isAchieved).length;
    const deficitCount = targetItems.length - achievedCount;

    return {
      totalActual,
      totalTarget,
      overallPct,
      overallGap,
      achievedCount,
      deficitCount,
      isAchieved: totalActual >= totalTarget
    };
  }, [targetItems, metric, totalQty, totalValue, hasDualMetrics]);

  // Save targets to persistent storage
  const handleSaveTargets = (
    overallQty: number | undefined,
    overallVal: number | undefined,
    targets: Record<string, TargetEntry>
  ) => {
    const newConfig: TargetConfigStore = {
      overallTargetQty: overallQty,
      overallTargetValue: overallVal,
      targets
    };
    setTargetConfig(newConfig);
    saveTargetsConfig(newConfig);
  };

  // Helper to get semantic icon for dimension with a unified, professional palette
  const getDimensionIcon = (colName: string, customColor?: string) => {
    const norm = colName.toLowerCase();
    const colorClass = customColor || 'text-slate-500 group-hover:text-[#0A3D62] transition-colors';
    if (/reg|منطقة|محافظة|اقليم/i.test(norm)) return <MapPin className={`w-3.5 h-3.5 ${colorClass} shrink-0`} />;
    if (/branch|فرع/i.test(norm)) return <Building2 className={`w-3.5 h-3.5 ${colorClass} shrink-0`} />;
    if (/cust|pharm|صيدلية|عميل|مستشفى/i.test(norm)) return <Store className={`w-3.5 h-3.5 ${colorClass} shrink-0`} />;
    if (/rep|مندوب|ممثل/i.test(norm)) return <User className={`w-3.5 h-3.5 ${colorClass} shrink-0`} />;
    if (/sup|مشرف|خط/i.test(norm)) return <Users className={`w-3.5 h-3.5 ${colorClass} shrink-0`} />;
    if (/prod|منتج|مستحضر/i.test(norm)) return <Package className={`w-3.5 h-3.5 ${colorClass} shrink-0`} />;
    if (/item|brand|صنف|براند|عبوة/i.test(norm)) return <Tag className={`w-3.5 h-3.5 ${colorClass} shrink-0`} />;
    return <Layers className={`w-3.5 h-3.5 ${colorClass} shrink-0`} />;
  };

  const ArrowIcon = lang === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="max-w-md mx-auto px-3.5 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 pb-28">
      {/* 💡 Suggestion 1: Preset Auto-Applied Banner */}
      {presetAppliedBanner && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-bold text-amber-950 truncate">
              {t.companyPresetBanner}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenWizard}
              className="text-[11px] font-extrabold text-[#0A3D62] bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-2xs"
            >
              {t.modifyFilters}
            </button>
            {onDismissPresetBanner && (
              <button
                type="button"
                onClick={onDismissPresetBanner}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Axis 3: DYNAMIC FILTER BAR (شريط الفلاتر الديناميكي) */}
      <div className="bg-white rounded-2xl border border-[#D9E1E8] shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-3 border-b border-[#D9E1E8] bg-[#F7F9FB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#0A3D62] text-white flex items-center justify-center shadow-2xs">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-extrabold text-[#0A3D62] uppercase tracking-wider">
              {isRtl ? 'الفلاتر النشطة' : 'Active Filters'}
            </h2>
            <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded-full">
              {displayFilterColumns.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {savedTerritory && (
              <button
                type="button"
                onClick={onApplySavedTerritory}
                className="px-2.5 py-1 rounded-lg bg-[#EAF3F8] hover:bg-sky-100 text-[#0A3D62] text-[11px] font-extrabold transition-colors flex items-center gap-1 border border-sky-200 shadow-2xs cursor-pointer"
                title={t.applyMyTerritory}
              >
                <MapPin className="w-3.5 h-3.5 text-[#0A3D62]" />
                <span className="max-w-[80px] truncate">{savedTerritory.name || (isRtl ? 'منطقتي' : 'My Territory')}</span>
              </button>
            )}

            {/* Analysis Setup Button */}
            <button
              type="button"
              onClick={onOpenWizard}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer shadow-2xs"
              title={isRtl ? 'إعدادات ونوع الشيت وفلاتر التحليل' : 'Analysis Setup'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0A3D62]" />
              <span>{t.modifyFilters}</span>
            </button>

            {/* Reset All Filters */}
            <button
              type="button"
              onClick={() => {
                setDrillDownHistory(null);
                setIsolatedFilterHistory(null);
                setActiveRowAction(null);
                setShowDrillDownOptions(false);
                onReset();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 transition-colors cursor-pointer"
              title={t.reset}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Buttons Grid: ONLY chosen columns appear! */}
        <div className="p-3 grid grid-cols-2 gap-2">
          {displayFilterColumns.map((colName: string) => {
            const selectedVals = dynamicFilters[colName] || [];
            const hasSelection = selectedVals.length > 0;

            return (
              <button
                key={colName}
                type="button"
                onClick={() => setActiveFilterCol(colName)}
                className={`p-2.5 rounded-xl border text-start transition-all flex flex-col justify-between min-h-[56px] cursor-pointer ${
                  hasSelection
                    ? 'bg-[#EAF3F8] border-[#0A3D62] text-[#0A3D62] shadow-2xs ring-1 ring-[#0A3D62]/30'
                    : 'bg-[#F8FAFC] border-[#D9E1E8] text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getDimensionIcon(colName)}
                    <span className="text-[11px] font-bold truncate block text-slate-600">
                      {colName}
                      {hasSelection && (
                        <span className="text-[#0A3D62] font-black ms-1">
                          ({selectedVals.length})
                        </span>
                      )}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>

                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-extrabold truncate pe-1 text-[#17212B]">
                    {selectedVals.length === 0
                      ? t.all
                      : selectedVals.length === 1
                      ? selectedVals[0]
                      : t.selectedCount.replace('{n}', selectedVals.length.toString())}
                  </span>
                  {hasSelection && (
                    <span className="text-[10px] bg-[#0A3D62] text-white px-1.5 py-0.2 rounded-full font-bold">
                      {selectedVals.length}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Axis 3: ANALYZE BY (التحليل حسب) */}
      <div className="bg-white rounded-2xl border border-[#D9E1E8] shadow-xs p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Layers className="w-3.5 h-3.5 text-[#0A3D62]" />
            <span className="text-xs font-bold text-slate-800">
              {t.analyzeBy}
            </span>
            <span className="text-[11px] font-extrabold text-[#0A3D62] bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Check className="w-3 h-3 text-[#0A3D62]" />
              {effectiveAnalyzeColumn}
            </span>
          </div>
        </div>

        {/* Dynamic Chips Container with Modern Scroll Navigation & Soft Fade Masks */}
        <div className="relative group">
          {/* Scroll Backward Button (Right in RTL, Left in LTR) */}
          {((isRtl && canScrollRight) || (!isRtl && canScrollLeft)) && (
            <div className={`absolute top-1/2 -translate-y-1/2 z-10 flex items-center ${isRtl ? 'start-0' : 'start-0'}`}>
              <div className={`w-8 h-9 pointer-events-none bg-gradient-to-${isRtl ? 'l' : 'r'} from-white to-transparent`} />
              <button
                type="button"
                onClick={() => handleScrollChips('backward')}
                className="absolute start-0 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-[#0A3D62] shadow-md border border-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title={isRtl ? 'تمرير لليمين' : 'Scroll left'}
                aria-label={isRtl ? 'تمرير لليمين' : 'Scroll left'}
              >
                {isRtl ? <ChevronRight className="w-4 h-4 stroke-[2.5]" /> : <ChevronLeft className="w-4 h-4 stroke-[2.5]" />}
              </button>
            </div>
          )}

          {/* Scroll Forward Button (Left in RTL, Right in LTR) */}
          {((isRtl && canScrollLeft) || (!isRtl && canScrollRight)) && (
            <div className={`absolute top-1/2 -translate-y-1/2 z-10 flex items-center ${isRtl ? 'end-0' : 'end-0'}`}>
              <div className={`w-8 h-9 pointer-events-none bg-gradient-to-${isRtl ? 'r' : 'l'} from-white to-transparent`} />
              <button
                type="button"
                onClick={() => handleScrollChips('forward')}
                className="absolute end-0 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-[#0A3D62] shadow-md border border-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title={isRtl ? 'المزيد من الأعمدة (تمرير لليسار)' : 'Scroll right'}
                aria-label={isRtl ? 'المزيد من الأعمدة (تمرير لليسار)' : 'Scroll right'}
              >
                {isRtl ? <ChevronLeft className="w-4 h-4 stroke-[2.5]" /> : <ChevronRight className="w-4 h-4 stroke-[2.5]" />}
              </button>
            </div>
          )}

          {/* Dynamic Chips of active dimension columns: Fast, lightweight, zero-lag selection */}
          <div
            ref={chipsScrollRef}
            className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-0.5"
          >
            {allAnalyzeDimensionColumns.map((colName: string) => {
              const isSelected = effectiveAnalyzeColumn === colName;

              return (
                <button
                  key={colName}
                  type="button"
                  onClick={() => handleSelectAnalyzeColumn(colName)}
                  className={`py-2 px-3 text-xs font-extrabold rounded-xl transition-all duration-150 active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#0A3D62] to-[#14537D] text-white shadow-xs ring-2 ring-[#0A3D62]/25'
                      : 'bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-slate-200/70 hover:border-slate-300'
                  }`}
                  title={
                    isSelected
                      ? (isRtl ? 'البُعد المحدد حالياً' : 'Currently active dimension')
                      : (isRtl ? `التحليل حسب ${colName}` : `Analyze by ${colName}`)
                  }
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  ) : (
                    getDimensionIcon(colName)
                  )}
                  <span>{colName}</span>
                </button>
              );
            })}

            {/* Quick Dropdown to pick and pin ANY other column from the sheet */}
            {otherSheetColumns.length > 0 && (
              <div className="relative shrink-0">
                <select
                  aria-label={isRtl ? 'إضافة عمود' : 'Add Column'}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddDimensionColumn(e.target.value);
                    }
                  }}
                  className="py-2 px-3 pe-7 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer appearance-none transition-colors"
                >
                  <option value="" disabled>
                    {isRtl ? 'إضافة عمود' : 'Add Column'}
                  </option>
                  {otherSheetColumns.map((col: string) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Mode Switcher: Sales Analysis vs Target Comparison (Conditionally shown if target comparison is enabled) */}
      {targetComparisonEnabled && sheetType === 'sales' && (
        <div className="bg-[#EAF3F8] p-1 rounded-2xl border border-[#D9E1E8] flex gap-1 animate-fadeIn">
          <button
            type="button"
            onClick={() => setViewMode('sales')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
              viewMode === 'sales'
                ? 'bg-[#0A3D62] text-white shadow-xs'
                : 'text-[#0A3D62] hover:bg-white/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t.salesAnalysis}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('target')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
              viewMode === 'target'
                ? 'bg-[#0A3D62] text-white shadow-xs'
                : 'text-[#0A3D62] hover:bg-white/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>{t.targetComparison}</span>
          </button>
        </div>
      )}

      {/* GLOBAL METRIC SWITCHER - ONLY shown when sheet has at least 2 distinct numeric columns */}
      {viewMode === 'sales' && hasDualMetrics && (
        <div className="bg-white rounded-xl border border-[#D9E1E8] p-1 shadow-2xs flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMetric('qty')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[36px] cursor-pointer truncate ${
              metric === 'qty'
                ? 'bg-[#0A3D62] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            title={effectivePrimaryCol}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{effectivePrimaryCol}</span>
          </button>

          <button
            type="button"
            onClick={() => setMetric('value')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[36px] cursor-pointer truncate ${
              metric === 'value'
                ? 'bg-[#0A3D62] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            title={effectiveSecondaryCol}
          >
            <Coins className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{effectiveSecondaryCol}</span>
          </button>

          <button
            type="button"
            onClick={() => setMetric('both')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[36px] cursor-pointer truncate ${
              metric === 'both'
                ? 'bg-[#0A3D62] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{isRtl ? 'كلاهما' : 'Both'}</span>
          </button>
        </div>
      )}

      {/* SUMMARY KPI CARDS */}
      {viewMode === 'sales' ? (
        sheetType === 'general' ? (
          /* General Sheet Mode: Single Metric Results (Total and Average) */
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#0A3D62] text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div className="flex items-center justify-between text-sky-200 text-xs font-bold mb-1">
                <span className="truncate">{isRtl ? `إجمالي ${effectivePrimaryCol}` : `Total ${effectivePrimaryCol}`}</span>
                <BarChart3 className="w-4 h-4 text-sky-300 shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                {totalQty.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
              <p className="text-[11px] text-sky-200/80 mt-1 truncate">
                {effectiveAnalyzeColumn}: {displayItems.length} {t.showingRows.replace('{n}', '')}
              </p>
            </div>

            <div className="bg-[#17212B] text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div className="flex items-center justify-between text-emerald-300 text-xs font-bold mb-1">
                <span className="truncate">{isRtl ? `متوسط ${effectivePrimaryCol}` : `Avg ${effectivePrimaryCol}`}</span>
                <Calculator className="w-4 h-4 text-emerald-300 shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                {(totalQty / Math.max(1, filteredRows.length)).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 truncate">
                {filteredRows.length.toLocaleString()} {isRtl ? 'إجمالي السجلات' : 'records'}
              </p>
            </div>
          </div>
        ) : !hasDualMetrics ? (
          /* Single Numeric Metric Mode: 2 Adaptive Context Cards (Total & Average per record) */
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#0A3D62] text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div className="flex items-center justify-between text-sky-200 text-xs font-bold mb-1">
                <span className="truncate">{isRtl ? `إجمالي ${effectivePrimaryCol}` : `Total ${effectivePrimaryCol}`}</span>
                <BarChart3 className="w-4 h-4 text-sky-300 shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                {totalQty.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
              <p className="text-[11px] text-sky-200/80 mt-1 truncate">
                {effectiveAnalyzeColumn}: {displayItems.length} {t.showingRows.replace('{n}', '')}
              </p>
            </div>

            <div className="bg-[#17212B] text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div className="flex items-center justify-between text-emerald-300 text-xs font-bold mb-1">
                <span className="truncate">{isRtl ? `متوسط ${effectivePrimaryCol}` : `Avg ${effectivePrimaryCol}`}</span>
                <Calculator className="w-4 h-4 text-emerald-300 shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                {(totalQty / Math.max(1, filteredRows.length)).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 truncate">
                {filteredRows.length.toLocaleString()} {isRtl ? 'إجمالي السجلات' : 'records'}
              </p>
            </div>
          </div>
        ) : (
          /* Dual Metric Mode: Dynamic toggles (Primary / Secondary / Both) */
          <div
            className={`grid gap-2.5 ${
              metric === 'both' ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* Card Primary */}
            {(metric === 'qty' || metric === 'both') && (
              <div className="bg-[#0A3D62] text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
                <div className="flex items-center justify-between text-sky-200 text-xs font-bold mb-1">
                  <span className="truncate">{isRtl ? `إجمالي ${effectivePrimaryCol}` : `Total ${effectivePrimaryCol}`}</span>
                  <BarChart3 className="w-4 h-4 text-sky-300 shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  {totalQty.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </div>
                <p className="text-[11px] text-sky-200/80 mt-1 truncate">
                  {effectiveAnalyzeColumn}: {displayItems.length} {t.showingRows.replace('{n}', '')}
                </p>
              </div>
            )}

            {/* Card Secondary */}
            {(metric === 'value' || metric === 'both') && (
              <div className="bg-[#17212B] text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
                <div className="flex items-center justify-between text-amber-300 text-xs font-bold mb-1">
                  <span className="truncate">{isRtl ? `إجمالي ${effectiveSecondaryCol}` : `Total ${effectiveSecondaryCol}`}</span>
                  <Coins className="w-4 h-4 text-amber-300 shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  {totalValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  {isSecondaryCurrency && (
                    <span className="text-xs font-normal text-amber-200 ms-1.5">{t.egp}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-1 truncate">
                  {effectiveAnalyzeColumn}: {displayItems.length} {t.showingRows.replace('{n}', '')}
                </p>
              </div>
            )}
          </div>
        )
      ) : (
        /* TARGET VS ACTUAL SUMMARY KPI CARDS (💡 Suggestion 3) */
        <div className="space-y-2.5">
          <div className="bg-gradient-to-br from-[#0A3D62] to-[#122A3F] text-white rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-sky-300" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-200">
                  {t.achievement} ({effectiveAnalyzeColumn})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-colors flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{t.editTarget}</span>
              </button>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={`text-3xl sm:text-4xl font-black ${
                  targetSummaryStats.overallPct >= 100
                    ? 'text-emerald-400'
                    : targetSummaryStats.overallPct >= 80
                    ? 'text-amber-300'
                    : 'text-rose-400'
                }`}
              >
                {targetSummaryStats.overallPct.toFixed(1)}%
              </span>
              <span className="text-xs text-sky-200">
                {targetSummaryStats.isAchieved ? t.achievedTarget : t.underTarget}
              </span>
            </div>

            {/* Achievement Progress Bar */}
            <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  targetSummaryStats.overallPct >= 100
                    ? 'bg-emerald-400'
                    : targetSummaryStats.overallPct >= 80
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
                style={{ width: `${Math.min(100, targetSummaryStats.overallPct)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="text-sky-200/80 block text-[11px]">{t.actual}</span>
                <span className="font-extrabold text-sm text-white">
                  {targetSummaryStats.totalActual.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-sky-200/80 block text-[11px]">{t.target}</span>
                <span className="font-extrabold text-sm text-white">
                  {targetSummaryStats.totalTarget.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-filter chips: All / Achieved Only / Deficit Only */}
          <div className="grid grid-cols-3 gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#D9E1E8]">
            <button
              type="button"
              onClick={() => setTargetFilter('all')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                targetFilter === 'all'
                  ? 'bg-white text-[#0A3D62] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.filterAllTargets} ({targetItems.length})
            </button>
            <button
              type="button"
              onClick={() => setTargetFilter('achieved')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                targetFilter === 'achieved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{targetSummaryStats.achievedCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetFilter('deficit')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                targetFilter === 'deficit'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>{targetSummaryStats.deficitCount}</span>
            </button>
          </div>
        </div>
      )}

      {/* DATA TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-[#D9E1E8] shadow-xs overflow-hidden">
        {/* Drill-down Breadcrumb Navigation */}
        {drillDownHistory && (
          <div className="bg-gradient-to-r from-[#0A3D62] to-[#122A3F] text-white px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-sky-900/40 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-semibold overflow-hidden">
              <span className="text-sky-300 font-bold">{drillDownHistory.parentColumn}:</span>
              <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md truncate max-w-[140px] sm:max-w-[200px]">
                {drillDownHistory.parentItem}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 text-sky-300 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
              <span className="text-emerald-300 font-extrabold">{effectiveAnalyzeColumn}</span>
            </div>
            <button
              type="button"
              onClick={handleResetDrillDown}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
              title={isRtl ? `الرجوع إلى (${drillDownHistory.parentColumn})` : `Return to (${drillDownHistory.parentColumn})`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isRtl ? 'رجوع' : 'Back'}</span>
            </button>
          </div>
        )}

        {/* Isolated Filter Breadcrumb Banner */}
        {isolatedFilterHistory && !drillDownHistory && (
          <div className="bg-gradient-to-r from-sky-900 to-[#0A3D62] text-white px-3.5 py-2 flex items-center justify-between gap-2 border-b border-sky-900/40 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-semibold overflow-hidden">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تم حصر الشاشة لـ:' : 'Filtered screen by:'}</span>
              </span>
              <span className="text-sky-300 font-bold shrink-0">{isolatedFilterHistory.column}:</span>
              <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md truncate max-w-[180px] sm:max-w-[320px]">
                {isolatedFilterHistory.item}
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetIsolatedFilter}
              className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 hover:text-white border border-amber-300/30 text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
              title={isRtl ? 'إلغاء التصفية والرجوع للوضع السابق' : 'Return to previous state'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isRtl ? 'رجوع' : 'Back'}</span>
            </button>
          </div>
        )}

        {/* Table Search & Action Header */}
        <div className="p-3 border-b border-[#D9E1E8] bg-[#F7F9FB] flex items-center justify-between gap-2">
          {/* Search Input - Hidden when viewing an isolated single item without drill-down */}
          {isolatedFilterHistory && !drillDownHistory ? (
            <div className="flex-1 flex items-center gap-2 text-xs font-semibold text-slate-500 py-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>
                {isRtl
                  ? `عرض تفصيلي خاص بـ [${isolatedFilterHistory.item}]`
                  : `Viewing isolated record for [${isolatedFilterHistory.item}]`}
              </span>
            </div>
          ) : (
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => handleTableSearchChange(e.target.value)}
                placeholder={
                  drillDownHistory
                    ? isRtl
                      ? `بحث داخل تفاصيل [${drillDownHistory.parentItem}]...`
                      : `Search inside [${drillDownHistory.parentItem}]...`
                    : `${t.searchPlaceholder} (${effectiveAnalyzeColumn})`
                }
                className="w-full bg-white border border-[#D9E1E8] rounded-xl ps-9 pe-3 py-1.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A3D62]"
              />
            </div>
          )}

          {/* Percentage % Toggle Button in Toolbar */}
          {onTogglePercentage && (
            <button
              type="button"
              onClick={onTogglePercentage}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
                showPercentage
                  ? 'bg-sky-50 border-sky-300 text-[#0A3D62] shadow-2xs'
                  : 'bg-white border-[#D9E1E8] text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
              title={
                isRtl
                  ? (showPercentage ? 'إخفاء عمود النسبة المئوية %' : 'إظهار عمود النسبة المئوية %')
                  : (showPercentage ? 'Hide percentage column %' : 'Show percentage column %')
              }
              aria-label="Toggle Percentage"
            >
              <Percent className="w-4 h-4" />
            </button>
          )}

          {/* Sort Toggle Button */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 rounded-xl border border-[#D9E1E8] bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title={sortOrder === 'desc' ? 'ترتيب تنازلي' : 'ترتيب تصاعدي'}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {/* Export Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2.5 py-1.5 rounded-xl bg-[#0A3D62] text-white hover:bg-[#082f4d] transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.export}</span>
            </button>

            {showExportMenu && (
              <div
                className={`absolute ${
                  isRtl ? 'start-0' : 'end-0'
                } mt-2 w-48 bg-white border border-[#D9E1E8] rounded-xl shadow-xl z-30 p-1 space-y-1 animate-fadeIn`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    if (viewMode === 'target') {
                      exportTargetResultsToExcel(
                        targetItems,
                        effectiveAnalyzeColumn,
                        hasDualMetrics && metric === 'value' ? effectiveSecondaryCol : effectivePrimaryCol,
                        effectiveAnalyzeColumn
                      );
                    } else {
                      exportResultsToExcel(
                        displayItems,
                        effectiveAnalyzeColumn,
                        hasDualMetrics && metric === 'value' ? effectiveSecondaryCol : effectivePrimaryCol,
                        effectiveAnalyzeColumn,
                        'Analysis_Report.xlsx',
                        effectivePrimaryCol,
                        hasDualMetrics ? effectiveSecondaryCol : undefined
                      );
                    }
                  }}
                  className="w-full text-start px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.exportExcel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    if (viewMode === 'target') {
                      exportTargetResultsToCsv(
                        targetItems,
                        effectiveAnalyzeColumn,
                        hasDualMetrics && metric === 'value' ? effectiveSecondaryCol : effectivePrimaryCol,
                        'Target_vs_Actual_Report.csv'
                      );
                    } else {
                      exportResultsToCsv(
                        displayItems,
                        effectiveAnalyzeColumn,
                        'Analysis_Report.csv',
                        effectivePrimaryCol,
                        hasDualMetrics ? effectiveSecondaryCol : undefined
                      );
                    }
                  }}
                  className="w-full text-start px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.exportCsv}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Row Action Hub (Filter or Drill-down) */}
        {activeRowAction && (
          <div className="relative border-b border-slate-200/80 bg-slate-50/90 py-2.5 px-3.5 pe-10 sm:pe-12 animate-fadeIn transition-all">
            {/* Cancel / Close button: top-left in Arabic (end-2.5 in RTL), top-right in English (end-2.5 in LTR) */}
            <button
              type="button"
              onClick={() => {
                setActiveRowAction(null);
                setShowDrillDownOptions(false);
              }}
              className="absolute top-2.5 end-2.5 p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title={isRtl ? 'إلغاء التحديد' : 'Cancel selection'}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Item Info Box: Streamlined & Highly Legible */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#0A3D62] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Layers className="w-3.5 h-3.5 text-sky-300" />
                </div>
                <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                  <span className="text-xs text-slate-500 font-semibold">{activeRowAction.column}:</span>
                  <span className="text-sm font-black text-[#0A3D62] truncate max-w-[200px] sm:max-w-[340px]" title={activeRowAction.name}>
                    {activeRowAction.name}
                  </span>
                </div>
              </div>

              {/* The two action buttons side by side in a single line */}
              <div className="flex items-center gap-2 flex-nowrap shrink-0">
                {/* 1. Filter / Isolate button */}
                {isolatedFilterHistory?.item === activeRowAction.name && isolatedFilterHistory?.column === activeRowAction.column ? (
                  <button
                    type="button"
                    onClick={handleResetIsolatedFilter}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title={isRtl ? 'إلغاء عزل هذا العنصر والرجوع' : 'Return to full data view'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'رجوع' : 'Back'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFilterByItem(activeRowAction)}
                    className="px-3 py-1.5 rounded-xl bg-[#0A3D62] hover:bg-[#082f4d] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title={isRtl ? 'حصر وتصفية الشاشة بهذا العنصر فقط' : 'Isolate screen to this item'}
                  >
                    <Filter className="w-3.5 h-3.5 text-sky-300" />
                    <span>{isRtl ? 'عزل العنصر' : 'Isolate Item'}</span>
                  </button>
                )}

                {/* 2. Drill-down / Detail by button */}
                <button
                  type="button"
                  onClick={() => setShowDrillDownOptions(!showDrillDownOptions)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    showDrillDownOptions
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title={isRtl ? 'تفكيك هذا العنصر وتوزيعه حسب عمود آخر تختاره' : 'Break down this item by another column'}
                >
                  <Layers className={`w-3.5 h-3.5 ${showDrillDownOptions ? 'text-white' : 'text-[#0A3D62]'}`} />
                  <span>{isRtl ? 'تفصيل حسب' : 'Detail by'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDrillDownOptions ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Drill-down column pills */}
            {showDrillDownOptions && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 animate-fadeIn">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <span>{isRtl ? `تفكيك وتفصيل [${activeRowAction.name}] حسب:` : `Detail [${activeRowAction.name}] by:`}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {allCandidateColumns
                    .filter((c: string) => c !== activeRowAction.column)
                    .map((colName: string) => (
                      <button
                        key={colName}
                        type="button"
                        onClick={() => handleDrillDownTo(activeRowAction, colName)}
                        className="group px-2.5 py-1.5 bg-white hover:bg-[#0A3D62] hover:text-white text-slate-700 border border-slate-200 hover:border-[#0A3D62] rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        {getDimensionIcon(colName, 'text-slate-400 group-hover:text-white transition-colors')}
                        <span>{colName}</span>
                        <ChevronRight className={`w-3 h-3 opacity-50 group-hover:opacity-100 ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto max-h-96">
          {viewMode === 'sales' ? (
            /* Sales Table */
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-[#F8FAFC] text-slate-600 font-bold border-b border-[#D9E1E8] sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-start">{effectiveAnalyzeColumn}</th>
                  {(!hasDualMetrics || metric === 'qty' || metric === 'both') && (
                    <th className="p-3 text-end">{effectivePrimaryCol}</th>
                  )}
                  {hasDualMetrics && (metric === 'value' || metric === 'both') && (
                    <th className="p-3 text-end">{effectiveSecondaryCol}</th>
                  )}
                  {showPercentage && <th className="p-3 text-end">{t.share}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        1 +
                        (!hasDualMetrics || metric === 'qty' || metric === 'both' ? 1 : 0) +
                        (hasDualMetrics && (metric === 'value' || metric === 'both') ? 1 : 0) +
                        (showPercentage ? 1 : 0)
                      }
                      className="text-center py-8 text-slate-400"
                    >
                      {t.noSalesFound}
                    </td>
                  </tr>
                ) : (
                  displayItems.map((item) => {
                    const share = metric === 'value' ? item.shareValue : item.shareQty;
                    const isSelected = activeRowAction?.name === item.name && activeRowAction?.column === effectiveAnalyzeColumn;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          if (isSelected) {
                            setActiveRowAction(null);
                            setShowDrillDownOptions(false);
                          } else {
                            setActiveRowAction({
                              column: effectiveAnalyzeColumn,
                              name: item.name,
                              qty: item.qty,
                              value: item.value,
                              share
                            });
                            setShowDrillDownOptions(false);
                          }
                        }}
                        className={`transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-sky-100/90 text-sky-950 font-bold ring-1 ring-inset ring-sky-300'
                            : 'hover:bg-sky-50/60'
                        }`}
                        title={isRtl ? 'انقر لتصفية الشاشة بهذا العنصر أو التعمق فيه' : 'Click to filter or drill-down'}
                      >
                        <td className="p-3 font-bold text-slate-800">
                          <div className="truncate max-w-[160px] sm:max-w-[220px] flex items-center gap-1.5">
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0A3D62] shrink-0 animate-pulse" />
                            )}
                            <span className="truncate">{item.name}</span>
                          </div>
                        </td>
                        {(!hasDualMetrics || metric === 'qty' || metric === 'both') && (
                          <td className="p-3 text-end font-mono font-bold text-slate-900">
                            {item.qty.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </td>
                        )}
                        {hasDualMetrics && (metric === 'value' || metric === 'both') && (
                          <td className="p-3 text-end font-mono font-bold text-slate-900">
                            {item.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </td>
                        )}
                        {showPercentage && (
                          <td className="p-3 text-end">
                            <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[11px]">
                              {share.toFixed(1)}%
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* Target vs Actual Table (💡 Suggestion 3) */
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-[#F8FAFC] text-slate-600 font-bold border-b border-[#D9E1E8] sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-start">{effectiveAnalyzeColumn}</th>
                  <th className="p-3 text-end">{t.actual}</th>
                  <th className="p-3 text-end">{t.target}</th>
                  {showPercentage && <th className="p-3 text-end">{t.achievement}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayTargetItems.length === 0 ? (
                  <tr>
                    <td colSpan={showPercentage ? 4 : 3} className="text-center py-8 text-slate-400">
                      {t.noSalesFound}
                    </td>
                  </tr>
                ) : (
                  displayTargetItems.map((item) => {
                    const isAchieved = item.isAchieved;
                    const pct = item.achievementPct;
                    const isSelected = activeRowAction?.name === item.name && activeRowAction?.column === effectiveAnalyzeColumn;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          if (isSelected) {
                            setActiveRowAction(null);
                            setShowDrillDownOptions(false);
                          } else {
                            setActiveRowAction({
                              column: effectiveAnalyzeColumn,
                              name: item.name,
                              qty: item.actual,
                              value: 0,
                              share: pct
                            });
                            setShowDrillDownOptions(false);
                          }
                        }}
                        className={`transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-sky-100/90 text-sky-950 font-bold ring-1 ring-inset ring-sky-300'
                            : 'hover:bg-sky-50/60'
                        }`}
                        title={isRtl ? 'انقر لتصفية الشاشة بهذا العنصر أو التعمق فيه' : 'Click to filter or drill-down'}
                      >
                        <td className="p-3 font-bold text-slate-800">
                          <div className="truncate max-w-[140px] sm:max-w-[180px] flex items-center gap-1.5">
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0A3D62] shrink-0 animate-pulse" />
                            )}
                            <span className="truncate">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-end font-mono font-bold text-slate-900">
                          {item.actual.toLocaleString()}
                        </td>
                        <td className="p-3 text-end font-mono text-slate-500">
                          {item.target.toLocaleString()}
                        </td>
                        {showPercentage && (
                          <td className="p-3 text-end">
                            <span
                              className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                pct >= 100
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : pct >= 80
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {pct.toFixed(0)}%
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MULTI-SELECT MODAL (Handles any active dynamic column filter!) */}
      {activeFilterCol && (
        <MultiSelectModal
          isOpen={Boolean(activeFilterCol)}
          onClose={() => setActiveFilterCol(null)}
          title={`${t.filterByLabel} ${activeFilterCol}`}
          options={activeModalOptions}
          selectedValues={dynamicFilters[activeFilterCol] || []}
          onChange={(newVals) => {
            setDynamicFilters((prev) => ({
              ...prev,
              [activeFilterCol]: newVals
            }));
          }}
          lang={lang}
        />
      )}

      {/* TARGET CONFIG MODAL (💡 Suggestion 3) */}
      <TargetModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        lang={lang}
        metric={hasDualMetrics && metric === 'value' ? 'value' : 'qty'}
        items={displayItems}
        savedTargets={targetConfig.targets || {}}
        overallTargetQty={targetConfig.overallTargetQty}
        overallTargetValue={targetConfig.overallTargetValue}
        onSaveTargets={handleSaveTargets}
      />
    </div>
  );
};
