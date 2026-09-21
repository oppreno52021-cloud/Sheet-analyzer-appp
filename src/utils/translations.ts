import { Language } from '../types';

export interface TranslationDict {
  [key: string]: string;
}

const arTranslations: TranslationDict = {
  // App General & Navigation
  appName: 'Sheet Analyzer',
  home: 'الرئيسية',
  analyze: 'التحليل',
  more: 'المزيد',
  offlineReady: 'جاهز ويعمل بدون إنترنت 100%',
  onlineMode: 'متصل بالإنترنت',
  offlineMode: 'وضع عدم الاتصال',

  // Actions & Buttons
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  save: 'حفظ',
  delete: 'حذف',
  reset: 'إعادة ضبط',
  all: 'الكل',
  export: 'تصدير',
  exportExcel: 'تصدير كملف Excel (xlsx)',
  exportCsv: 'تصدير كملف CSV',
  modifyFilters: 'إعدادات التحليل',
  applyMyTerritory: 'تطبيق منطقتي',
  editTarget: 'تعديل التارجت',

  // Home Screen
  uploadTitle: 'رفع وتحليل شيت جديد',
  uploadSubtitle: 'اسحب وأفلت أي ملف Excel أو CSV هنا أو اضغط للاختيار',
  browseFiles: 'اختر ملفاً من جهازك',
  loadDemoData: 'تجربة شيت نموذجي',
  loadingDemo: 'جاري تحميل البيانات التجريبية...',
  readingFile: 'جاري قراءة ومعالجة الملف...',
  couldNotReadFile: 'تعذر قراءة الملف، يرجى التأكد من صحة صيغة Excel أو CSV',
  recentFiles: 'آخر الشيتات المفتوحة',
  noRecentFiles: 'لا توجد شيتات سابقة محفوظة على هذا الجهاز',
  lastOpened: 'آخر فتح',
  showMoreFiles: 'عرض باقي الشيتات السابقة',
  hideMoreFiles: 'إخفاء المزيد',
  activeFile: 'الملف الحالي قيد التحليل',
  openFile: 'فتح التحليل',
  removeFile: 'إزالة الملف',
  rowsCount: 'سجل',
  columnsCount: 'أعمدة',

  // Analyze Screen
  salesAnalysis: 'تحليل المبيعات',
  targetComparison: 'المبيعات مقابل التارجت',
  analyzeBy: 'أعمدة الجدول',
  tableColumns: 'أعمدة الجدول',
  primaryColumn: 'العمود الرئيسي (عمود 1)',
  secondaryColumn: 'العمود التابع (عمود 2)',
  addColumn: 'إضافة عمود',
  swapColumns: 'تبديل الترتيب',
  applyColumns: 'تطبيق الأعمدة',
  selectedCount: 'محدد',
  showingRows: 'عناصر معروضة',
  egp: 'ج.م',
  actual: 'الفعلي',
  target: 'المستهدف',
  achievement: 'نسبة التحقيق',
  achievedTarget: 'محقق للتارجت',
  underTarget: 'أقل من التارجت',
  filterAllTargets: 'جميع العناصر',
  searchPlaceholder: 'بحث في النتائج...',
  share: 'النسبة %',
  noSalesFound: 'لا توجد بيانات مطابقة لمعايير الفلترة الحالية',
  filterByLabel: 'فلترة حسب',
  companyPresetBanner: 'تم تطبيق قالب الشيت تلقائياً',
  units: 'الكمية',
  value: 'القيمة',
  both: 'الكمية والقيمة',

  // Column Mapping
  columnMappingTitle: 'تعيين أعمدة الملف',
  columnMappingSubtitle: 'حدد الأعمدة المقابلة لحقول المبيعات الأساسية بدقة',
  confirmMapping: 'تأكيد وحفظ التعيين',

  // Saved Territory & Snapshots
  myTerritory: 'منطقتي المحفوظة',
  noSavedTerritory: 'لم يتم حفظ منطقة خاصة بك بعد',
  saveCurrentTerritory: 'حفظ الفلاتر الحالية كمنطقتي',
  territorySavedSuccess: 'تم حفظ المنطقة بنجاح',
  savedAnalyses: 'التحليلات المحفوظة',
  noSavedAnalyses: 'لا توجد تحليلات محفوظة بعد',
  saveAnalysis: 'حفظ التحليل الحالي',
  replaceFile: 'استبدال الملف الحالي',

  // Presets & Filter Wizard
  wizardTitle: 'إعدادات التحليل',
  wizardSubtitle: 'حدد نوع الشيت والأعمدة والفلاتر المطلوبة'
};

const enTranslations: TranslationDict = {
  // App General & Navigation
  appName: 'Sheet Analyzer',
  home: 'Home',
  analyze: 'Analyze',
  more: 'More',
  offlineReady: '100% Offline Ready',
  onlineMode: 'Online',
  offlineMode: 'Offline Mode',

  // Actions & Buttons
  cancel: 'Cancel',
  confirm: 'Confirm',
  save: 'Save',
  delete: 'Delete',
  reset: 'Reset',
  all: 'All',
  export: 'Export',
  exportExcel: 'Export as Excel (xlsx)',
  exportCsv: 'Export as CSV',
  modifyFilters: 'Analysis Setup',
  applyMyTerritory: 'Apply My Territory',
  editTarget: 'Edit Targets',

  // Home Screen
  uploadTitle: 'Upload & Analyze Sheet',
  uploadSubtitle: 'Drag and drop any Excel or CSV file here, or click to browse',
  browseFiles: 'Browse files',
  loadDemoData: 'Try Sample Sheet',
  loadingDemo: 'Loading sample demo data...',
  readingFile: 'Reading and parsing file...',
  couldNotReadFile: 'Could not read file, please check format (xlsx, xls, csv)',
  recentFiles: 'Recently Opened Sheets',
  noRecentFiles: 'No previous sheets saved on this device',
  lastOpened: 'Last opened',
  showMoreFiles: 'Show more previous sheets',
  hideMoreFiles: 'Show less',
  activeFile: 'Currently Active Dataset',
  openFile: 'Open Analysis',
  removeFile: 'Remove Dataset',
  rowsCount: 'rows',
  columnsCount: 'columns',

  // Analyze Screen
  salesAnalysis: 'Sales Analysis',
  targetComparison: 'Target vs Actual',
  analyzeBy: 'Table Columns',
  tableColumns: 'Table Columns',
  primaryColumn: 'Primary Column (Col 1)',
  secondaryColumn: 'Secondary Column (Col 2)',
  addColumn: 'Add Column',
  swapColumns: 'Swap Order',
  applyColumns: 'Apply Columns',
  selectedCount: 'selected',
  showingRows: 'items shown',
  egp: 'EGP',
  actual: 'Actual',
  target: 'Target',
  achievement: 'Achievement %',
  achievedTarget: 'Achieved Target',
  underTarget: 'Under Target',
  filterAllTargets: 'All Items',
  searchPlaceholder: 'Search results...',
  share: 'Share %',
  noSalesFound: 'No matching records found for active filters',
  filterByLabel: 'Filter by',
  companyPresetBanner: 'Sheet preset applied automatically',
  units: 'Units',
  value: 'Value',
  both: 'Both (Units & Value)',

  // Column Mapping
  columnMappingTitle: 'Map Sheet Columns',
  columnMappingSubtitle: 'Assign sheet columns to standard sales analytics dimensions',
  confirmMapping: 'Confirm and Apply',

  // Saved Territory & Snapshots
  myTerritory: 'My Territory',
  noSavedTerritory: 'No saved territory configured yet',
  saveCurrentTerritory: 'Save Current Filters as My Territory',
  territorySavedSuccess: 'Territory saved successfully',
  savedAnalyses: 'Saved Analysis Snapshots',
  noSavedAnalyses: 'No saved analyses yet',
  saveAnalysis: 'Save Snapshot',
  replaceFile: 'Replace Current File',

  // Presets & Filter Wizard
  wizardTitle: 'Customize Sheet Columns & Dimensions',
  wizardSubtitle: 'Configure dimensions, primary metrics and target goals'
};

export function getTranslation(lang: Language): TranslationDict {
  return lang === 'ar' ? arTranslations : enTranslations;
}
