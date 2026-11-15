import type {NepaliFontId} from './preetiEngine';

export type WorkspaceMode =
  | 'preeti-to-unicode'
  | 'unicode-to-preeti'
  | 'multi-font'
  | 'romanized';

export interface HistoryItem {
  id: string;
  mode: WorkspaceMode;
  fromFont: NepaliFontId;
  toFont: NepaliFontId;
  sourceLabel: string;
  targetLabel: string;
  input: string;
  output: string;
  previewText: string;
  createdAt: string;
}

export const HISTORY_STORAGE_KEY = 'nepali_unicode_studio_history_v1';
export const MAX_HISTORY_ITEMS = 5;

export function loadConversionHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is HistoryItem =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.input === 'string' &&
          typeof item.output === 'string',
      )
      .map((item) => ({
        ...item,
        fromFont: item.fromFont || 'preeti',
        toFont: item.toFont || 'unicode',
        previewText: item.previewText || item.output,
      }))
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function saveConversionHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)),
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function upsertConversionHistory(
  existing: HistoryItem[],
  nextItem: HistoryItem,
): HistoryItem[] {
  const deduped = existing.filter(
    (h) =>
      !(
        h.input === nextItem.input &&
        h.mode === nextItem.mode &&
        h.fromFont === nextItem.fromFont &&
        h.toFont === nextItem.toFont
      ),
  );
  return [nextItem, ...deduped].slice(0, MAX_HISTORY_ITEMS);
}
