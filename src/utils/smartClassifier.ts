import { ColumnClassification, SheetAnalysisResult } from '../types';

/**
 * Generate a deterministic signature for sheet headers to match presets.
 */
export function getHeadersSignature(headers: string[]): string {
  if (!headers || !Array.isArray(headers)) return '';
  return headers
    .map((h) => (h || '').trim().toLowerCase())
    .sort()
    .join('|');
}

/**
 * Inspect sheet columns and sample row records to dynamically classify dimensions and metrics.
 */
export function smartClassifySheet(
  columns: string[],
  sampleRecords: Record<string, any>[] = []
): SheetAnalysisResult {
  const dimensions: ColumnClassification[] = [];
  const metrics: ColumnClassification[] = [];

  let detectedQtyCol: string | undefined;
  let detectedValueCol: string | undefined;
  let detectedTargetCol: string | undefined;

  for (const col of columns) {
    const colTrimmed = (col || '').trim();
    if (!colTrimmed) continue;

    const lowerCol = colTrimmed.toLowerCase();

    // Collect sample non-empty values
    const samples: any[] = [];
    const uniqueVals = new Set<string>();

    for (const record of sampleRecords) {
      if (record && record[col] !== undefined && record[col] !== null && record[col] !== '') {
        const valStr = String(record[col]).trim();
        if (valStr) {
          uniqueVals.add(valStr);
          if (samples.length < 5) samples.push(valStr);
        }
      }
    }

    // Determine if predominantly numeric
    let numericCount = 0;
    let validSampleCount = 0;

    for (const val of samples) {
      validSampleCount++;
      const cleaned = String(val).replace(/,/g, '').trim();
      if (!isNaN(Number(cleaned)) && cleaned !== '') {
        numericCount++;
      }
    }

    const isNumericName =
      /qty|quantity|units?|كمية|الكمية|عدد|مبيعات|مباع|val|value|amount|net|total|صافي|مبلغ|قيمة|سعر|price|cost|تكلفة|target|هدف|تارجت|مستهدف/i.test(
        lowerCol
      );

    const isExplicitTextName =
      /name|اسم|code|كود|date|تاريخ|id|رقم|branch|فرع|region|منطقة|brick|بريك|customer|عميل|rep|مندوب|product|صنف|منتج|brand|line|item|address|عنوان/i.test(
        lowerCol
      );

    const isNumeric =
      !isExplicitTextName &&
      ((validSampleCount > 0 && numericCount / validSampleCount >= 0.7) || isNumericName);

    // Semantic classification
    let semanticType: ColumnClassification['semanticType'] = 'other';

    if (/target|هدف|تارجت|مستهدف/i.test(lowerCol)) {
      semanticType = 'target';
      if (!detectedTargetCol) detectedTargetCol = colTrimmed;
    } else if (/qty|quantity|units?|الكمية|كمية|عدد|مباع/i.test(lowerCol)) {
      semanticType = 'qty';
      if (!detectedQtyCol) detectedQtyCol = colTrimmed;
    } else if (/val|value|amount|net|صافي|مبلغ|قيمة|إجمالي|total|egp|سعر|price|cost/i.test(lowerCol)) {
      semanticType = 'value';
      if (!detectedValueCol) detectedValueCol = colTrimmed;
    } else if (/region|zone|governorate|منطقة|محافظة|إقليم/i.test(lowerCol)) {
      semanticType = 'region';
    } else if (/branch|office|center|فرع|قطاع/i.test(lowerCol)) {
      semanticType = 'branch';
    } else if (/address|street|area|مدينة|حي|شارع|عنوان/i.test(lowerCol)) {
      semanticType = 'address';
    } else if (/brick|territory|بريك|مربع/i.test(lowerCol)) {
      semanticType = 'brick';
    } else if (/rep|agent|delegate|مندوب|مسؤول/i.test(lowerCol)) {
      semanticType = 'rep';
    } else if (/supervisor|manager|مشرف|مدير/i.test(lowerCol)) {
      semanticType = 'supervisor';
    } else if (/customer|client|pharmacy|doctor|hospital|صيدلية|عميل|طبيب|مستشفى|جهة/i.test(lowerCol)) {
      semanticType = 'customer';
    } else if (/brand|family|line|خط|ماركة/i.test(lowerCol)) {
      semanticType = 'brand';
    } else if (/item|صنف/i.test(lowerCol)) {
      semanticType = 'item';
    } else if (/product|اسم المنتج|دواء|مستحضر|منتج/i.test(lowerCol)) {
      semanticType = 'product';
    }

    const classification: ColumnClassification = {
      name: colTrimmed,
      type: isNumeric ? 'metric' : 'dimension',
      semanticType,
      sampleValues: samples.map(String),
      uniqueCount: uniqueVals.size,
      isNumeric
    };

    if (isNumeric) {
      metrics.push(classification);
    } else {
      dimensions.push(classification);
    }
  }

  // Fallbacks if not detected by keywords
  if (!detectedQtyCol && metrics.length > 0) {
    detectedQtyCol = metrics[0].name;
  }
  if (!detectedValueCol && metrics.length > 1) {
    detectedValueCol = metrics[1].name;
  }

  // Determine top recommended dimension columns
  const priorityOrder: NonNullable<ColumnClassification['semanticType']>[] = [
    'region',
    'branch',
    'rep',
    'product',
    'item',
    'brand',
    'customer',
    'brick',
    'address'
  ];

  const sortedDimensions = [...dimensions].sort((a, b) => {
    const pA = a.semanticType ? priorityOrder.indexOf(a.semanticType) : 999;
    const pB = b.semanticType ? priorityOrder.indexOf(b.semanticType) : 999;
    if (pA !== -1 && pB !== -1) return pA - pB;
    if (pA !== -1) return -1;
    if (pB !== -1) return 1;
    return 0;
  });

  const recommendedDimensions = sortedDimensions.slice(0, 5).map((d) => d.name);

  return {
    dimensions,
    metrics,
    recommendedDimensions: recommendedDimensions.length > 0 ? recommendedDimensions : columns.slice(0, 4),
    detectedQtyCol,
    detectedValueCol,
    detectedTargetCol
  };
}
