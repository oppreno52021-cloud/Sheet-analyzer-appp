import {
  SalesRow,
  LoadedFileMeta,
  ColumnMapping,
  SavedTerritory,
  SavedAnalysis,
  Language,
  TargetConfigStore,
  SavedSheetPreset,
  MetricType,
  RecentFileItem,
  SheetAnalysisResult
} from '../types';
import { encryptData, decryptData } from './security';
import { getHeadersSignature } from './smartClassifier';

const DB_NAME = 'SalesAnalyzerDB_v3';
const DB_VERSION = 2;
const STORE_SALES = 'sales_data_vault';
const STORE_META = 'file_metadata_vault';
const STORE_RECENTS = 'recent_files_vault';
const KEY_RECENT_FILES_META = 'sales_analyzer_recent_files_meta_v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SALES)) {
        db.createObjectStore(STORE_SALES, { keyPath: 'chunkId' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_RECENTS)) {
        db.createObjectStore(STORE_RECENTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Encrypt and store the dataset in the local hardware vault.
 * Data is encrypted with AES-GCM-256 before disk commit.
 */
export async function saveDatasetLocally(
  rows: SalesRow[],
  meta: LoadedFileMeta,
  mapping: ColumnMapping
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_SALES, STORE_META], 'readwrite');
    const salesStore = tx.objectStore(STORE_SALES);
    const metaStore = tx.objectStore(STORE_META);

    salesStore.clear();

    // Encrypt rows in parallel chunks of 5000 for instant storage
    const chunkSize = 5000;
    const totalChunks = Math.max(1, Math.ceil(rows.length / chunkSize));
    const chunkPromises: Promise<{ chunkId: number; payload: string }>[] = [];

    for (let c = 0; c < totalChunks; c++) {
      const slice = rows.slice(c * chunkSize, (c + 1) * chunkSize);
      chunkPromises.push(
        encryptData(slice).then((encryptedChunk) => ({ chunkId: c, payload: encryptedChunk }))
      );
    }

    // Encrypt chunks, metadata, and mapping in parallel
    const [encryptedChunks, encMeta, encMapping] = await Promise.all([
      Promise.all(chunkPromises),
      encryptData(meta),
      encryptData(mapping)
    ]);

    for (const chunk of encryptedChunks) {
      salesStore.put(chunk);
    }

    metaStore.put({ key: 'current_meta', payload: encMeta, chunks: totalChunks, count: rows.length });
    metaStore.put({ key: 'current_mapping', payload: encMapping });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save encrypted dataset:', err);
  }
}

/**
 * Load and decrypt dataset from local hardware vault.
 */
export async function loadDatasetLocally(): Promise<{
  rows: SalesRow[];
  meta: LoadedFileMeta | null;
  mapping: ColumnMapping | null;
}> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_SALES, STORE_META], 'readonly');
    const salesStore = tx.objectStore(STORE_SALES);
    const metaStore = tx.objectStore(STORE_META);

    const chunksReq = salesStore.getAll();
    const metaReq = metaStore.get('current_meta');
    const mappingReq = metaStore.get('current_mapping');

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(null);
      tx.onerror = () => reject(tx.error);
    });

    const metaRecord = metaReq.result;
    const mappingRecord = mappingReq.result;
    const chunkRecords = chunksReq.result as Array<{ chunkId: number; payload: string }> | undefined;

    const meta = metaRecord?.payload ? await decryptData<LoadedFileMeta>(metaRecord.payload) : null;
    const mapping = mappingRecord?.payload ? await decryptData<ColumnMapping>(mappingRecord.payload) : null;

    const allRows: SalesRow[] = [];
    if (chunkRecords && chunkRecords.length > 0) {
      // Sort by chunkId
      chunkRecords.sort((a, b) => a.chunkId - b.chunkId);
      const decryptedSlices = await Promise.all(
        chunkRecords.map((rec) => decryptData<SalesRow[]>(rec.payload))
      );
      for (const decryptedSlice of decryptedSlices) {
        if (decryptedSlice && Array.isArray(decryptedSlice)) {
          for (let i = 0; i < decryptedSlice.length; i++) {
            allRows.push(decryptedSlice[i]);
          }
        }
      }
    }

    return {
      rows: allRows,
      meta,
      mapping
    };
  } catch (err) {
    console.warn('Error loading encrypted dataset from IndexedDB:', err);
    return { rows: [], meta: null, mapping: null };
  }
}

export async function clearDatasetLocally(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_SALES, STORE_META], 'readwrite');
    tx.objectStore(STORE_SALES).clear();
    tx.objectStore(STORE_META).clear();
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(null);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error clearing IndexedDB:', err);
  }
}

// LocalStorage helpers with obfuscated storage for small configurations
const KEY_MY_TERRITORY = 'tsa_sec_territory_v2';
const KEY_SAVED_ANALYSES = 'tsa_sec_analyses_v2';
const KEY_LANGUAGE = 'tsa_language';

export function getSavedTerritory(): SavedTerritory | null {
  try {
    const raw = localStorage.getItem(KEY_MY_TERRITORY);
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    return null;
  }
}

export function saveTerritoryConfig(territory: SavedTerritory): void {
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(territory))));
    localStorage.setItem(KEY_MY_TERRITORY, encoded);
  } catch (e) {
    console.error(e);
  }
}

export function getSavedAnalyses(): SavedAnalysis[] {
  try {
    const raw = localStorage.getItem(KEY_SAVED_ANALYSES);
    if (!raw) return [];
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    return [];
  }
}

export function saveAnalysisConfig(analysis: SavedAnalysis): void {
  try {
    const list = getSavedAnalyses();
    const updated = [analysis, ...list.filter(a => a.id !== analysis.id)].slice(0, 10);
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(updated))));
    localStorage.setItem(KEY_SAVED_ANALYSES, encoded);
  } catch (e) {
    console.error(e);
  }
}

export function deleteSavedAnalysis(id: string): void {
  try {
    const list = getSavedAnalyses().filter(a => a.id !== id);
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(list))));
    localStorage.setItem(KEY_SAVED_ANALYSES, encoded);
  } catch (e) {
    console.error(e);
  }
}

export function getStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem(KEY_LANGUAGE);
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  } catch {
    return 'ar';
  }
}

export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(KEY_LANGUAGE, lang);
  } catch (e) {
    console.error(e);
  }
}

// Target Configuration Storage
const KEY_TARGETS = 'tsa_targets_config_v1';
const KEY_DYNAMIC_FILTERS = 'tsa_dynamic_filters_config_v1';

export function getSavedDynamicFilterConfig(): { activeColumns: string[]; metric: MetricType } | null {
  try {
    const raw = localStorage.getItem(KEY_DYNAMIC_FILTERS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDynamicFilterConfig(config: { activeColumns: string[]; metric: MetricType }): void {
  try {
    localStorage.setItem(KEY_DYNAMIC_FILTERS, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedTargets(): TargetConfigStore {
  try {
    const raw = localStorage.getItem(KEY_TARGETS);
    if (!raw) return { targets: {} };
    return JSON.parse(raw);
  } catch {
    return { targets: {} };
  }
}

export function saveTargetsConfig(config: TargetConfigStore): void {
  try {
    localStorage.setItem(KEY_TARGETS, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}

// Sheet Presets Storage (💡 Suggestion 1: Saved Presets / Profiles)
const KEY_SHEET_PRESETS = 'tsa_sheet_presets_v1';

export function getSavedSheetPresets(): SavedSheetPreset[] {
  try {
    const raw = localStorage.getItem(KEY_SHEET_PRESETS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSheetPreset(preset: SavedSheetPreset): void {
  try {
    const presets = getSavedSheetPresets();
    const updated = [preset, ...presets.filter(p => p.headersSignature !== preset.headersSignature)];
    localStorage.setItem(KEY_SHEET_PRESETS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save preset:', e);
  }
}

export function findMatchingPreset(headers: string[]): SavedSheetPreset | null {
  const sig = getHeadersSignature(headers);
  const presets = getSavedSheetPresets();
  return presets.find(p => p.headersSignature === sig) || null;
}

export function deleteSheetPreset(id: string): void {
  try {
    const presets = getSavedSheetPresets().filter(p => p.id !== id);
    localStorage.setItem(KEY_SHEET_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to delete preset:', e);
  }
}

// Active Working Session State (Persistent between app restarts)
const KEY_ACTIVE_SESSION_STATE = 'tsa_active_session_state_v2';

export interface ActiveSessionState {
  activeDimensionColumns?: string[];
  dynamicFilters?: Record<string, string[]>;
  selectedAnalyzeColumn?: string;
  metric?: MetricType;
  primaryMetricColumn?: string;
  secondaryMetricColumn?: string;
  targetComparisonEnabled?: boolean;
  currentMatchedPreset?: SavedSheetPreset | null;
  sheetType?: 'sales' | 'general';
  showPercentage?: boolean;
  lastUpdated?: number;
}

export function saveActiveSessionState(state: ActiveSessionState): void {
  try {
    localStorage.setItem(KEY_ACTIVE_SESSION_STATE, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save session state:', e);
  }
}

export function getSavedActiveSessionState(): ActiveSessionState | null {
  try {
    const raw = localStorage.getItem(KEY_ACTIVE_SESSION_STATE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearActiveSessionState(): void {
  try {
    localStorage.removeItem(KEY_ACTIVE_SESSION_STATE);
  } catch (_) {}
}

/**
 * ==========================================================
 * RECENT FILES VAULT (Top 3 on Home, previous sheets in More)
 * ==========================================================
 */

export function getRecentFilesMetaList(): RecentFileItem[] {
  try {
    const raw = localStorage.getItem(KEY_RECENT_FILES_META);
    if (!raw) return [];
    const list: RecentFileItem[] = JSON.parse(raw);
    return list.sort((a, b) => {
      const timeA = a.lastOpenedAt || a.loadedAt || 0;
      const timeB = b.lastOpenedAt || b.loadedAt || 0;
      return timeB - timeA;
    });
  } catch {
    return [];
  }
}

export function saveRecentFilesMetaList(list: RecentFileItem[]) {
  try {
    // Keep up to 30 files in vault history so "Open More" can access past sheets
    localStorage.setItem(KEY_RECENT_FILES_META, JSON.stringify(list.slice(0, 30)));
  } catch (_) {}
}

export function touchRecentFileOpenedAt(id: string): RecentFileItem[] {
  try {
    const list = getRecentFilesMetaList();
    const item = list.find((f) => f.id === id);
    if (item) {
      item.lastOpenedAt = Date.now();
      const updated = [item, ...list.filter((f) => f.id !== id)];
      saveRecentFilesMetaList(updated);
      return updated;
    }
    return list;
  } catch {
    return getRecentFilesMetaList();
  }
}

export async function saveRecentFileRecord(
  meta: LoadedFileMeta,
  rows: SalesRow[],
  mapping: ColumnMapping,
  sheetAnalysis?: SheetAnalysisResult | null
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_RECENTS], 'readwrite');
    const store = tx.objectStore(STORE_RECENTS);

    const now = Date.now();
    // Create a stable ID based on filename and row count
    const fileId = `${meta.fileName}_${meta.rowCount}`;
    const fileItem: RecentFileItem = {
      id: fileId,
      fileName: meta.fileName,
      fileSize: meta.fileSize || 0,
      rowCount: meta.rowCount,
      columnCount: meta.columnCount,
      loadedAt: now,
      lastOpenedAt: now,
      columns: meta.columns
    };

    const fullRecord = {
      id: fileId,
      meta,
      rows,
      mapping,
      sheetAnalysis: sheetAnalysis || null,
      fileItem
    };

    store.put(fullRecord);

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(null);
      tx.onerror = () => reject(tx.error);
    });

    // Update metadata list: keep history up to 30 files, newest opened on top
    const existingList = getRecentFilesMetaList().filter((f) => f.id !== fileId);
    const updatedList = [fileItem, ...existingList].slice(0, 30);
    saveRecentFilesMetaList(updatedList);

    // Prune IndexedDB to only keep those 30 files
    try {
      const pruneTx = db.transaction([STORE_RECENTS], 'readwrite');
      const pruneStore = pruneTx.objectStore(STORE_RECENTS);
      const allKeysReq = pruneStore.getAllKeys();
      allKeysReq.onsuccess = () => {
        const allowedIds = new Set(updatedList.map((u) => u.id));
        const allKeys = (allKeysReq.result as string[]) || [];
        for (const k of allKeys) {
          if (!allowedIds.has(k)) {
            pruneStore.delete(k);
          }
        }
      };
    } catch (_) {}
  } catch (err) {
    console.warn('Failed to save recent file record:', err);
  }
}

export async function loadRecentFileRecord(id: string): Promise<{
  rows: SalesRow[];
  meta: LoadedFileMeta;
  mapping: ColumnMapping;
  sheetAnalysis?: SheetAnalysisResult | null;
} | null> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_RECENTS], 'readonly');
    const store = tx.objectStore(STORE_RECENTS);
    const req = store.get(id);

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          resolve(null);
        } else {
          resolve({
            rows: result.rows || [],
            meta: result.meta,
            mapping: result.mapping,
            sheetAnalysis: result.sheetAnalysis
          });
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to load recent file record:', err);
    return null;
  }
}

export async function deleteRecentFileRecord(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_RECENTS], 'readwrite');
    const store = tx.objectStore(STORE_RECENTS);
    store.delete(id);

    const updated = getRecentFilesMetaList().filter((f) => f.id !== id);
    saveRecentFilesMetaList(updated);

    await new Promise((resolve) => {
      tx.oncomplete = () => resolve(null);
      tx.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to delete recent file record:', err);
  }
}


